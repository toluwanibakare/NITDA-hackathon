import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLocal } from '../evaluate.js';

const analyticsProfile = {
  id: 'analytics_001',
  name: 'Analytics Provider',
  purpose: 'Collect anonymous usage statistics',
  allowedEndpoints: ['/analytics/events', '/analytics/metrics'],
  allowedMethods: ['GET', 'POST'],
  allowedData: ['anonymous_user_id', 'page', 'event', 'timestamp'],
  forbiddenData: ['payment', 'phone', 'address', 'password'],
  expectedRequestRate: 100,
};

describe('thirdeye sdk golden cases', () => {
  it('normal request -> ALLOW', () => {
    const r = evaluateLocal(
      {
        integrationId: 'analytics_001',
        method: 'GET',
        endpoint: '/analytics/events',
        dataRequested: ['event'],
        requestCount: 45,
      },
      analyticsProfile as any
    );
    assert.equal(r.action, 'ALLOW');
    assert.ok(r.riskScore <= 30);
  });
  it('probe -> MONITOR (45)', () => {
    const r = evaluateLocal(
      {
        integrationId: 'analytics_001',
        method: 'GET',
        endpoint: '/customers/profile',
        dataRequested: ['event'],
        requestCount: 100,
      },
      analyticsProfile as any
    );
    assert.equal(r.riskScore, 45);
    assert.equal(r.action, 'MONITOR');
  });
  it('exfiltration -> BLOCK (95)', () => {
    const r = evaluateLocal(
      {
        integrationId: 'analytics_001',
        method: 'GET',
        endpoint: '/customers/payment-details',
        dataRequested: ['payment', 'phone', 'address'],
        requestCount: 1780,
      },
      analyticsProfile as any
    );
    assert.equal(r.riskScore, 95);
    assert.equal(r.action, 'BLOCK');
  });
});
