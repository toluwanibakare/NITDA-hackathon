import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { storexStore } from './store.js';

export const storexRouter = Router();

// ==========================================
// 1. ORDERS
// ==========================================

// GET /api/storex/orders
storexRouter.get('/orders', (req: Request, res: Response) => {
  const orders = Object.values(storexStore.orders);
  return res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
});

// GET /api/storex/orders/dispatch
storexRouter.get('/orders/dispatch', (req: Request, res: Response) => {
  const dispatchable = Object.values(storexStore.orders).filter(
    o => o.status === 'processing' || o.status === 'dispatched'
  );
  return res.status(200).json({
    success: true,
    count: dispatchable.length,
    orders: dispatchable,
  });
});

// GET /api/storex/orders/:id
storexRouter.get('/orders/:id', (req: Request, res: Response) => {
  const order = storexStore.orders[req.params.id];
  if (!order) {
    return res.status(404).json({ error: `Order ${req.params.id} not found`, code: 'NOT_FOUND' });
  }
  return res.status(200).json({ success: true, order });
});

// ==========================================
// 2. CUSTOMERS (Sensitive & Summary Resources)
// ==========================================

// GET /api/storex/customers
storexRouter.get('/customers', (req: Request, res: Response) => {
  const customers = Object.values(storexStore.customers).map(c => ({
    id: c.id,
    name: c.name,
    email: c.email,
  }));
  return res.status(200).json({ success: true, customers });
});

// GET /api/storex/customers/profile (generic profile probe endpoint)
storexRouter.get('/customers/profile', (req: Request, res: Response) => {
  const customer = Object.values(storexStore.customers)[0];
  return res.status(200).json({
    success: true,
    profile: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
  });
});

// GET /api/storex/customers/:id
storexRouter.get('/customers/:id', (req: Request, res: Response) => {
  const customer = storexStore.customers[req.params.id];
  if (!customer) {
    return res.status(404).json({ error: `Customer ${req.params.id} not found`, code: 'NOT_FOUND' });
  }
  return res.status(200).json({
    success: true,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    },
  });
});

// GET /api/storex/customers/:id/summary
storexRouter.get('/customers/:id/summary', (req: Request, res: Response) => {
  const customer = storexStore.customers[req.params.id];
  if (!customer) {
    return res.status(404).json({ error: `Customer ${req.params.id} not found`, code: 'NOT_FOUND' });
  }
  const customerOrders = Object.values(storexStore.orders).filter(o => o.customer_id === req.params.id);
  const customerTickets = Object.values(storexStore.tickets).filter(t => t.customer_id === req.params.id);

  return res.status(200).json({
    success: true,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
    },
    ordersCount: customerOrders.length,
    recentOrders: customerOrders.slice(0, 3),
    openTicketsCount: customerTickets.filter(t => t.status === 'open').length,
  });
});

// GET /api/storex/customers/:id/payment-details (HIGHLY SENSITIVE TARGET)
storexRouter.get('/customers/:id/payment-details', (req: Request, res: Response) => {
  const customer = storexStore.customers[req.params.id];
  if (!customer) {
    return res.status(404).json({ error: `Customer ${req.params.id} not found`, code: 'NOT_FOUND' });
  }
  return res.status(200).json({
    success: true,
    customerId: customer.id,
    paymentMethods: [
      {
        brand: customer.card_brand,
        last4: customer.card_last4,
        phone: customer.phone,
        billingAddress: customer.address,
      },
    ],
  });
});

// ==========================================
// 3. PRODUCTS
// ==========================================

// GET /api/storex/products
storexRouter.get('/products', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    products: Object.values(storexStore.products),
  });
});

// GET /api/storex/products/:id
storexRouter.get('/products/:id', (req: Request, res: Response) => {
  const product = storexStore.products[req.params.id];
  if (!product) {
    return res.status(404).json({ error: `Product ${req.params.id} not found`, code: 'NOT_FOUND' });
  }
  return res.status(200).json({ success: true, product });
});

// ==========================================
// 4. PAYMENTS & REFUNDS
// ==========================================

// GET /api/storex/payments
storexRouter.get('/payments', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    payments: Object.values(storexStore.payments),
  });
});

// GET /api/storex/payments/status
storexRouter.get('/payments/status', (_req: Request, res: Response) => {
  const payments = Object.values(storexStore.payments);
  return res.status(200).json({
    success: true,
    totalTransactions: payments.length,
    succeededCount: payments.filter(p => p.status === 'succeeded').length,
    settlementVolumeUSD: payments.reduce((acc, p) => acc + p.amount, 0),
  });
});

// GET /api/storex/payments/:id
storexRouter.get('/payments/:id', (req: Request, res: Response) => {
  const payment = storexStore.payments[req.params.id];
  if (!payment) {
    return res.status(404).json({ error: `Payment ${req.params.id} not found`, code: 'NOT_FOUND' });
  }
  return res.status(200).json({ success: true, payment });
});

// POST /api/storex/payments
storexRouter.post('/payments', (req: Request, res: Response) => {
  const { order_id, amount, currency = 'USD' } = req.body || {};
  const id = `pay_${Date.now()}`;
  const payment = {
    id,
    order_id: order_id || 'ord_custom',
    amount: Number(amount) || 50.0,
    currency,
    status: 'succeeded' as const,
    transaction_id: `tx_stripe_${crypto.randomBytes(4).toString('hex')}`,
    method: 'credit_card',
    created_at: new Date().toISOString(),
  };
  storexStore.payments[id] = payment;
  return res.status(201).json({ success: true, payment });
});

