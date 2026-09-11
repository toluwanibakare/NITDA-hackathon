import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { checkRequestPure } from './lib/riskEngine.js';
import { supabase } from './supabase.js';

const app = express();
app.use(cors({ origin: (process.env.WEB_URL ?? '*').split(',') }));
app.use(express.json({ limit: '100kb' }));

app.get('/healthz', (_req, res) => res.json({ ok: true, service: 'thirdeye-api' }));

// POST /api/check-request — core middleware (TECH_PRD §4-5)
app.post('/api/check-request', async (req, res) => {
  try {
    const body = req.body;
    const { data: integration } = await supabase.from('integrations').select('*').eq('id', body.integrationId).single();
    const profile = integration
      ? {
          id: integration.id, name: integration.name, purpose: integration.purpose,
          allowedEndpoints: integration.allowed_endpoints ?? [], allowedMethods: integration.allowed_methods ?? ['GET', 'POST'],
          allowedData: integration.allowed_data ?? [], forbiddenData: integration.forbidden_data ?? [],
          expectedRequestRate: integration.expected_request_rate ?? 100,
        }
      : null;
    const result = checkRequestPure(body, profile);
    // persist request + event + update integration risk (best-effort)
    await supabase.from('requests').insert({
      integration_id: body.integrationId, endpoint: body.endpoint, method: body.method,
      data_requested: body.dataRequested ?? [], risk_score: result.riskScore, action: result.action, reason: result.reason,
    });
    if (result.violations.length && integration) {
      await supabase.from('security_events').insert({
        integration_id: body.integrationId, endpoint: body.endpoint,
        event_type: result.violations[0].code, risk_score: result.riskScore, action: result.action, reason: result.reason,
      });
      const status = result.level === 'CRITICAL' ? 'QUARANTINED' : result.level === 'HIGH_RISK' ? 'RATE_LIMITED' : result.level === 'SUSPICIOUS' ? 'MONITORED' : 'ACTIVE';
      await supabase.from('integrations').update({ risk_score: result.riskScore, status }).eq('id', body.integrationId);
    }
    console.log(`[check] ${body.integrationId} ${body.endpoint} → ${result.riskScore} ${result.action}`);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? 'check failed', code: 'CHECK_FAILED' });
  }
});

// Minimal CRUD + dashboard + quarantine/release stubs — BE-1 expands.
app.get('/api/integrations', async (_req, res) => {
  const { data, error } = await supabase.from('integrations').select('*').order('risk_score', { ascending: false });
  if (error) return res.status(500).json({ error: error.message, code: 'DB_ERROR' });
  res.json(data);
});
app.get('/api/integrations/:id', async (req, res) => {
  const { data, error } = await supabase.from('integrations').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'not found', code: 'NOT_FOUND' });
  const { data: events } = await supabase.from('security_events').select('*').eq('integration_id', req.params.id).order('created_at', { ascending: false }).limit(5);
  res.json({ profile: data, recentViolations: events ?? [] });
});
app.get('/api/security-events', async (req, res) => {
  let q = supabase.from('security_events').select('*').order('created_at', { ascending: false }).limit(Number(req.query.limit ?? 50));
  if (req.query.integrationId) q = q.eq('integration_id', String(req.query.integrationId));
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message, code: 'DB_ERROR' });
  res.json(data);
});
app.get('/api/dashboard/stats', async (_req, res) => {
  const { data } = await supabase.from('integrations').select('id,status,risk_score');
  const list = data ?? [];
  const { count: threats } = await supabase.from('security_events').select('id', { count: 'exact', head: true });
  const { count: monitored } = await supabase.from('requests').select('id', { count: 'exact', head: true });
  res.json({
    integrations: list.length, active: list.filter((i: any) => i.status === 'ACTIVE').length,
    monitoredRequests: monitored ?? 0, threats: threats ?? 0,
    quarantined: list.filter((i: any) => i.status === 'QUARANTINED').length,
  });
});
app.post('/api/integrations/:id/quarantine', async (req, res) => {
  await supabase.from('integrations').update({ status: 'QUARANTINED' }).eq('id', req.params.id);
  await supabase.from('security_events').insert({ integration_id: req.params.id, event_type: 'QUARANTINED', risk_score: 95, action: 'QUARANTINE', reason: req.body.reason ?? 'Manual quarantine' });
  res.json({ status: 'QUARANTINED' });
});
app.post('/api/integrations/:id/release', async (req, res) => {
  await supabase.from('integrations').update({ status: 'ACTIVE', risk_score: 8 }).eq('id', req.params.id);
  await supabase.from('security_events').insert({ integration_id: req.params.id, event_type: 'RELEASED', risk_score: 8, action: 'ALLOW', reason: 'Released by security team' });
  res.json({ status: 'ACTIVE', risk_score: 8 });
});
// Simulator: emits phased attack via repeated check-request — BE-2 expands to timed session.
app.post('/api/simulator/start', async (req, res) => {
  const { integrationId = 'analytics_001' } = req.body ?? {};
  const phases = [
    { endpoint: '/analytics/events', dataRequested: ['event'], requestCount: 95 },
    { endpoint: '/customers/profile', dataRequested: ['event'], requestCount: 300 },
    { endpoint: '/customers/payment-details', dataRequested: ['payment', 'phone', 'address'], requestCount: 800 },
    { endpoint: '/customers/payment-details', dataRequested: ['payment', 'phone', 'address'], requestCount: 1780 },
  ];
  const results = [];
  for (const p of phases) {
    const r = await fetch(`http://localhost:${process.env.PORT ?? 4000}/api/check-request`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ integrationId, method: 'GET', ...p }),
    }).then((x) => x.json()).catch(() => ({ phase: p, note: 'run via frontend loop if api not self-reachable' }));
    results.push(r);
  }
  res.json({ sessionId: `sim_${Date.now()}`, integrationId, phases: results });
});
app.post('/api/simulator/stop', (_req, res) => res.json({ stopped: true }));

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`[thirdeye-api] listening on :${port}`));
