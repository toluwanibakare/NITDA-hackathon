-- ThirdEye Supabase schema — run in SQL editor. TECH_PRD §3.
create table if not exists integrations (
  id text primary key,
  name text not null,
  purpose text not null,
  status text not null default 'ACTIVE',
  risk_score int not null default 0,
  expected_request_rate int not null default 100,
  allowed_endpoints text[] default '{}',
  allowed_methods text[] default '{GET,POST}',
  allowed_data text[] default '{}',
  forbidden_data text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  integration_id text references integrations(id) on delete cascade,
  endpoint text not null,
  method text not null,
  data_category text not null,
  access_level text not null default 'allow'
);
create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  integration_id text references integrations(id) on delete set null,
  endpoint text not null,
  method text not null,
  data_requested text[] default '{}',
  risk_score int not null,
  action text not null,
  reason text,
  created_at timestamptz default now()
);
create table if not exists security_events (
  id uuid primary key default gen_random_uuid(),
  integration_id text references integrations(id) on delete set null,
  event_type text not null,
  endpoint text,
  risk_score int not null,
  action text not null,
  reason text not null,
  created_at timestamptz default now()
);
alter table integrations enable row level security;
alter table permissions enable row level security;
alter table requests enable row level security;
alter table security_events enable row level security;
-- anon read for live dashboard; writes via service_role (api)
drop policy if exists "anon read integrations" on integrations;
create policy "anon read integrations" on integrations for select to anon using (true);
drop policy if exists "anon read events" on security_events;
create policy "anon read events" on security_events for select to anon using (true);
drop policy if exists "anon read requests" on requests;
create policy "anon read requests" on requests for select to anon using (true);
-- realtime
alter publication supabase_realtime add table integrations;
alter publication supabase_realtime add table requests;
alter publication supabase_realtime add table security_events;