// POST /api/storex/refunds
storexRouter.post('/refunds', (req: Request, res: Response) => {
  const { payment_id, reason = 'requested_by_customer' } = req.body || {};
  const payment = storexStore.payments[payment_id];
  if (payment) {
    payment.status = 'refunded';
  }
  return res.status(200).json({
    success: true,
    refundId: `ref_${Date.now()}`,
    status: 'refunded',
    reason,
  });
});

// ==========================================
// 5. SHIPMENTS & DELIVERY
// ==========================================

// GET /api/storex/delivery & /api/storex/delivery/status
const handleDeliveryStatus = (_req: Request, res: Response) => {
  const shipments = Object.values(storexStore.shipments);
  return res.status(200).json({
    success: true,
    inTransitCount: shipments.filter(s => s.status === 'in_transit').length,
    shipments,
  });
};
storexRouter.get('/delivery', handleDeliveryStatus);
storexRouter.get('/delivery/status', handleDeliveryStatus);

// GET /api/storex/shipments
storexRouter.get('/shipments', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    shipments: Object.values(storexStore.shipments),
  });
});

// GET /api/storex/shipments/:id
storexRouter.get('/shipments/:id', (req: Request, res: Response) => {
  const shipment = storexStore.shipments[req.params.id];
  if (!shipment) {
    return res.status(404).json({ error: `Shipment ${req.params.id} not found`, code: 'NOT_FOUND' });
  }
  return res.status(200).json({ success: true, shipment });
});

// POST /api/storex/shipments & /api/storex/delivery
const handleCreateShipment = (req: Request, res: Response) => {
  const { order_id, recipient_name, delivery_address, phone, items = [] } = req.body || {};
  const id = `shp_${Date.now()}`;
  const shipment = {
    id,
    order_id: order_id || 'ord_1001',
    recipient_name: recipient_name || 'Customer',
    delivery_address: delivery_address || 'Address',
    phone: phone || '+1-555-0000',
    tracking_number: `TRK-SF-${Math.floor(10000 + Math.random() * 90000)}`,
    status: 'label_created' as const,
    items,
    created_at: new Date().toISOString(),
  };
  storexStore.shipments[id] = shipment;
  return res.status(201).json({ success: true, shipment });
};
storexRouter.post('/shipments', handleCreateShipment);
storexRouter.post('/delivery', handleCreateShipment);

// ==========================================
// 6. ANALYTICS
// ==========================================

// POST /api/storex/analytics/events
storexRouter.post('/analytics/events', (req: Request, res: Response) => {
  const event = req.body || {};
  const record = {
    ...event,
    receivedAt: new Date().toISOString(),
  };
  storexStore.analyticsEvents.push(record);
  return res.status(200).json({
    success: true,
    recorded: true,
    eventId: `evt_${Date.now()}`,
  });
});

// GET /api/storex/analytics/metrics
storexRouter.get('/analytics/metrics', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    metrics: {
      pageViewsToday: 48290 + storexStore.analyticsEvents.length,
      uniqueVisitors: 12450,
      activeCarts: 342,
      conversionRate: 0.038,
      avgResponseTimeMs: 42,
      recordedEventsCount: storexStore.analyticsEvents.length,
    },
  });
});

// ==========================================
// 7. CAMPAIGNS & MARKETING
// ==========================================

// GET /api/storex/campaigns
storexRouter.get('/campaigns', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    campaigns: Object.values(storexStore.campaigns),
  });
});

// POST /api/storex/campaigns
storexRouter.post('/campaigns', (req: Request, res: Response) => {
  const { name, audience_tag, scheduled_at } = req.body || {};
  const id = `cmp_${Date.now()}`;
  const campaign = {
    id,
    name: name || 'New Promotion',
    audience_tag: audience_tag || 'all_users',
    status: 'draft' as const,
    scheduled_at: scheduled_at || new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  storexStore.campaigns[id] = campaign;
  return res.status(201).json({ success: true, campaign });
});

// POST /api/storex/campaigns/events
storexRouter.post('/campaigns/events', (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    recorded: true,
    campaignEventId: `cmpevt_${Date.now()}`,
  });
});

// POST /api/storex/campaigns/broadcast
storexRouter.post('/campaigns/broadcast', (req: Request, res: Response) => {
  const { campaign_id } = req.body || {};
  return res.status(200).json({
    success: true,
    broadcastQueued: true,
    campaign_id,
    dispatchedToRecipients: 4250,
  });
});

// ==========================================
// 8. SUPPORT TICKETS
// ==========================================

// GET /api/storex/tickets
storexRouter.get('/tickets', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    tickets: Object.values(storexStore.tickets),
  });
});

// GET /api/storex/tickets/:id
storexRouter.get('/tickets/:id', (req: Request, res: Response) => {
  const ticket = storexStore.tickets[req.params.id];
  if (!ticket) {
    return res.status(404).json({ error: `Ticket ${req.params.id} not found`, code: 'NOT_FOUND' });
  }
  return res.status(200).json({ success: true, ticket });
});

// POST /api/storex/tickets
storexRouter.post('/tickets', (req: Request, res: Response) => {
  const { customer_id, customer_name, email, issue_description, order_id } = req.body || {};
  const id = `tkt_${Date.now()}`;
  const ticket = {
    id,
    customer_id: customer_id || 'cust_101',
    customer_name: customer_name || 'Customer',
    email: email || 'customer@example.com',
    order_id,
    issue_description: issue_description || 'General Inquiry',
    status: 'open' as const,
    created_at: new Date().toISOString(),
  };
  storexStore.tickets[id] = ticket;
  return res.status(201).json({ success: true, ticket });
});

// ==========================================
// 9. STORE RESET
// ==========================================

// POST /api/storex/reset
storexRouter.post('/reset', (_req: Request, res: Response) => {
  storexStore.reset();
  return res.status(200).json({ success: true, message: 'StoreX business store reset to baseline.' });
});
