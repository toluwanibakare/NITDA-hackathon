import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '../supabase.js';
import { demoEvents } from './events.js';

export const integrationsRouter = Router();

// In-memory fallback dataset for offline or unconfigured environments
export const fallbackIntegrations: Record<string, any> = {
  payment_001: {
    id: 'payment_001',
    name: 'Payment Provider',
    purpose: 'Process payments and transactions',
    status: 'ACTIVE',
    risk_score: 8,
    expected_request_rate: 120,
    allowed_endpoints: ['/payments', '/payments/status'],
    allowed_methods: ['POST', 'GET'],
    allowed_data: ['order_id', 'amount', 'transaction_id'],
    forbidden_data: ['password', 'customer_profile', 'marketing_data'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  delivery_001: {
    id: 'delivery_001',
    name: 'Delivery Provider',
    purpose: 'Deliver customer orders',
    status: 'ACTIVE',
    risk_score: 12,
    expected_request_rate: 80,
    allowed_endpoints: ['/orders', '/delivery', '/delivery/status'],
    allowed_methods: ['GET', 'POST'],
    allowed_data: ['order_id', 'delivery_address', 'customer_name', 'phone'],
    forbidden_data: ['payment', 'password', 'marketing'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  analytics_001: {
    id: 'analytics_001',
    name: 'Analytics Provider',
    purpose: 'Collect anonymous usage statistics',
    status: 'ACTIVE',
    risk_score: 8,
    expected_request_rate: 100,
    allowed_endpoints: ['/analytics/events', '/analytics/metrics'],
    allowed_methods: ['GET', 'POST'],
    allowed_data: ['anonymous_user_id', 'page', 'event', 'timestamp'],
    forbidden_data: ['payment', 'phone', 'address', 'password', 'customer'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  marketing_001: {
    id: 'marketing_001',
    name: 'Marketing Provider',
    purpose: 'Manage marketing campaigns',
    status: 'ACTIVE',
    risk_score: 22,
    expected_request_rate: 95,
    allowed_endpoints: ['/campaigns', '/campaigns/events'],
    allowed_methods: ['GET', 'POST'],
    allowed_data: ['campaign_id', 'anonymous_user_id', 'event'],
    forbidden_data: ['payment', 'password'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

/**
 * Format an integration row to be compatible with both camelCase and snake_case consumers
 */
function formatIntegration(item: any) {
  const allowedEndpoints = item.allowed_endpoints || item.allowedEndpoints || [];
  const allowedMethods = item.allowed_methods || item.allowedMethods || ['GET', 'POST'];
  const allowedData = item.allowed_data || item.allowedData || [];
  const forbiddenData = item.forbidden_data || item.forbiddenData || [];
  const expectedRate = item.expected_request_rate ?? item.expectedRequestRate ?? 100;
  const riskScore = item.risk_score ?? item.riskScore ?? 0;
  const status = item.status || 'ACTIVE';
  const timestamp = item.updated_at || item.updatedAt || item.created_at || new Date().toISOString();

  return {
    id: item.id,
    name: item.name,
    purpose: item.purpose,
    status,
    risk_score: riskScore,
    riskScore,
    expected_request_rate: expectedRate,
    expectedRequestRate: expectedRate,
    currentRequestRate: expectedRate,
    requestsPerMin: expectedRate,
    allowed_endpoints: allowedEndpoints,
    allowedEndpoints,
    allowed_methods: allowedMethods,
    allowedMethods,
    allowed_data: allowedData,
    allowedData,
    forbidden_data: forbiddenData,
    forbiddenData,
    created_at: item.created_at || timestamp,
    updated_at: timestamp,
    lastActivity: timestamp,
  };
}

/**
 * GET /api/integrations
 * Retrieves all registered integrations with optional status, search, and sort filters
 */
integrationsRouter.get('/', async (req: Request, res: Response) => {
  const { status, search, sort } = req.query;

  try {
    let list: any[] = [];

    if (isSupabaseConfigured) {
      let query = supabase.from('integrations').select('*');
      if (status) {
        query = query.eq('status', String(status).toUpperCase());
      }
      if (sort === 'rate') {
        query = query.order('expected_request_rate', { ascending: false });
      } else if (sort === 'name') {
        query = query.order('name', { ascending: true });
      } else {
        query = query.order('risk_score', { ascending: false });
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        list = data.map(formatIntegration);
      }
    }

    if (list.length === 0) {
      list = Object.values(fallbackIntegrations).map(formatIntegration);
      if (status) {
        const filterStatus = String(status).toUpperCase();
        list = list.filter((i) => i.status === filterStatus);
      }
      if (sort === 'rate') {
        list.sort((a, b) => b.expectedRequestRate - a.expectedRequestRate);
      } else if (sort === 'name') {
        list.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        list.sort((a, b) => b.riskScore - a.riskScore);
      }
    }

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.purpose.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q)
      );
    }

    return res.status(200).json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message, code: 'INTEGRATIONS_FETCH_FAILED' });
  }
});

/**
 * GET /api/integrations/:id
 * Retrieves detailed profile, current vs expected rates, and recent violations
 */
integrationsRouter.get('/:id', async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    let integration: any = null;
    let recentViolations: any[] = [];

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('integrations').select('*').eq('id', id).single();
      if (!error && data) {
        integration = data;
        const { data: events } = await supabase
          .from('security_events')
          .select('*')
          .eq('integration_id', id)
          .order('created_at', { ascending: false })
          .limit(5);
        recentViolations = events || [];
      }
    }

    if (!integration) {
      integration = fallbackIntegrations[id];
    }

    if (!integration) {
      return res.status(404).json({ error: `Integration with id '${id}' not found`, code: 'NOT_FOUND' });
    }

    const formatted = formatIntegration(integration);
    const expectedRate = formatted.expectedRequestRate;
    const currentRate = integration.current_request_rate ?? expectedRate;

    return res.status(200).json({
      profile: formatted,
      behaviour: {
        normalRate: expectedRate,
        currentRate,
        deviationMultiple: Number((currentRate / Math.max(1, expectedRate)).toFixed(2)),
      },
      recentViolations: recentViolations.map((v) => ({
        id: v.id,
        integrationId: v.integration_id,
        eventType: v.event_type,
        endpoint: v.endpoint,
        riskScore: v.risk_score,
        action: v.action,
        reason: v.reason,
        createdAt: v.created_at,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, code: 'INTEGRATION_GET_FAILED' });
  }
});

/**
 * POST /api/integrations
 * Registers a new integration and initializes trust profile
 */
integrationsRouter.post('/', async (req: Request, res: Response) => {
  const {
    id,
    name,
    purpose,
    expectedRequestRate = 100,
    allowedEndpoints = [],
    allowedMethods = ['GET', 'POST'],
    allowedData = [],
    forbiddenData = [],
  } = req.body || {};

  if (!id || !name || !purpose) {
    return res.status(400).json({
      error: 'Missing required fields: id, name, and purpose are mandatory.',
      code: 'INVALID_INPUT',
    });
  }

  const now = new Date().toISOString();
  const newIntegration = {
    id,
    name,
    purpose,
    status: 'ACTIVE',
    risk_score: 0,
    expected_request_rate: expectedRequestRate,
    allowed_endpoints: allowedEndpoints,
    allowed_methods: allowedMethods,
    allowed_data: allowedData,
    forbidden_data: forbiddenData,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.from('integrations').insert(newIntegration);
    } catch (dbErr) {
      console.error('[integrations] Insert error:', dbErr);
    }
  }

  fallbackIntegrations[id] = newIntegration;

  return res.status(201).json(formatIntegration(newIntegration));
});

/**
 * PATCH /api/integrations/:id
 * Updates mutable fields such as expected rate or purpose
 */
integrationsRouter.patch('/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const updates = req.body || {};
  const now = new Date().toISOString();

  const dbUpdates: any = { updated_at: now };
  if (updates.purpose !== undefined) dbUpdates.purpose = updates.purpose;
  if (updates.expectedRequestRate !== undefined) dbUpdates.expected_request_rate = updates.expectedRequestRate;
  if (updates.status !== undefined) dbUpdates.status = updates.status;

  if (isSupabaseConfigured) {
    try {
      await supabase.from('integrations').update(dbUpdates).eq('id', id);
    } catch (err) {
      console.error('[integrations] Update error:', err);
    }
  }

  if (fallbackIntegrations[id]) {
    fallbackIntegrations[id] = { ...fallbackIntegrations[id], ...dbUpdates };
  }

  return res.status(200).json({
    id,
    expectedRequestRate: updates.expectedRequestRate ?? fallbackIntegrations[id]?.expected_request_rate,
    purpose: updates.purpose ?? fallbackIntegrations[id]?.purpose,
    status: updates.status ?? fallbackIntegrations[id]?.status,
    updatedAt: now,
  });
});

/**
 * POST /api/integrations/:id/quarantine
 * Immediately restricts an integration by locking status to QUARANTINED
 */
integrationsRouter.post('/:id/quarantine', async (req: Request, res: Response) => {
  const id = req.params.id;
  const reason = req.body?.reason || 'Quarantine applied by security operator';
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      await supabase.from('integrations').update({ status: 'QUARANTINED', risk_score: 95, updated_at: now }).eq('id', id);
      await supabase.from('security_events').insert({
        integration_id: id,
        event_type: 'QUARANTINED',
        risk_score: 95,
        action: 'BLOCK',
        reason,
        created_at: now,
      });
    } catch (err) {
      console.error('[integrations] Quarantine error:', err);
    }
  }

  if (fallbackIntegrations[id]) {
    fallbackIntegrations[id].status = 'QUARANTINED';
    fallbackIntegrations[id].risk_score = 95;
    fallbackIntegrations[id].updated_at = now;
  }

  demoEvents.unshift({
    id: crypto.randomUUID(),
    integration_id: id,
    integrationId: id,
    endpoint: fallbackIntegrations[id]?.allowed_endpoints?.[0] || '/api',
    event_type: 'QUARANTINED',
    eventType: 'QUARANTINED',
    risk_score: 95,
    riskScore: 95,
    action: 'BLOCK',
    reason,
    created_at: now,
    createdAt: now,
  });

  return res.status(200).json({
    id,
    status: 'QUARANTINED',
    riskScore: 95,
    quarantinedAt: now,
    reason,
  });
});

