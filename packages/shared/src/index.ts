// ThirdEye shared contracts — single source of truth for web + api.
// TECH_PRD §4-5. Do not change without group OK.

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
}

export interface SecurityEvent {
  id?: string;
  integrationId: string;
  endpoint?: string;
  eventType: EventType;
  riskScore: number;
  action: Action;
  reason: string;
  timestamp?: string;
}

export const RISK_THRESHOLDS = { suspicious: 31, high: 61, critical: 81 };
export function levelForScore(score: number): RiskLevel {
  if (score >= 81) return 'CRITICAL';
  if (score >= 61) return 'HIGH_RISK';
  if (score >= 31) return 'SUSPICIOUS';
  return 'TRUSTED';
}
export function actionForLevel(level: RiskLevel): Action {
  switch (level) {
    case 'TRUSTED': return 'ALLOW';
    case 'SUSPICIOUS': return 'MONITOR';
    case 'HIGH_RISK': return 'RATE_LIMIT';
    case 'CRITICAL': return 'BLOCK';
  }
}
