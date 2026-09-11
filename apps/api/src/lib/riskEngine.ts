// ThirdEye risk engine — pure function per TECH_PRD §4. BE-2 owns.
// Scoring: unknown integration +50, unknown endpoint +20, purpose +25,
// forbidden data +30, new method +10, abnormal volume +20, unusual time +5.
// Context event reduces 20. Max 100.
import { CheckRequest, CheckResult, TrustProfile, Violation, actionForLevel, levelForScore } from '@thirdeye/shared';

export function checkRequestPure(req: CheckRequest, profile: TrustProfile | null): CheckResult {
  const violations: Violation[] = [];
  let score = 0;
  const data = (req.dataRequested ?? []).map((d) => d.toLowerCase());

  if (!profile) {
    return {
      riskScore: 50, level: 'SUSPICIOUS', action: 'BLOCK',
      violations: [{ code: 'UNKNOWN_INTEGRATION', detail: `Unknown integration ${req.integrationId}`, points: 50 }],
      reason: `Unknown integration ${req.integrationId} blocked`,
    };
  }

  const allowedEndpoints = profile.allowedEndpoints.map((e) => e.toLowerCase());
  const allowedMethods = profile.allowedMethods.map((m) => m.toUpperCase());
  const forbidden = profile.forbiddenData.map((d) => d.toLowerCase());

  if (!allowedEndpoints.includes(req.endpoint.toLowerCase())) {
    score += 20;
    violations.push({ code: 'UNKNOWN_ENDPOINT', detail: `${req.endpoint} outside allowed scope`, points: 20 });
    // endpoint drift implies purpose drift
    score += 25;
    violations.push({ code: 'PURPOSE_MISMATCH', detail: `${profile.name} purpose "${profile.purpose}" vs ${req.endpoint}`, points: 25 });
  }
  if (!allowedMethods.includes(req.method.toUpperCase())) {
    score += 10;
    violations.push({ code: 'UNKNOWN_METHOD', detail: `New method ${req.method}`, points: 10 });
  }
  const badData = data.filter((d) => forbidden.some((f) => d.includes(f) || f.includes(d)));
  if (badData.length) {
    score += 30;
    violations.push({ code: 'FORBIDDEN_DATA', detail: `Forbidden data: ${badData.join(', ')}`, points: 30 });
  }
  const count = req.requestCount ?? 0;
  if (count > profile.expectedRequestRate * 3) {
    score += 20;
    violations.push({ code: 'ABNORMAL_VOLUME', detail: `${count}/min vs normal ${profile.expectedRequestRate}/min`, points: 20 });
  }
  const hour = new Date(req.timestamp ?? Date.now()).getHours();
  if (hour >= 0 && hour < 5) {
    score += 5;
    violations.push({ code: 'UNUSUAL_TIME', detail: `Unusual time ${hour}:00`, points: 5 });
  }
  if (req.contextEvent && req.contextEvent !== 'none') {
    score = Math.max(0, score - 20);
  }
  score = Math.min(100, score);
  const level = levelForScore(score);
  const action = actionForLevel(level);
  const reason = violations.length
    ? violations.map((v) => v.detail).join('; ')
    : `Matches ${profile.name} trust profile`;
  return { riskScore: score, level, violations, action, reason };
}
