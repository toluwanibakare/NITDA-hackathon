-- ThirdEye seed — 4 demo integrations per prd.md §3-4. Run after migrations.sql.
insert into integrations (id, name, purpose, status, risk_score, expected_request_rate, allowed_endpoints, allowed_methods, allowed_data, forbidden_data) values
('payment_001','Payment Provider','Process payments','ACTIVE',8,120,
 '{/payments,/payments/status}','{GET,POST}','{order_id,amount,transaction_id}','{password,customer_profile,marketing_data}'),
('delivery_001','Delivery Provider','Deliver customer orders','ACTIVE',12,80,
 '{/orders,/delivery,/delivery/status}','{GET,POST}','{order_id,delivery_address,customer_name,phone}','{payment,password,marketing}'),
('analytics_001','Analytics Provider','Collect anonymous usage statistics','ACTIVE',8,100,
 '{/analytics/events,/analytics/metrics}','{GET,POST}','{anonymous_user_id,page,event,timestamp}','{payment,phone,address,password,customer}'),
('marketing_001','Marketing Provider','Manage marketing campaigns','ACTIVE',22,95,
 '{/campaigns,/campaigns/events}','{GET,POST}','{campaign_id,anonymous_user_id,event}','{payment,password}')
on conflict (id) do update set name=excluded.name, purpose=excluded.purpose,
  allowed_endpoints=excluded.allowed_endpoints, allowed_methods=excluded.allowed_methods,
  allowed_data=excluded.allowed_data, forbidden_data=excluded.forbidden_data,
  expected_request_rate=excluded.expected_request_rate;
