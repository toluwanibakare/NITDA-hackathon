// Local risk evaluation — mirrors apps/api/src/lib/riskEngine.ts so the SDK
// can fail-closed offline. Remote POST /api/check-request is authoritative.
import type { CheckRequest, CheckResult, TrustProfile, Violation } from './types.js';

export const RISK_THRESHOLDS = { suspicious: 31, high: 61, critical: 81 } as const;

export function levelForScore(score: number): CheckResult['level'] {
  if (score >= RISK_THRESHOLDS.critical) return 'CRITICAL';
  if (score >= RISK_THRESHOLDS.high) return 'HIGH_RISK';
  if (score >= RISK_THRESHOLDS.suspicious) return 'SUSPICIOUS';
  return 'TRUSTED';
}

export function actionForLevel(level: CheckResult['level']): CheckResult['action'] {
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

export function evaluateLocal(req: CheckRequest, profile: TrustProfile | null): CheckResult {
  const violations: Violation[] = [];
  let score = 0;
  const requestedData = (req.dataRequested || []).map(d => d.toLowerCase());

  if (!profile) {
    return {
      riskScore: 50,
      level: 'SUSPICIOUS',
      action: 'BLOCK',
      violations: [
        { code: 'UNKNOWN_INTEGRATION', detail: `Unregistered integration: ${req.integrationId}`, points: 50 },
      ],
      reason: `Unregistered integration ${req.integrationId} blocked`,
    };
  }

  const allowedEndpoints = profile.allowedEndpoints.map(e => e.toLowerCase());
  const allowedMethods = profile.allowedMethods.map(m => m.toUpperCase());
  const forbiddenData = profile.forbiddenData.map(d => d.toLowerCase());

  if (!allowedEndpoints.includes(req.endpoint.toLowerCase())) {
    score += 20;
    violations.push({
      code: 'UNKNOWN_ENDPOINT',
      detail: `${req.endpoint} outside allowed scope`,
      points: 20,
    });
    score += 25;
    violations.push({
      code: 'PURPOSE_MISMATCH',
      detail: `${profile.name} purpose "${profile.purpose}" does not match ${req.endpoint}`,
      points: 25,
    });
  }
  if (!allowedMethods.includes(req.method.toUpperCase())) {
    score += 10;
    violations.push({ code: 'UNKNOWN_METHOD', detail: `Method ${req.method} not permitted`, points: 10 });
  }
  const matchedForbidden = requestedData.filter(item =>
    forbiddenData.some(f => item.includes(f) || f.includes(item))
  );
  if (matchedForbidden.length > 0) {
    score += 30;
    violations.push({
      code: 'FORBIDDEN_DATA',
      detail: `Restricted data: ${matchedForbidden.join(', ')}`,
      points: 30,
    });
  }
  const count = req.requestCount || 0;
  if (count > profile.expectedRequestRate * 10) {
    score += 20;
    violations.push({
      code: 'ABNORMAL_VOLUME',
      detail: `Critical spike: ${count}/min vs baseline ${profile.expectedRequestRate}/min`,
      points: 20,
    });
  } else if (count > profile.expectedRequestRate * 3 && matchedForbidden.length === 0) {
    score += 20;
    violations.push({
      code: 'ABNORMAL_VOLUME',
      detail: `Spike: ${count}/min vs baseline ${profile.expectedRequestRate}/min`,
      points: 20,
    });
  }
  if (req.timestamp) {
    const h = new Date(req.timestamp).getHours();
    if (h >= 0 && h < 5) {
      score += 5;
      violations.push({ code: 'UNUSUAL_TIME', detail: `Off-hours activity at ${h}:00`, points: 5 });
    }
  }
  if (req.contextEvent && req.contextEvent !== 'none') score = Math.max(0, score - 20);

  score = Math.min(100, Math.max(0, score));
  const level = levelForScore(score);
  return {
    riskScore: score,
    level,
    violations,
    action: actionForLevel(level),
    reason:
      violations.length > 0
        ? violations.map(v => v.detail).join('; ')
        : `Conforms to ${profile.name} trust profile`,
    evaluatedAt: new Date().toISOString(),
  };
}
