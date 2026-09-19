import { Router, Request, Response } from 'express';
import { activeSessions, DEMO_PHASES, SimulatorSession } from '../simulator/attackEngine.js';
import { supabase, isSupabaseConfigured } from '../supabase.js';
import { fallbackIntegrations } from './integrations.js';
import { getTrustProfileById } from '../lib/trustProfileStore.js';

export const simulatorRouter = Router();

export function generatePhasesForIntegration(integration: any) {
  const allowedEndpoints: string[] = integration.allowed_endpoints || integration.allowedEndpoints || ['/api'];
  const allowedMethods: string[] = integration.allowed_methods || integration.allowedMethods || ['GET', 'POST'];
  const allowedData: string[] = integration.allowed_data || integration.allowedData || ['anonymous_user_id'];
  const forbiddenData: string[] = integration.forbidden_data || integration.forbiddenData || ['payment', 'password'];
  const expectedRate: number = Number(integration.expected_request_rate || integration.expectedRequestRate || 100);

  const normalEndpoint = allowedEndpoints[0] || '/api';
  const normalMethod = allowedMethods[0] || 'GET';
  const normalData = allowedData.length > 0 ? allowedData.slice(0, 2) : ['event'];

  const probeCandidates = ['/customers/profile', '/internal/admin/config', '/api/users/profile', '/settings/audit'];
  const probeEndpoint = probeCandidates.find(c => !allowedEndpoints.includes(c)) || '/internal/probe';

  const sensitiveCandidates = ['/customers/payment-details', '/internal/vault/credentials', '/customers/credentials', '/security/keys'];
  const sensitiveEndpoint = sensitiveCandidates.find(c => !allowedEndpoints.includes(c)) || '/customers/payment-details';

  const forbiddenSlice = forbiddenData.length > 0 ? forbiddenData.slice(0, 2) : ['payment', 'phone'];
  const forbiddenAll = forbiddenData.length > 0 ? forbiddenData : ['payment', 'phone', 'address'];

  return [
    {
      phase: 1,
      name: 'Normal Operation',
      endpoint: normalEndpoint,
      method: normalMethod,
      dataRequested: normalData,
      requestCount: Math.max(10, Math.round(expectedRate * 0.85)),
      expectedRisk: 5,
      expectedAction: 'ALLOW',
    },
    {
      phase: 2,
      name: 'Endpoint Probe (Reconnaissance)',
      endpoint: probeEndpoint,
      method: 'GET',
      dataRequested: normalData.slice(0, 1),
      requestCount: Math.round(expectedRate * 2.5),
      expectedRisk: 45,
      expectedAction: 'MONITOR',
    },
    {
      phase: 3,
      name: 'Sensitive Data Exfiltration Surge',
      endpoint: sensitiveEndpoint,
      method: 'GET',
      dataRequested: forbiddenSlice,
      requestCount: Math.round(expectedRate * 6),
      expectedRisk: 75,
      expectedAction: 'RATE_LIMIT',
    },
    {
      phase: 4,
      name: 'Full Breach Spike & Auto-Quarantine',
      endpoint: sensitiveEndpoint,
      method: 'GET',
      dataRequested: forbiddenAll,
      requestCount: Math.round(expectedRate * 15),
      expectedRisk: 95,
      expectedAction: 'BLOCK',
    },
  ];
}

/**
 * POST /api/simulator/start
 * Launches a phased attack sequence against a target integration
 */
simulatorRouter.post('/start', async (req: Request, res: Response) => {
  const { integrationId = 'analytics_001', attack = 'credential_compromise' } = req.body || {};
  const sessionId = `sim_${Date.now()}`;
  const now = new Date().toISOString();

  let targetIntegration: any = null;

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .maybeSingle();
      if (data) {
        targetIntegration = data;
        if (data.status === 'QUARANTINED') {
          await supabase
            .from('integrations')
            .update({ status: 'ACTIVE', risk_score: 8, updated_at: now })
            .eq('id', integrationId);
          targetIntegration.status = 'ACTIVE';
          targetIntegration.risk_score = 8;
        }
      }
    } catch (err) {
      console.error('[simulator] Error loading integration from Supabase:', err);
    }
  }

  if (!targetIntegration) {
    targetIntegration = fallbackIntegrations[integrationId] || (await getTrustProfileById(integrationId));
    if (targetIntegration && targetIntegration.status === 'QUARANTINED') {
      targetIntegration.status = 'ACTIVE';
      targetIntegration.risk_score = 8;
    }
  }

  const phases = targetIntegration ? generatePhasesForIntegration(targetIntegration) : DEMO_PHASES;

  const session: SimulatorSession = {
    sessionId,
    integrationId,
    attackType: attack,
    status: 'running',
    currentPhase: 1,
    startTime: Date.now(),
  };
  activeSessions.set(sessionId, session);

  return res.status(200).json({
    sessionId,
    integrationId,
    status: 'running',
    phases,
  });
});

/**
 * POST /api/simulator/stop
 * Terminates an active simulation session
 */
simulatorRouter.post('/stop', (req: Request, res: Response) => {
  const { sessionId } = req.body || {};
  if (sessionId && activeSessions.has(sessionId)) {
    const session = activeSessions.get(sessionId)!;
    session.status = 'stopped';
  }
  return res.status(200).json({ stopped: true, sessionId });
});

/**
 * POST /api/simulator/reset
 * Resets integration state and risk scores back to normal baseline
 */
simulatorRouter.post('/reset', async (req: Request, res: Response) => {
  const { integrationId = 'analytics_001' } = req.body || {};
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('integrations')
        .update({ status: 'ACTIVE', risk_score: 8, updated_at: now })
        .eq('id', integrationId);

      await supabase.from('security_events').insert({
        integration_id: integrationId,
        event_type: 'RELEASED',
        risk_score: 8,
        action: 'ALLOW',
        reason: 'Integration reset back to baseline monitoring state',
        created_at: now,
      });
    } catch (err) {
      console.error('[simulator] Reset error:', err);
    }
  }

  if (fallbackIntegrations[integrationId]) {
    fallbackIntegrations[integrationId].status = 'ACTIVE';
    fallbackIntegrations[integrationId].risk_score = 8;
    fallbackIntegrations[integrationId].updated_at = now;
  }

  return res.status(200).json({
    reset: true,
    integrationId,
    status: 'ACTIVE',
    riskScore: 8,
    message: 'Integration reset back to trusted baseline.',
  });
});
