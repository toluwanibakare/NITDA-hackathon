import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'http';
import {
  getAllIntegrations,
  getIntegrationById,
  getIntegrationByApiKey,
  updateIntegrationStatus,
  resetIntegration,
  resetAllIntegrations,
  integrationRegistry,
} from '../integrations/registry.js';
import { fallbackIntegrations } from '../routes/integrations.js';
import { shopxStore } from '../shopx/store.js';
import app from '../index.js';

describe('Integration Registry & Single Source of Truth', () => {
  beforeEach(() => {
    resetAllIntegrations();
  });

  test('loads all 5 required integration profiles from specification', () => {
    const list = getAllIntegrations();
    assert.equal(list.length, 5, 'Must contain exactly 5 registered integrations');

    const ids = list.map(i => i.id).sort();
    assert.deepEqual(ids, ['analytics_001', 'delivery_001', 'marketing_001', 'payment_001', 'support_001']);
  });

  test('verifies each integration has complete purpose and scope definitions', () => {
    const requiredFields = [
      'id',
      'name',
      'purpose',
      'allowedEndpoints',
      'allowedFields',
      'forbiddenFields',
      'expectedRequestRate',
      'testApiKey',
      'status',
    ];

    for (const integration of getAllIntegrations()) {
      for (const field of requiredFields) {
        assert.ok(
          (integration as any)[field] !== undefined,
          `Integration ${integration.id} must define '${field}'`
        );
      }
      assert.equal(integration.status, 'ACTIVE');
      assert.ok(integration.allowedEndpoints.length > 0);
      assert.ok(integration.allowedFields.length > 0);
      assert.ok(integration.forbiddenFields.length > 0);
      assert.ok(integration.expectedRequestRate > 0);
      assert.ok(integration.testApiKey.startsWith('sec_test_'));
    }
  });

  test('resolves integration by API key accurately', () => {
    const payment = getIntegrationByApiKey('sec_test_payment_key_120');
    assert.ok(payment);
    assert.equal(payment.id, 'payment_001');
    assert.equal(payment.name, 'StripeX Payments');

    const support = getIntegrationByApiKey('sec_test_support_key_60');
    assert.ok(support);
    assert.equal(support.id, 'support_001');
    assert.equal(support.name, 'ZendeskDesk Care');

    const nonExistent = getIntegrationByApiKey('invalid_key_xyz');
    assert.equal(nonExistent, null);
  });

  test('updates status and resets back to baseline', () => {
    const id = 'analytics_001';
    updateIntegrationStatus(id, 'QUARANTINED', 95);
    let item = getIntegrationById(id);
    assert.equal(item?.status, 'QUARANTINED');
    assert.equal(item?.riskScore, 95);

    resetIntegration(id);
    item = getIntegrationById(id);
    assert.equal(item?.status, 'ACTIVE');
    assert.equal(item?.riskScore, 8);
  });

  test('fallbackIntegrations in routes/integrations proxies the unified registry', () => {
    assert.equal(Object.keys(fallbackIntegrations).length, 5);
    assert.ok(fallbackIntegrations.support_001);
    assert.equal(fallbackIntegrations.support_001.name, 'ZendeskDesk Care');
  });
});

describe('ShopX Business Service & Realistic Endpoints', () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    await new Promise<void>(resolve => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr !== null) {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>(resolve => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    shopxStore.reset();
  });

  test('ShopX Store holds realistic in-memory business entities', () => {
    assert.ok(Object.keys(shopxStore.orders).length >= 3);
    assert.ok(Object.keys(shopxStore.customers).length >= 3);
    assert.ok(Object.keys(shopxStore.products).length >= 3);
    assert.ok(Object.keys(shopxStore.payments).length >= 2);
    assert.ok(Object.keys(shopxStore.shipments).length >= 1);
    assert.ok(Object.keys(shopxStore.tickets).length >= 1);
    assert.ok(Object.keys(shopxStore.campaigns).length >= 1);
  });

  test('ShopX Store reset restores original state', () => {
    shopxStore.orders['ord_custom_test'] = {
      id: 'ord_custom_test',
      customer_id: 'cust_101',
      items: [],
      amount: 100,
      currency: 'USD',
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    assert.ok(shopxStore.orders['ord_custom_test']);

    shopxStore.reset();
    assert.equal(shopxStore.orders['ord_custom_test'], undefined);
  });

  test('GET /api/shopx/orders returns realistic order objects', async () => {
    const res = await fetch(`${baseUrl}/api/shopx/orders`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.orders.length >= 3);
    assert.equal(body.orders[0].id, 'ord_1001');
    assert.equal(body.orders[0].currency, 'USD');
  });

  test('GET /api/shopx/orders/dispatch returns dispatchable orders', async () => {
    const res = await fetch(`${baseUrl}/api/shopx/orders/dispatch`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.orders.every((o: any) => o.status === 'processing' || o.status === 'dispatched'));
  });

  test('GET /api/shopx/customers/:id returns customer data without password hash', async () => {
    const res = await fetch(`${baseUrl}/api/shopx/customers/cust_101`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.customer.name, 'Alex Rivera');
    assert.equal(body.customer.password_hash, undefined);
  });

  test('GET /api/shopx/customers/:id/payment-details returns sensitive payment details', async () => {
    const res = await fetch(`${baseUrl}/api/shopx/customers/cust_101/payment-details`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.customerId, 'cust_101');
    assert.ok(body.paymentMethods.length > 0);
    assert.equal(body.paymentMethods[0].brand, 'Visa');
    assert.equal(body.paymentMethods[0].last4, '4242');
  });

  test('POST /api/shopx/payments processes payment transaction', async () => {
    const res = await fetch(`${baseUrl}/api/shopx/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: 'ord_1001', amount: 149.99, currency: 'USD' }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.payment.status, 'succeeded');
    assert.ok(body.payment.transaction_id.startsWith('tx_stripe_'));
  });

  test('POST /api/shopx/analytics/events records telemetry events', async () => {
    const res = await fetch(`${baseUrl}/api/shopx/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'page_view',
        url: '/shop/headphones',
        anonymous_user_id: 'anon_991',
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.recorded, true);
  });

  test('GET /api/integrations returns all 5 integrations to the frontend', async () => {
    const res = await fetch(`${baseUrl}/api/integrations`);
    assert.equal(res.status, 200);
    const list = await res.json();
    assert.equal(list.length, 5);

    const support = list.find((item: any) => item.id === 'support_001');
    assert.ok(support);
    assert.equal(support.name, 'ZendeskDesk Care');
    assert.equal(support.status, 'ACTIVE');
  });
});
