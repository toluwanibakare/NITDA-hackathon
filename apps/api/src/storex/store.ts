/**
 * StoreX in-memory business data store.
 * Provides realistic e-commerce datasets for orders, customers, products, payments, shipments, and telemetry.
 */

export interface StoreXCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  card_last4: string;
  card_brand: string;
  password_hash: string;
  created_at: string;
}

export interface StoreXOrder {
  id: string;
  customer_id: string;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'dispatched' | 'completed' | 'cancelled';
  created_at: string;
}

export interface StoreXProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

export interface StoreXPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  transaction_id: string;
  method: string;
  created_at: string;
}

export interface StoreXShipment {
  id: string;
  order_id: string;
  recipient_name: string;
  delivery_address: string;
  phone: string;
  tracking_number: string;
  status: 'label_created' | 'in_transit' | 'delivered';
  items: Array<{ name: string; qty: number }>;
  created_at: string;
}

export interface StoreXTicket {
  id: string;
  customer_id: string;
  customer_name: string;
  email: string;
  order_id?: string;
  issue_description: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
}

export interface StoreXCampaign {
  id: string;
  name: string;
  audience_tag: string;
  status: 'draft' | 'active' | 'completed';
  scheduled_at: string;
  created_at: string;
}

const INITIAL_CUSTOMERS: Record<string, StoreXCustomer> = {
  cust_101: {
    id: 'cust_101',
    name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    phone: '+1-555-0142',
    address: '742 Evergreen Terrace, Springfield, IL',
    card_last4: '4242',
    card_brand: 'Visa',
    password_hash: '$2b$12$e8xJklPqQ2zY8k1m9VbXe.9uJ81wKs01A.LmnOpQrStUvWxYz1234',
    created_at: '2026-08-15T10:00:00Z',
  },
  cust_102: {
    id: 'cust_102',
    name: 'Jordan Chen',
    email: 'jordan.chen@example.com',
    phone: '+1-555-0189',
    address: '100 Market Street, San Francisco, CA',
    card_last4: '8821',
    card_brand: 'Mastercard',
    password_hash: '$2b$12$e8xJklPqQ2zY8k1m9VbXe.9uJ81wKs01B.LmnOpQrStUvWxYz5678',
    created_at: '2026-08-20T14:30:00Z',
  },
  cust_103: {
    id: 'cust_103',
    name: 'Samira Khan',
    email: 'samira.khan@example.com',
    phone: '+1-555-0177',
    address: '45 Oxford Street, London, UK',
    card_last4: '1092',
    card_brand: 'Amex',
    password_hash: '$2b$12$e8xJklPqQ2zY8k1m9VbXe.9uJ81wKs01C.LmnOpQrStUvWxYz9012',
    created_at: '2026-08-25T09:15:00Z',
  },
};

const INITIAL_ORDERS: Record<string, StoreXOrder> = {
  ord_1001: {
    id: 'ord_1001',
    customer_id: 'cust_101',
    items: [{ id: 'prod_1', name: 'Wireless Noise-Cancelling Headphones', quantity: 1, price: 149.99 }],
    amount: 149.99,
    currency: 'USD',
    status: 'completed',
    created_at: '2026-09-10T12:00:00Z',
  },
  ord_1002: {
    id: 'ord_1002',
    customer_id: 'cust_102',
    items: [{ id: 'prod_2', name: 'Ergonomic Desk Mat', quantity: 2, price: 39.75 }],
    amount: 79.5,
    currency: 'USD',
    status: 'dispatched',
    created_at: '2026-09-11T15:20:00Z',
  },
  ord_1003: {
    id: 'ord_1003',
    customer_id: 'cust_103',
    items: [{ id: 'prod_3', name: 'Smart Fitness Tracker v4', quantity: 1, price: 299.0 }],
    amount: 299.0,
    currency: 'USD',
    status: 'processing',
    created_at: '2026-09-12T08:45:00Z',
  },
};

