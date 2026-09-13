import { Router, Request, Response } from 'express';
import { activeSessions, DEMO_PHASES, SimulatorSession } from '../simulator/attackEngine.js';
import { supabase, isSupabaseConfigured } from '../supabase.js';

export const simulatorRouter = Router();

/**
 * POST /api/simulator/start
 * Launches a phased attack sequence against a target integration
 */
simulatorRouter.post('/start', async (req: Request, res: Response) => {
  const { integrationId = 'analytics_001', attack = 'credential_compromise' } = req.body || {};
  const sessionId = `sim_${Date.now()}`;

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
    phases: DEMO_PHASES,
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

  return res.status(200).json({
    reset: true,
    integrationId,
    status: 'ACTIVE',
    riskScore: 8,
    message: 'Integration reset back to trusted baseline.',
  });
});
