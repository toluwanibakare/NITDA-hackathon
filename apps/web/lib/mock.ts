import type { DashboardStats, IntegrationRow, SecEvent } from './api';

export const MOCK_STATS: DashboardStats = {
  integrations: 4,
  active: 3,
  monitoredRequests: 12480,
  threats: 7,
  quarantined: 1,
};

export const MOCK_INTEGRATIONS: IntegrationRow[] = [
  {
    id: 'payment_001',
    name: 'Payment Provider',
    purpose: 'Process payments',
    status: 'ACTIVE',
    risk_score: 8,
    expected_request_rate: 120,
    allowed_endpoints: ['/payments', '/payments/status'],
    allowed_methods: ['GET', 'POST'],
    allowed_data: ['order_id', 'amount', 'transaction_id'],
    forbidden_data: ['password', 'customer_profile', 'marketing_data'],
    requestsPerMin: 120,
    lastActivity: '12s ago',
  },
  {
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
    requestsPerMin: 80,
    lastActivity: '8s ago',
  },
  {
    id: 'analytics_001',
    name: 'Analytics Provider',
    purpose: 'Collect anonymous usage statistics',
    status: 'QUARANTINED',
    risk_score: 95,
    expected_request_rate: 100,
    allowed_endpoints: ['/analytics/events', '/analytics/metrics'],
    allowed_methods: ['GET', 'POST'],
    allowed_data: ['anonymous_user_id', 'page', 'event', 'timestamp'],
    forbidden_data: ['payment', 'phone', 'address', 'password', 'customer'],
    requestsPerMin: 1780,
    lastActivity: '4s ago',
  },
  {
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
    requestsPerMin: 95,
    lastActivity: '21s ago',
  },
];

const now = Date.now();
export const MOCK_EVENTS: SecEvent[] = [
  { id: 'e1', integration_id: 'analytics_001', event_type: 'QUARANTINED', endpoint: '/customers/payment-details', risk_score: 95, action: 'QUARANTINE', reason: 'Analytics integration attempted to access payment information outside registered purpose. 17.8x normal traffic.', created_at: new Date(now - 40 * 1000).toISOString() },
  { id: 'e2', integration_id: 'analytics_001', event_type: 'ABNORMAL_VOLUME', endpoint: '/customers/payment-details', risk_score: 88, action: 'BLOCK', reason: '1780 req/min vs normal 100 req/min', created_at: new Date(now - 90 * 1000).toISOString() },
  { id: 'e3', integration_id: 'analytics_001', event_type: 'FORBIDDEN_DATA', endpoint: '/customers/payment-details', risk_score: 72, action: 'RATE_LIMIT', reason: 'Forbidden data requested: payment, phone, address', created_at: new Date(now - 140 * 1000).toISOString() },
  { id: 'e4', integration_id: 'analytics_001', event_type: 'PURPOSE_VIOLATION', endpoint: '/customers/profile', risk_score: 45, action: 'MONITOR', reason: 'Endpoint outside allowed scope for purpose "Collect anonymous usage statistics"', created_at: new Date(now - 200 * 1000).toISOString() },
  { id: 'e5', integration_id: 'marketing_001', event_type: 'UNKNOWN_ENDPOINT', endpoint: '/campaigns/draft', risk_score: 22, action: 'ALLOW', reason: 'Endpoint drift within tolerance', created_at: new Date(now - 320 * 1000).toISOString() },
  { id: 'e6', integration_id: 'delivery_001', event_type: 'ABNORMAL_VOLUME', endpoint: '/delivery/status', risk_score: 12, action: 'ALLOW', reason: 'Minor burst, within seasonal tolerance', created_at: new Date(now - 500 * 1000).toISOString() },
];

export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}