/**
 * POST /api/integrations/:id/release
 * Restores an integration from quarantine back to active monitoring
 */
integrationsRouter.post('/:id/release', async (req: Request, res: Response) => {
  const id = req.params.id;
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      await supabase.from('integrations').update({ status: 'ACTIVE', risk_score: 8, updated_at: now }).eq('id', id);
      await supabase.from('security_events').insert({
        integration_id: id,
        event_type: 'RELEASED',
        risk_score: 8,
        action: 'ALLOW',
        reason: 'Restored to active state by security operator',
        created_at: now,
      });
    } catch (err) {
      console.error('[integrations] Release error:', err);
    }
  }

  if (fallbackIntegrations[id]) {
    fallbackIntegrations[id].status = 'ACTIVE';
    fallbackIntegrations[id].risk_score = 8;
    fallbackIntegrations[id].updated_at = now;
  }

  demoEvents.unshift({
    id: crypto.randomUUID(),
    integration_id: id,
    integrationId: id,
    endpoint: fallbackIntegrations[id]?.allowed_endpoints?.[0] || '/api',
    event_type: 'RELEASED',
    eventType: 'RELEASED',
    risk_score: 8,
    riskScore: 8,
    action: 'ALLOW',
    reason: 'Restored to active state by security operator',
    created_at: now,
    createdAt: now,
  });

  return res.status(200).json({
    id,
    status: 'ACTIVE',
    riskScore: 8,
    releasedAt: now,
    message: 'Integration released and restored to active state',
  });
});
