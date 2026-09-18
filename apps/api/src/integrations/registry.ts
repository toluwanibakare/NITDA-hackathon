import { IntegrationProfile, IntegrationStatus } from '@thirdeye/shared';

export interface IntegrationRecord extends IntegrationProfile {
  // Aliases for backwards compatibility with database/legacy formats
  allowed_endpoints: string[];
  allowed_methods: string[];
  allowed_data: string[];
  forbidden_data: string[];
  expected_request_rate: number;
  current_request_rate: number;
  risk_score: number;
  api_key: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

const INITIAL_INTEGRATIONS: Record<string, IntegrationRecord> = {
  payment_001: {
    id: 'payment_001',
    name: 'StripeX Payments',
    purpose: 'Process checkout transactions & refunds',
    status: 'ACTIVE',
    riskScore: 8,
    risk_score: 8,
    expectedRequestRate: 120,
    expected_request_rate: 120,
    currentRequestRate: 120,
    current_request_rate: 120,
    allowedEndpoints: ['/payments', '/payments/status', '/refunds', '/payments/:id'],
    allowed_endpoints: ['/payments', '/payments/status', '/refunds', '/payments/:id'],
    allowedMethods: ['GET', 'POST'],
    allowed_methods: ['GET', 'POST'],
    allowedFields: ['order_id', 'amount', 'currency', 'transaction_id', 'status'],
    allowed_data: ['order_id', 'amount', 'currency', 'transaction_id', 'status'],
    forbiddenFields: [
      'password',
      'customer_profile',
      'marketing_data',
      'customer_password',
      'internal_margin',
    ],
    forbidden_data: [
      'password',
      'customer_profile',
      'marketing_data',
      'customer_password',
      'internal_margin',
    ],
    testApiKey: 'sec_test_payment_key_120',
    api_key: 'sec_test_payment_key_120',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  delivery_001: {
    id: 'delivery_001',
    name: 'ShipFast Logistics',
    purpose: 'Fulfill and dispatch customer parcels',
    status: 'ACTIVE',
    riskScore: 12,
    risk_score: 12,
    expectedRequestRate: 80,
    expected_request_rate: 80,
    currentRequestRate: 80,
    current_request_rate: 80,
    allowedEndpoints: [
      '/orders',
      '/orders/dispatch',
      '/delivery',
      '/delivery/status',
      '/shipments',
      '/shipments/:id',
    ],
    allowed_endpoints: [
      '/orders',
      '/orders/dispatch',
      '/delivery',
      '/delivery/status',
      '/shipments',
      '/shipments/:id',
    ],
    allowedMethods: ['GET', 'POST'],
    allowed_methods: ['GET', 'POST'],
    allowedFields: ['order_id', 'recipient_name', 'delivery_address', 'customer_name', 'phone', 'items'],
    allowed_data: ['order_id', 'recipient_name', 'delivery_address', 'customer_name', 'phone', 'items'],
    forbiddenFields: ['payment', 'password', 'marketing', 'card_number', 'cvv', 'password_hash'],
    forbidden_data: ['payment', 'password', 'marketing', 'card_number', 'cvv', 'password_hash'],
    testApiKey: 'sec_test_delivery_key_80',
    api_key: 'sec_test_delivery_key_80',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  analytics_001: {
    id: 'analytics_001',
    name: 'MixMetrics Telemetry',
    purpose: 'Collect anonymous usage & funnel analytics',
    status: 'ACTIVE',
    riskScore: 8,
    risk_score: 8,
    expectedRequestRate: 100,
    expected_request_rate: 100,
    currentRequestRate: 100,
    current_request_rate: 100,
    allowedEndpoints: ['/analytics/events', '/analytics/metrics'],
    allowed_endpoints: ['/analytics/events', '/analytics/metrics'],
    allowedMethods: ['GET', 'POST'],
    allowed_methods: ['GET', 'POST'],
    allowedFields: [
      'anonymous_user_id',
      'anonymous_id',
      'page',
      'event',
      'event_type',
      'timestamp',
      'url',
      'device',
    ],
    allowed_data: [
      'anonymous_user_id',
      'anonymous_id',
      'page',
      'event',
      'event_type',
      'timestamp',
      'url',
      'device',
    ],
    forbiddenFields: [
      'payment',
      'phone',
      'address',
      'password',
      'customer',
      'customer_name',
      'card_details',
      'email',
    ],
    forbidden_data: [
      'payment',
      'phone',
      'address',
      'password',
      'customer',
      'customer_name',
      'card_details',
      'email',
    ],
    testApiKey: 'sec_test_analytics_key_100',
    api_key: 'sec_test_analytics_key_100',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  marketing_001: {
    id: 'marketing_001',
    name: 'KlavioCampaigns',
    purpose: 'Manage promotional email/SMS broadcasts',
    status: 'ACTIVE',
    riskScore: 22,
    risk_score: 22,
    expectedRequestRate: 95,
    expected_request_rate: 95,
    currentRequestRate: 95,
    current_request_rate: 95,
    allowedEndpoints: ['/campaigns', '/campaigns/events', '/campaigns/broadcast'],
    allowed_endpoints: ['/campaigns', '/campaigns/events', '/campaigns/broadcast'],
    allowedMethods: ['GET', 'POST'],
    allowed_methods: ['GET', 'POST'],
    allowedFields: [
      'campaign_id',
      'anonymous_user_id',
      'event',
      'audience_tag',
      'template_id',
      'scheduled_at',
    ],
    allowed_data: [
      'campaign_id',
      'anonymous_user_id',
      'event',
      'audience_tag',
      'template_id',
      'scheduled_at',
    ],
    forbiddenFields: ['payment', 'password', 'card_number', 'cvv', 'order_financials', 'admin_credentials'],
    forbidden_data: ['payment', 'password', 'card_number', 'cvv', 'order_financials', 'admin_credentials'],
    testApiKey: 'sec_test_marketing_key_95',
    api_key: 'sec_test_marketing_key_95',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  support_001: {
    id: 'support_001',
    name: 'ZendeskDesk Care',
    purpose: 'Resolve customer inquiries and ticket escalations',
    status: 'ACTIVE',
    riskScore: 15,
    risk_score: 15,
    expectedRequestRate: 60,
    expected_request_rate: 60,
    currentRequestRate: 60,
    current_request_rate: 60,
    allowedEndpoints: ['/tickets', '/tickets/:id', '/customers/:id/summary'],
    allowed_endpoints: ['/tickets', '/tickets/:id', '/customers/:id/summary'],
    allowedMethods: ['GET', 'POST'],
    allowed_methods: ['GET', 'POST'],
    allowedFields: ['ticket_id', 'customer_name', 'email', 'issue_description', 'order_id', 'status'],
    allowed_data: ['ticket_id', 'customer_name', 'email', 'issue_description', 'order_id', 'status'],
    forbiddenFields: [
      'card_cvv',
      'password_hash',
      'full_credit_card',
      'system_logs',
      'card_number',
      'password',
    ],
    forbidden_data: [
      'card_cvv',
      'password_hash',
      'full_credit_card',
      'system_logs',
      'card_number',
      'password',
    ],
    testApiKey: 'sec_test_support_key_60',
    api_key: 'sec_test_support_key_60',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
};

// Mutable runtime registry in memory
export const integrationRegistry: Record<string, IntegrationRecord> = JSON.parse(
  JSON.stringify(INITIAL_INTEGRATIONS)
);

export function getAllIntegrations(): IntegrationRecord[] {
  return Object.values(integrationRegistry);
}

export function getIntegrationById(id: string): IntegrationRecord | null {
  return integrationRegistry[id] || null;
}

export function getIntegrationByApiKey(apiKey: string): IntegrationRecord | null {
  if (!apiKey) return null;
  const cleanKey = apiKey.trim();
  return (
    Object.values(integrationRegistry).find(
      item => item.testApiKey === cleanKey || item.api_key === cleanKey
    ) || null
  );
}

export function updateIntegrationStatus(
  id: string,
  status: IntegrationStatus,
  riskScore?: number
): IntegrationRecord | null {
  const item = integrationRegistry[id];
  if (!item) return null;

  item.status = status;
  if (typeof riskScore === 'number') {
    item.riskScore = riskScore;
    item.risk_score = riskScore;
  }
  item.updatedAt = new Date().toISOString();
  return item;
}

export function resetIntegration(id: string): IntegrationRecord | null {
  const initial = INITIAL_INTEGRATIONS[id];
  if (!initial) return null;
  integrationRegistry[id] = JSON.parse(JSON.stringify(initial));
  integrationRegistry[id].updatedAt = new Date().toISOString();
  return integrationRegistry[id];
}

export function resetAllIntegrations(): void {
  for (const id of Object.keys(INITIAL_INTEGRATIONS)) {
    resetIntegration(id);
  }
}
