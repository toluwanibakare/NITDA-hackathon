export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiSafe<T>(path: string, fallback: T, init?: RequestInit): Promise<{ data: T; live: boolean }> {
  try {
    const data = await api<T>(path, init);
    return { data, live: true };
  } catch {
    return { data: fallback, live: false };
  }
}

export interface IntegrationRow {
  id: string;
  name: string;
  purpose: string;
  status: string;
  risk_score?: number;
  riskScore?: number;
  expected_request_rate?: number;
  expectedRequestRate?: number;
  allowed_endpoints?: string[];
  allowedEndpoints?: string[];
  allowed_methods?: string[];
  allowedMethods?: string[];
  allowed_data?: string[];
  allowedData?: string[];
  forbidden_data?: string[];
  forbiddenData?: string[];
  updated_at?: string;
  updatedAt?: string;
  requestsPerMin?: number;
  lastActivity?: string;
}

export function getRiskScore(it: IntegrationRow): number {
  return it.risk_score ?? it.riskScore ?? 0;
}

export function getExpectedRate(it: IntegrationRow): number {
  return it.expected_request_rate ?? it.expectedRequestRate ?? 100;
}

export function getAllowedEndpoints(it: IntegrationRow): string[] {
  return it.allowed_endpoints ?? it.allowedEndpoints ?? [];
}

export function getAllowedMethods(it: IntegrationRow): string[] {
  return it.allowed_methods ?? it.allowedMethods ?? [];
}

export function getAllowedData(it: IntegrationRow): string[] {
  return it.allowed_data ?? it.allowedData ?? [];
}

export function getForbiddenData(it: IntegrationRow): string[] {
  return it.forbidden_data ?? it.forbiddenData ?? [];
}

export interface DashboardStats {
  integrations?: number;
  totalIntegrations?: number;
  active?: number;
  activeIntegrations?: number;
  monitoredRequests?: number;
  totalRequestsToday?: number;
  threats?: number;
  totalViolationsToday?: number;
  quarantined?: number;
  quarantinedIntegrations?: number;
  averageRiskScore?: number;
}

export interface SecEvent {
  id: string;
  integration_id?: string;
  integrationId?: string;
  event_type?: string;
  eventType?: string;
  endpoint?: string;
  risk_score?: number;
  riskScore?: number;
  action: string;
  reason: string;
  prev_hash?: string;
  prevHash?: string;
  hash?: string;
  created_at?: string;
  createdAt?: string;
}

export function getEventIntegrationId(e: SecEvent): string {
  return e.integration_id ?? e.integrationId ?? 'unknown';
}

export function getEventRiskScore(e: SecEvent): number {
  return e.risk_score ?? e.riskScore ?? 0;
}

export function getEventCreatedAt(e: SecEvent): string {
  return e.created_at ?? e.createdAt ?? new Date().toISOString();
}

export interface CheckResult {
  riskScore: number;
  level: string;
  violations: { code: string; detail: string; points: number }[];
  action: string;
  reason: string;
}

export interface AuditVerifyResult {
  verified: boolean;
  integrity: string;
  chainLength: number;
  genesisHash: string;
  latestHash: string;
  verifiedRecordsCount: number;
  timestamp: string;
}

export async function checkEngineHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/healthz`, { cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function downloadAuditExport(format: 'csv' | 'json' = 'json') {
  const url = `${API_URL}/api/security-events/export?format=${format}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to export audit report');
  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `thirdeye-audit-log.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export function levelFor(score: number): string {
  if (score >= 81) return 'CRITICAL';
  if (score >= 61) return 'HIGH_RISK';
  if (score >= 31) return 'SUSPICIOUS';
  return 'TRUSTED';
}

export function riskColor(score: number): string {
  if (score >= 81) return '#FF4D5E';
  if (score >= 61) return '#FF9F2E';
  if (score >= 31) return '#FFC42E';
  return '#19D98A';
}

export function statusColor(status: string): string {
  switch (status) {
    case 'QUARANTINED': return '#FF4D5E';
    case 'RATE_LIMITED': return '#FF9F2E';
    case 'MONITORED': return '#FFC42E';
    default: return '#19D98A';
  }
}

export function actionLabel(action: string): string {
  switch (action) {
    case 'ALLOW': return 'Allow';
    case 'MONITOR': return 'Allow + Monitor';
    case 'RATE_LIMIT': return 'Rate limit + Monitor';
    case 'BLOCK': return 'Block';
    case 'QUARANTINE': return 'Block + Quarantine';
    default: return action;
  }
}

