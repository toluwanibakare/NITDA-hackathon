import type {
  Action,
  ActivityItem,
  CheckRequest,
  CheckResult,
  DashboardStats,
  IntegrationDetailResponse,
  IntegrationListItem,
  SecurityEvent,
  TrustProfile,
} from './types.js';
import { evaluateLocal } from './evaluate.js';

export type { CheckRequest, CheckResult, TrustProfile };

export interface ThirdEyeClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
  offlineProfile?: TrustProfile | null;
  fetchImpl?: typeof fetch;
}

export interface RegisterIntegrationInput {
  id: string;
  name: string;
  purpose: string;
  allowedEndpoints?: string[];
  allowedMethods?: string[];
  allowedData?: string[];
  forbiddenData?: string[];
  expectedRequestRate?: number;
}

export class ThirdEyeBlockedError extends Error {
  result: CheckResult;
  constructor(result: CheckResult) {
    super(`ThirdEye blocked request: ${result.reason} (risk ${result.riskScore})`);
    this.name = 'ThirdEyeBlockedError';
    this.result = result;
  }
}

function resolveBaseUrl(explicit?: string): string {
  return (
    explicit ||
    process.env.THIRDEYE_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000'
  ).replace(/\/$/, '');
}

export class ThirdEyeClient {
  readonly baseUrl: string;
  private apiKey?: string;
  private timeoutMs: number;
  private offlineProfile: TrustProfile | null | undefined;
  private fetchImpl: typeof fetch;

  constructor(opts: ThirdEyeClientOptions = {}) {
    this.baseUrl = resolveBaseUrl(opts.baseUrl);
    this.apiKey = opts.apiKey || process.env.THIRDEYE_API_KEY;
    this.timeoutMs = opts.timeoutMs ?? 5000;
    this.offlineProfile = opts.offlineProfile;
    this.fetchImpl = opts.fetchImpl || fetch;
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
    if (this.apiKey) h['Authorization'] = `Bearer ${this.apiKey}`;
    return h;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        headers: this.headers(init.headers as Record<string, string>),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`ThirdEye API ${res.status} ${path}: ${text.slice(0, 300)}`);
      }
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return (await res.json()) as T;
      return (await res.text()) as unknown as T;
    } finally {
      clearTimeout(t);
    }
  }

  async health(): Promise<{ ok: boolean }> {
    return this.request('/healthz');
  }

  /** Remote evaluation — authoritative. Falls back to local scoring on network failure. */
  async checkRequest(req: CheckRequest): Promise<CheckResult> {
    if (!req.integrationId || !req.endpoint || !req.method) {
      throw new Error('checkRequest requires integrationId, endpoint, method');
    }
    try {
      return await this.request<CheckResult>('/api/check-request', {
        method: 'POST',
        body: JSON.stringify(req),
      });
    } catch (err) {
      if (this.offlineProfile !== undefined) return evaluateLocal(req, this.offlineProfile);
      throw err;
    }
  }

  /** Guard: returns result; throws ThirdEyeBlockedError on BLOCK; returns result otherwise. */
  async checkOrBlock(req: CheckRequest): Promise<CheckResult> {
    const result = await this.checkRequest(req);
    if (result.action === 'BLOCK') throw new ThirdEyeBlockedError(result);
    return result;
  }

  async registerIntegration(input: RegisterIntegrationInput): Promise<IntegrationListItem> {
    return this.request<IntegrationListItem>('/api/integrations', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async listIntegrations(): Promise<IntegrationListItem[]> {
    return this.request<IntegrationListItem[]>('/api/integrations');
  }

  async getIntegration(id: string): Promise<IntegrationDetailResponse> {
    return this.request<IntegrationDetailResponse>(`/api/integrations/${encodeURIComponent(id)}`);
  }

  async quarantine(id: string, reason?: string): Promise<unknown> {
    return this.request(`/api/integrations/${encodeURIComponent(id)}/quarantine`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Quarantined via SDK' }),
    });
  }

  async release(id: string): Promise<unknown> {
    return this.request(`/api/integrations/${encodeURIComponent(id)}/release`, {
      method: 'POST',
      body: '{}',
    });
  }

  async securityEvents(integrationId?: string, limit = 50): Promise<SecurityEvent[]> {
    const q = new URLSearchParams({ limit: String(limit) });
    if (integrationId) q.set('integrationId', integrationId);
    return this.request<SecurityEvent[]>(`/api/security-events?${q.toString()}`);
  }

  async dashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/api/dashboard/stats');
  }

  async dashboardActivity(limit = 20): Promise<ActivityItem[]> {
    return this.request<ActivityItem[]>(`/api/dashboard/activity?limit=${limit}`);
  }
}

/** Decide whether a result should proceed. BLOCK never proceeds; RATE_LIMIT callers should backoff. */
export function shouldProceed(result: CheckResult): boolean {
  return result.action === 'ALLOW' || result.action === 'MONITOR' || result.action === 'RATE_LIMIT';
}

export type { Action };
