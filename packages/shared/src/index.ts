// ThirdEye shared contracts for web client and API service.

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

export type ScenarioName = 'normal' | 'busy' | 'probe' | 'exfiltration' | 'breach';
export type DriftTrajectory = 'STABLE' | 'DEVIATING' | 'ESCALATING' | 'CRITICAL_BREACH';

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

export interface IntegrationProfile {
  id: string;
  name: string;
  purpose: string;
  status: IntegrationStatus;
  riskScore: number;
  expectedRequestRate: number;
  currentRequestRate?: number;
  allowedEndpoints: string[];
  allowedMethods: string[];
  allowedFields: string[];
  forbiddenFields: string[];
  testApiKey: string;
  createdAt?: string;
  updatedAt?: string;
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
  driftTrajectory?: DriftTrajectory;
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

// Integration DTOs
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

// Dashboard DTOs
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

// Simulator DTOs
export interface SimulatorPhase {
  phase: number;
  name: string;
  endpoint: string;
  dataRequested?: string[];
  requestCount: number;
  expectedRisk?: number;
  expectedAction?: Action;
}

export interface SimulatorStartResponse {
  sessionId: string;
  integrationId: string;
  status: 'running' | 'completed' | 'stopped';
  phases: SimulatorPhase[];
}

// Risk thresholds
export const RISK_THRESHOLDS = {
  suspicious: 31,
  high: 61,
  critical: 81,
} as const;

export function levelForScore(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.critical) return 'CRITICAL';
  if (score >= RISK_THRESHOLDS.high) return 'HIGH_RISK';
  if (score >= RISK_THRESHOLDS.suspicious) return 'SUSPICIOUS';
  return 'TRUSTED';
}

export function actionForLevel(level: RiskLevel): Action {
  switch (level) {
    case 'TRUSTED':
      return 'ALLOW';
    case 'SUSPICIOUS':
      return 'MONITOR';
    case 'HIGH_RISK':
      return 'RATE_LIMIT';
    case 'CRITICAL':
      return 'BLOCK';
  }
}
