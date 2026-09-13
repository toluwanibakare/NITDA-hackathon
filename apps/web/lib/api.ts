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
  risk_score: number;
  expected_request_rate?: number;
  allowed_endpoints?: string[];
  allowed_methods?: string[];
  allowed_data?: string[];
  forbidden_data?: string[];
  updated_at?: string;
  requestsPerMin?: number;
  lastActivity?: string;
}

export interface DashboardStats {
  integrations: number;
  active: number;
  monitoredRequests: number;
  threats: number;
  quarantined: number;
}

export interface SecEvent {
  id: string;
  integration_id: string;
  event_type: string;
  endpoint?: string;
  risk_score: number;
  action: string;
  reason: string;
  created_at: string;
}

export interface CheckResult {
  riskScore: number;
  level: string;
  violations: { code: string; detail: string; points: number }[];
  action: string;
  reason: string;
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
