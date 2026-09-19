import { test } from 'node:test';
import assert from 'node:assert/strict';

import { normalizeTrustProfile, type TrustProfile } from '@thirdeye/shared';
import { checkRequestPure } from './riskEngine.js';
import { createIntegrationProxy } from './proxy.js';

// Golden test scenarios per TECH_PRD §4 & PRD §10:
// 1. Normal request: GET /analytics/events -> ~5 score, ALLOW
// 2. Suspicious request: GET /customers/profile -> 45 score, ALLOW + MONITOR
// 3. Attack request: GET /customers/payment-details + sensitive data + 1780/min -> 95 score, BLOCK + QUARANTINE

test('normalizeTrustProfile accepts both camelCase and snake_case fields', () => {
  const profile = normalizeTrustProfile({
    id: 'analytics_001',
    name: 'Analytics Provider',
    purpose: 'Collect anonymous usage statistics',
    allowed_endpoints: ['/analytics/events'],
    allowed_methods: ['GET'],
    allowed_data: ['event'],
    forbidden_data: ['payment'],
    expected_request_rate: 100,
  } as any);

  assert.ok(profile);
  assert.deepEqual(profile.allowedEndpoints, ['/analytics/events']);
  assert.deepEqual(profile.allowedMethods, ['GET']);
  assert.deepEqual(profile.allowedData, ['event']);
  assert.deepEqual(profile.forbiddenData, ['payment']);
  assert.equal(profile.expectedRequestRate, 100);
});

test('proxy middleware blocks dangerous outbound requests using the shared schema', async () => {
  const profile = normalizeTrustProfile({
    id: 'analytics_001',
    name: 'Analytics Provider',
    purpose: 'Collect anonymous usage statistics',
    allowedEndpoints: ['/analytics/events'],
    allowedMethods: ['GET', 'POST'],
    allowedData: ['anonymous_user_id', 'page', 'event', 'timestamp'],
    forbiddenData: ['payment', 'phone', 'address', 'password'],
    expectedRequestRate: 100,
  });

  assert.ok(profile);

  const decision = checkRequestPure(
    {
      integrationId: 'analytics_001',
      method: 'GET',
      endpoint: '/customers/payment-details',
      dataRequested: ['payment', 'phone'],
      requestCount: 1780,
      timestamp: '2026-09-18T03:00:00.000Z',
    },
    profile
  );

  assert.equal(decision.action, 'BLOCK');
  assert.ok(decision.riskScore >= 80);

  const req = {
    method: 'GET',
    headers: { 'x-integration-id': 'analytics_001' },
    body: {
      method: 'GET',
      endpoint: '/customers/payment-details',
      dataRequested: ['payment', 'phone'],
      requestCount: 1780,
      timestamp: '2026-09-18T03:00:00.000Z',
    },
  } as any;

  const res = {
    headers: {},
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      return payload;
    },
    end() {
      return this;
    },
  } as any;

  let nextCalled = false;
  const middleware = createIntegrationProxy({
    profileResolver: () => profile,
    onDecision: () => undefined,
  });

  await middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.headers['X-ThirdEye-Decision'], 'BLOCK');
});
