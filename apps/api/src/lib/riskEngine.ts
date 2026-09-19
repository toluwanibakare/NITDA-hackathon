import {
  CheckRequest,
  CheckResult,
  TrustProfile,
  Violation,
  actionForLevel,
  levelForScore,
} from '@thirdeye/shared';

/**
 * Pure evaluation function for incoming third-party requests against an active trust profile.
 * Applies progressive risk scoring based on endpoint authorization, purpose alignment,
 * payload sensitivity, rate limits, and contextual factors.
 */
export function checkRequestPure(req: CheckRequest, profile: TrustProfile | null): CheckResult {
  const violations: Violation[] = [];
  let score = 0;
  const requestedData = (req.dataRequested || []).map(d => d.toLowerCase());

  // Unknown integration identity triggers immediate block threshold
  if (!profile) {
    return {
      riskScore: 50,
      level: 'SUSPICIOUS',
      action: 'BLOCK',
      violations: [
        {
          code: 'UNKNOWN_INTEGRATION',
          detail: `Unregistered integration: ${req.integrationId}`,
          points: 50,
        },
      ],
      reason: `Unregistered integration ${req.integrationId} blocked`,
    };
  }

  const allowedEndpoints = profile.allowedEndpoints.map(e => e.toLowerCase());
  const allowedMethods = profile.allowedMethods.map(m => m.toUpperCase());
  const forbiddenData = (profile.forbiddenData ?? []).map(d => d.toLowerCase());

  // Endpoint verification
  if (!allowedEndpoints.includes(req.endpoint.toLowerCase())) {
    score += 20;
    violations.push({
      code: 'UNKNOWN_ENDPOINT',
      detail: `${req.endpoint} outside allowed scope`,
      points: 20,
    });

    // Endpoint drift indicates potential purpose deviation
    score += 25;
    violations.push({
      code: 'PURPOSE_MISMATCH',
      detail: `${profile.name} registered purpose "${profile.purpose}" does not match ${req.endpoint}`,
      points: 25,
    });
  }

  // HTTP method verification
  if (!allowedMethods.includes(req.method.toUpperCase())) {
    score += 10;
    violations.push({
      code: 'UNKNOWN_METHOD',
      detail: `Method ${req.method} not permitted for this endpoint`,
      points: 10,
    });
  }

  // Sensitive data access validation
  const matchedForbidden = requestedData.filter(item =>
    forbiddenData.some(forbidden => item.includes(forbidden) || forbidden.includes(item))
  );

  if (matchedForbidden.length > 0) {
    score += 30;
    violations.push({
      code: 'FORBIDDEN_DATA',
      detail: `Attempted access to restricted data attributes: ${matchedForbidden.join(', ')}`,
      points: 30,
    });
  }

  // Request volume anomaly detection
  const count = req.requestCount || 0;
  if (count > profile.expectedRequestRate * 10) {
    score += 20;
    violations.push({
      code: 'ABNORMAL_VOLUME',
      detail: `Critical spike detected: ${count}/min vs baseline ${profile.expectedRequestRate}/min`,
      points: 20,
    });
  } else if (count > profile.expectedRequestRate * 3) {
    if (matchedForbidden.length === 0) {
      score += 20;
      violations.push({
        code: 'ABNORMAL_VOLUME',
        detail: `Spike detected: ${count}/min vs baseline ${profile.expectedRequestRate}/min`,
        points: 20,
      });
    }
  }

  // Off-hours traffic check (midnight to 5 AM)
  if (req.timestamp) {
    const reqHour = new Date(req.timestamp).getHours();
    if (reqHour >= 0 && reqHour < 5) {
      score += 5;
      violations.push({
        code: 'UNUSUAL_TIME',
        detail: `Off-hours activity at ${reqHour}:00`,
        points: 5,
      });
    }
  }

  // Context adjustment (known high-traffic events)
  if (req.contextEvent && req.contextEvent !== 'none') {
    score = Math.max(0, score - 20);
  }

  score = Math.min(100, Math.max(0, score));
  const level = levelForScore(score);
  const action = actionForLevel(level);

  const reason =
    violations.length > 0
      ? violations.map(v => v.detail).join('; ')
      : `Request conforms to ${profile.name} trust profile`;

  return {
    riskScore: score,
    level,
    violations,
    action,
    reason,
  };
}
