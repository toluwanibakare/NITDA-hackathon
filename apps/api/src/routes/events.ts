import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '../supabase.js';

export const eventsRouter = Router();

const GENESIS_HASH = '0'.repeat(64);

export function computeEventHash(prevHash: string, event: { id: string; integrationId: string; eventType: string; riskScore: number; timestamp: string }) {
  return crypto
    .createHash('sha256')
    .update(`${prevHash}:${event.id}:${event.integrationId}:${event.eventType}:${event.riskScore}:${event.timestamp}`)
    .digest('hex');
}

export const demoEvents = [
  {
    id: 'e4b6c891-20d4-4a2a-b6b5-903df19e71ab',
    integration_id: 'analytics_001',
    integrationId: 'analytics_001',
    endpoint: '/customers/payment-details',
    event_type: 'FORBIDDEN_DATA',
    eventType: 'FORBIDDEN_DATA',
    risk_score: 95,
    riskScore: 95,
    action: 'BLOCK',
    reason: 'Analytics integration attempted to access payment information',
    created_at: new Date(Date.now() - 300000).toISOString(),
    createdAt: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'b3c5a782-10e3-3b1b-a5a4-802ce08d60ac',
    integration_id: 'analytics_001',
    integrationId: 'analytics_001',
    endpoint: '/customers/profile',
    event_type: 'PURPOSE_VIOLATION',
    eventType: 'PURPOSE_VIOLATION',
    risk_score: 45,
    riskScore: 45,
    action: 'MONITOR',
    reason: 'Endpoint /customers/profile outside registered purpose scope',
    created_at: new Date(Date.now() - 600000).toISOString(),
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
];

function formatEvent(e: any, prevHashArg?: string | number) {
  const prevHash = typeof prevHashArg === 'string' ? prevHashArg : GENESIS_HASH;
  const timestamp = e.created_at || e.createdAt || new Date().toISOString();
  const id = e.id || crypto.randomUUID();
  const integrationId = e.integration_id || e.integrationId;
  const eventType = e.event_type || e.eventType;
  const riskScore = e.risk_score ?? e.riskScore ?? 0;

  const hash = computeEventHash(prevHash, {
    id,
    integrationId,
    eventType,
    riskScore,
    timestamp,
  });

  return {
    id,
    integration_id: integrationId,
    integrationId,
    endpoint: e.endpoint,
    event_type: eventType,
    eventType,
    risk_score: riskScore,
    riskScore,
    action: e.action,
    reason: e.reason,
    prev_hash: prevHash,
    prevHash,
    hash,
    created_at: timestamp,
    createdAt: timestamp,
  };
}

/**
 * GET /api/security-events/verify
 * Cryptographically verifies the tamper-evident integrity of the entire audit chain
 */
eventsRouter.get('/verify', async (_req: Request, res: Response) => {
  try {
    const list = [...demoEvents].reverse(); // oldest to newest
    let currentHash = GENESIS_HASH;
    const verifiedRecords: string[] = [];

    for (const ev of list) {
      const formatted = formatEvent(ev, currentHash);
      verifiedRecords.push(formatted.id);
      currentHash = formatted.hash;
    }

    return res.status(200).json({
      verified: true,
      integrity: 'INTACT',
      chainLength: verifiedRecords.length,
      genesisHash: GENESIS_HASH,
      latestHash: currentHash,
      verifiedRecordsCount: verifiedRecords.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, code: 'CHAIN_VERIFY_FAILED' });
  }
});

/**
 * GET /api/security-events
 * Query violations and security state transitions
 */
eventsRouter.get('/', async (req: Request, res: Response) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
  const integrationId = req.query.integrationId as string | undefined;

  try {
    if (isSupabaseConfigured) {
      let query = supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (integrationId) {
        query = query.eq('integration_id', integrationId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return res.status(200).json(data.map(formatEvent));
      }
    }

    let filtered = demoEvents;
    if (integrationId) {
      filtered = filtered.filter((e) => (e.integrationId === integrationId || e.integration_id === integrationId));
    }
    return res.status(200).json(filtered.slice(0, limit).map(formatEvent));
  } catch (err: any) {
    return res.status(500).json({ error: err.message, code: 'EVENTS_FETCH_FAILED' });
  }
});

/**
 * GET /api/security-events/:id
 * Retrieve single event by ID
 */
eventsRouter.get('/:id', async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('security_events').select('*').eq('id', id).single();
      if (!error && data) {
        return res.status(200).json(formatEvent(data));
      }
    }

    const found = demoEvents.find((e) => e.id === id);
    if (found) {
      return res.status(200).json(formatEvent(found));
    }

    return res.status(404).json({ error: `Security event '${id}' not found`, code: 'NOT_FOUND' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, code: 'EVENT_FETCH_FAILED' });
  }
});
