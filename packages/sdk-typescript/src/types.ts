// Vendored copy of the type contracts from packages/shared/src/index.ts.
// Inlined so @the-third-eye/sdk has zero runtime dependencies and can be
// published to npm without publishing @thirdeye/shared. Keep in sync
// with the source of truth when contracts change.

export type RiskLevel = 'TRUSTED' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CRITICAL';
export type Action = 'ALLOW' | 'MONITOR' | 'RATE_LIMIT' | 'BLOCK' | 'QUARANTINE';
export type IntegrationStatus = 'ACTIVE' | 'MONITORED' | 'RATE_LIMITED' | 'QUARANTINED';

export type EventType =
  | 'PURPOSE_VIOLATION'
  | 'FORBIDDEN_DATA'
  | 'UNKNOWN_ENDPOINT'
  | 'ABNORMAL_VOLUME'
  | 'UNKNOWN_INTEGRATION'
  | 'QUARANTINED'
  | 'RELEASED';

export interface TrustProfile {
  id: string;
  name: string;
  purpose: string;
  allowedEndpoints: string[];
  allowedMethods: string[];
  allowedData: string[];
  forbiddenData: string[];
  expectedRequestRate: number;
}

export interface CheckRequest {
  integrationId: string;
  method: string;
  endpoint: string;
  dataRequested?: string[];
  requestCount?: number;
  timestamp?: string;
  contextEvent?: 'none' | 'black_friday' | 'campaign_launch' | 'known_spike';
  headers?: Record<string, string>;
  sourceIp?: string;
}

export interface Violation {
  code: EventType | 'UNKNOWN_METHOD' | 'UNUSUAL_TIME' | 'PURPOSE_MISMATCH';
  detail: string;
  points: number;
}

export interface CheckResult {
  riskScore: number;
  level: RiskLevel;
  violations: Violation[];
  action: Action;
  reason: string;
  explainableSummary?: string;
  driftScore?: number;
  driftTrajectory?: string;
  maskedFields?: string[];
  evaluatedAt?: string;
}

export interface SecurityEvent {
  id?: string;
  integrationId: string;
  endpoint?: string;
  eventType: EventType;
  riskScore: number;
  action: Action;
  reason: string;
  createdAt?: string;
  timestamp?: string;
}

export interface IntegrationListItem {
  id: string;
  name: string;
  purpose: string;
  status: IntegrationStatus;
  riskScore: number;
  expectedRequestRate: number;
  currentRequestRate?: number;
  allowedEndpoints: string[];
  allowedMethods: string[];
  allowedData: string[];
  forbiddenData: string[];
  lastActivity?: string;
}

export interface IntegrationDetailResponse {
  profile: IntegrationListItem;
  behaviour: {
    normalRate: number;
    currentRate: number;
    deviationMultiple: number;
  };
  recentViolations: SecurityEvent[];
}

export interface DashboardStats {
  integrations: number;
  active: number;
  monitoredRequests: number;
  threats: number;
  quarantined: number;
}

export interface ActivityItem {
  id: string;
  type: 'NORMAL' | 'VIOLATION' | 'QUARANTINE' | 'RELEASE';
  integrationId: string;
  integrationName?: string;
  endpoint?: string;
  action: Action;
  riskScore: number;
  reason: string;
  timestamp: string;
}