const INITIAL_PRODUCTS: Record<string, StoreXProduct> = {
  prod_1: {
    id: 'prod_1',
    name: 'Wireless Noise-Cancelling Headphones',
    price: 149.99,
    stock: 45,
    category: 'electronics',
  },
  prod_2: { id: 'prod_2', name: 'Ergonomic Desk Mat', price: 39.75, stock: 120, category: 'accessories' },
  prod_3: { id: 'prod_3', name: 'Smart Fitness Tracker v4', price: 299.0, stock: 18, category: 'wearables' },
};

const INITIAL_PAYMENTS: Record<string, StoreXPayment> = {
  pay_901: {
    id: 'pay_901',
    order_id: 'ord_1001',
    amount: 149.99,
    currency: 'USD',
    status: 'succeeded',
    transaction_id: 'tx_stripe_88192a',
    method: 'credit_card',
    created_at: '2026-09-10T12:01:00Z',
  },
  pay_902: {
    id: 'pay_902',
    order_id: 'ord_1002',
    amount: 79.5,
    currency: 'USD',
    status: 'succeeded',
    transaction_id: 'tx_stripe_44120c',
    method: 'credit_card',
    created_at: '2026-09-11T15:21:00Z',
  },
};

const INITIAL_SHIPMENTS: Record<string, StoreXShipment> = {
  shp_501: {
    id: 'shp_501',
    order_id: 'ord_1002',
    recipient_name: 'Jordan Chen',
    delivery_address: '100 Market Street, San Francisco, CA',
    phone: '+1-555-0189',
    tracking_number: 'TRK-SF-99201',
    status: 'in_transit',
    items: [{ name: 'Ergonomic Desk Mat', qty: 2 }],
    created_at: '2026-09-11T16:00:00Z',
  },
};

const INITIAL_TICKETS: Record<string, StoreXTicket> = {
  tkt_701: {
    id: 'tkt_701',
    customer_id: 'cust_101',
    customer_name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    order_id: 'ord_1001',
    issue_description: 'Inquiry regarding warranty coverage for order #1001',
    status: 'open',
    created_at: '2026-09-12T11:00:00Z',
  },
};

const INITIAL_CAMPAIGNS: Record<string, StoreXCampaign> = {
  cmp_301: {
    id: 'cmp_301',
    name: 'Autumn Flash Sale',
    audience_tag: 'vip_customers',
    status: 'active',
    scheduled_at: '2026-09-20T10:00:00Z',
    created_at: '2026-09-12T09:00:00Z',
  },
};

export class StoreXStore {
  customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS)) as Record<string, StoreXCustomer>;
  orders = JSON.parse(JSON.stringify(INITIAL_ORDERS)) as Record<string, StoreXOrder>;
  products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS)) as Record<string, StoreXProduct>;
  payments = JSON.parse(JSON.stringify(INITIAL_PAYMENTS)) as Record<string, StoreXPayment>;
  shipments = JSON.parse(JSON.stringify(INITIAL_SHIPMENTS)) as Record<string, StoreXShipment>;
  tickets = JSON.parse(JSON.stringify(INITIAL_TICKETS)) as Record<string, StoreXTicket>;
  campaigns = JSON.parse(JSON.stringify(INITIAL_CAMPAIGNS)) as Record<string, StoreXCampaign>;
  analyticsEvents: Array<Record<string, any>> = [];

  reset(): void {
    this.customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
    this.orders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
    this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    this.payments = JSON.parse(JSON.stringify(INITIAL_PAYMENTS));
    this.shipments = JSON.parse(JSON.stringify(INITIAL_SHIPMENTS));
    this.tickets = JSON.parse(JSON.stringify(INITIAL_TICKETS));
    this.campaigns = JSON.parse(JSON.stringify(INITIAL_CAMPAIGNS));
    this.analyticsEvents = [];
  }
}

export const storexStore = new StoreXStore();
