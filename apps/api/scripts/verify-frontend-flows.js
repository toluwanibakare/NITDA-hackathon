/**
 * Comprehensive verification script for frontend-backend contract compatibility.
 * Tests the exact endpoints, query parameters, request bodies, and expected response
 * structures used by apps/web pages:
 * 1. Trust Profile Detail (apps/web/app/integrations/[id]/page.tsx)
 * 2. Attack Simulator (apps/web/app/simulator/page.tsx)
 * 3. Security Events Log (apps/web/app/events/page.tsx)
 * 4. Settings & Tuning (apps/web/app/settings/page.tsx)
 */

const BASE_URL = 'http://localhost:4000';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = text;
  }
  return { status: res.status, ok: res.ok, data: json };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

async function runVerification() {
  console.log('====================================================');
  console.log('STARTING THIRD-EYE FRONTEND FLOW AUDIT & VERIFICATION');
  console.log('====================================================\n');

  // ---------------------------------------------------------------
  // FLOW 2: Trust Profile Detail (/integrations/[id])
  // ---------------------------------------------------------------
  console.log('[FLOW 2] Trust Profile Detail (/integrations/[id]/page.tsx)');
  
  // 1. GET /api/integrations/:id
  const getProfile = await request('/api/integrations/analytics_001');
  assert(getProfile.status === 200, 'GET /api/integrations/analytics_001 returns 200 OK');
  assert(getProfile.data.profile !== undefined, 'Response contains { profile }');
  const prof = getProfile.data.profile;
  assert(prof.id === 'analytics_001', 'profile.id is analytics_001');
  assert(Array.isArray(prof.allowed_endpoints) && prof.allowed_endpoints.length > 0, 'profile.allowed_endpoints is populated');
  assert(Array.isArray(prof.allowed_methods) && prof.allowed_methods.length > 0, 'profile.allowed_methods is populated');
  assert(Array.isArray(prof.allowed_data) && prof.allowed_data.length > 0, 'profile.allowed_data is populated');
  assert(Array.isArray(prof.forbidden_data) && prof.forbidden_data.length > 0, 'profile.forbidden_data is populated');
  assert(typeof prof.risk_score === 'number', 'profile.risk_score is numeric');
  assert(typeof prof.status === 'string', 'profile.status is string');
  assert(getProfile.data.behaviour !== undefined, 'Response contains { behaviour }');
  assert(Array.isArray(getProfile.data.recentViolations), 'Response contains { recentViolations }');

  // 2. GET /api/security-events?integrationId=:id&limit=10
  const getIntegrationEvents = await request('/api/security-events?integrationId=analytics_001&limit=10');
  assert(getIntegrationEvents.status === 200, 'GET /api/security-events?integrationId=analytics_001&limit=10 returns 200');
  assert(Array.isArray(getIntegrationEvents.data), 'Returns array of security events');

  // 3. POST /api/integrations/:id/quarantine
  const postQuarantine = await request('/api/integrations/analytics_001/quarantine', {
    method: 'POST',
    body: JSON.stringify({ reason: 'Manual quarantine test from UI' }),
  });
  assert(postQuarantine.status === 200, 'POST /api/integrations/:id/quarantine returns 200 OK');
  assert(postQuarantine.data.status === 'QUARANTINED', 'Integration status locked to QUARANTINED');
  assert(postQuarantine.data.riskScore === 95, 'Integration riskScore set to 95');

  // 4. POST /api/integrations/:id/release
  const postRelease = await request('/api/integrations/analytics_001/release', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert(postRelease.status === 200, 'POST /api/integrations/:id/release returns 200 OK');
  assert(postRelease.data.status === 'ACTIVE', 'Integration status restored to ACTIVE');
  assert(postRelease.data.riskScore === 8, 'Integration riskScore restored to 8');
  console.log('[FLOW 2 COMPATIBILITY: 100% CONFIRMED]\n');

  // ---------------------------------------------------------------
  // FLOW 3: Attack Simulator (/simulator)
  // ---------------------------------------------------------------
  console.log('[FLOW 3] Attack Simulator (/simulator/page.tsx) - 4-Phase Demo');

  // 1. POST /api/simulator/start
  const simStart = await request('/api/simulator/start', {
    method: 'POST',
    body: JSON.stringify({ integrationId: 'analytics_001', attack: 'credential_compromise' }),
  });
  assert(simStart.status === 200, 'POST /api/simulator/start returns 200 OK');

  // 2. Phase 1: Normal Operation (/analytics/events, count 95)
  const phase1 = await request('/api/check-request', {
    method: 'POST',
    body: JSON.stringify({
      integrationId: 'analytics_001',
      method: 'GET',
      endpoint: '/analytics/events',
      dataRequested: ['event'],
      requestCount: 95,
    }),
  });
  assert(phase1.status === 200, 'Phase 1: POST /api/check-request returns 200');
  assert(phase1.data.riskScore <= 5, `Phase 1 score is green (expected <= 5, got ${phase1.data.riskScore})`);
  assert(phase1.data.action === 'ALLOW', `Phase 1 action is ALLOW (got ${phase1.data.action})`);
  assert(phase1.data.violations.length === 0, 'Phase 1 has 0 violations');

  // 3. Phase 2: Endpoint Probe (/customers/profile, count 300)
  const phase2 = await request('/api/check-request', {
    method: 'POST',
    body: JSON.stringify({
      integrationId: 'analytics_001',
      method: 'GET',
      endpoint: '/customers/profile',
      dataRequested: ['event'],
      requestCount: 300,
    }),
  });
  assert(phase2.status === 200, 'Phase 2: POST /api/check-request returns 200');
  assert(phase2.data.riskScore === 45, `Phase 2 score is yellow ~45 (got ${phase2.data.riskScore})`);
  assert(phase2.data.action === 'MONITOR', `Phase 2 action is MONITOR (got ${phase2.data.action})`);
  assert(phase2.data.level === 'SUSPICIOUS', `Phase 2 level is SUSPICIOUS (got ${phase2.data.level})`);

  // 4. Phase 3: Sensitive Data Extraction (/customers/payment-details, count 800)
  const phase3 = await request('/api/check-request', {
    method: 'POST',
    body: JSON.stringify({
      integrationId: 'analytics_001',
      method: 'GET',
      endpoint: '/customers/payment-details',
      dataRequested: ['payment', 'phone', 'address'],
      requestCount: 800,
    }),
  });
  assert(phase3.status === 200, 'Phase 3: POST /api/check-request returns 200');
  assert(phase3.data.riskScore === 75, `Phase 3 score is orange ~75 (got ${phase3.data.riskScore})`);
  assert(phase3.data.action === 'RATE_LIMIT', `Phase 3 action is RATE_LIMIT (got ${phase3.data.action})`);
  assert(phase3.data.level === 'HIGH_RISK', `Phase 3 level is HIGH_RISK (got ${phase3.data.level})`);

  // 5. Phase 4: Flood & Auto-Quarantine (/customers/payment-details, count 1780)
  const phase4 = await request('/api/check-request', {
    method: 'POST',
    body: JSON.stringify({
      integrationId: 'analytics_001',
      method: 'GET',
      endpoint: '/customers/payment-details',
      dataRequested: ['payment', 'phone', 'address'],
      requestCount: 1780,
    }),
  });
  assert(phase4.status === 200, 'Phase 4: POST /api/check-request returns 200');
  assert(phase4.data.riskScore === 95, `Phase 4 score is red ~95 (got ${phase4.data.riskScore})`);
  assert(phase4.data.action === 'BLOCK', `Phase 4 action is BLOCK (got ${phase4.data.action})`);
  assert(phase4.data.level === 'CRITICAL', `Phase 4 level is CRITICAL (got ${phase4.data.level})`);

  // 6. POST /api/simulator/stop
  const simStop = await request('/api/simulator/stop', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert(simStop.status === 200, 'POST /api/simulator/stop returns 200 OK');

  // 7. Reset demo state: POST /api/integrations/:id/release
  const simReset = await request('/api/integrations/analytics_001/release', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert(simReset.status === 200, 'Reset: POST /api/integrations/analytics_001/release restores state to ACTIVE');
  console.log('[FLOW 3 COMPATIBILITY: 100% CONFIRMED]\n');

  // ---------------------------------------------------------------
  // FLOW 4: Security Events Log (/events)
  // ---------------------------------------------------------------
  console.log('[FLOW 4] Security Events Log (/events/page.tsx)');
  
  const getEvents = await request('/api/security-events?limit=50');
  assert(getEvents.status === 200, 'GET /api/security-events?limit=50 returns 200 OK');
  assert(Array.isArray(getEvents.data) && getEvents.data.length > 0, 'Events log returns populated array');
  const sampleEvent = getEvents.data[0];
  assert(sampleEvent.id !== undefined, 'Event contains id');
  assert(sampleEvent.integration_id !== undefined && sampleEvent.integrationId !== undefined, 'Event has dual-cased integration_id/integrationId');
  assert(sampleEvent.risk_score !== undefined && sampleEvent.riskScore !== undefined, 'Event has dual-cased risk_score/riskScore');
  assert(sampleEvent.event_type !== undefined && sampleEvent.eventType !== undefined, 'Event has dual-cased event_type/eventType');
  assert(sampleEvent.action !== undefined, 'Event contains action');
  assert(sampleEvent.reason !== undefined, 'Event contains reason');
  console.log('[FLOW 4 COMPATIBILITY: 100% CONFIRMED]\n');

  // ---------------------------------------------------------------
  // FLOW 5: Settings & Tuning (/settings) - Black Friday Proof
  // ---------------------------------------------------------------
  console.log('[FLOW 5] Settings & Tuning (/settings/page.tsx) - Sales Day Safety');
  
  const blackFridayTest = await request('/api/check-request', {
    method: 'POST',
    body: JSON.stringify({
      integrationId: 'payment_001',
      method: 'GET',
      endpoint: '/payments',
      dataRequested: ['order_id', 'amount'],
      requestCount: 900,
      contextEvent: 'black_friday',
    }),
  });
  assert(blackFridayTest.status === 200, 'Black Friday test returns 200 OK');
  assert(blackFridayTest.data.riskScore === 0, `Black Friday spike forgiven by context (riskScore: ${blackFridayTest.data.riskScore})`);
  assert(blackFridayTest.data.action === 'ALLOW', `Black Friday traffic allowed (action: ${blackFridayTest.data.action})`);
  assert(blackFridayTest.data.level === 'TRUSTED' || blackFridayTest.data.level === 'LOW_RISK', `Black Friday level is TRUSTED (level: ${blackFridayTest.data.level})`);
  console.log('[FLOW 5 COMPATIBILITY: 100% CONFIRMED]\n');

  console.log('====================================================');
  console.log('ALL FRONTEND INTEGRATION FLOWS VERIFIED SUCCESSFULLY');
  console.log('====================================================');
}

runVerification().catch((err) => {
  console.error('Audit verification error:', err);
  process.exit(1);
});
