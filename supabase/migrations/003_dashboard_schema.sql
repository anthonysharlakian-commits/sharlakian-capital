-- Dashboard schema — tables and columns for live KPI dashboard

-- Properties: operating expenses + active status for owned holdings
alter table properties add column if not exists monthly_expenses numeric default 0;

update properties set status = 'active' where status = 'owned';

update properties
set monthly_expenses = coalesce(monthly_expenses, 0)
where status = 'active' and monthly_expenses is null;

-- Maintenance: resolved flag for open-request filtering
alter table maintenance_requests add column if not exists resolved boolean default false;

update maintenance_requests
set resolved = true
where status in ('completed', 'closed') and resolved = false;

-- Settings key-value store
create table if not exists settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Agent registry status
create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null unique,
  status text not null default 'idle',
  last_run_at timestamptz,
  created_at timestamptz default now()
);

-- Deal pipeline (denormalized for dashboard)
create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  address text not null,
  property_type text,
  list_price numeric,
  coc_return numeric,
  ai_score numeric,
  created_at timestamptz default now()
);

create index if not exists idx_deals_ai_score on deals(ai_score desc nulls last);
create index if not exists idx_deals_property on deals(property_id);
create unique index if not exists idx_deals_property_unique on deals(property_id);

-- Monthly cash flow log
create table if not exists monthly_cashflow_log (
  id uuid primary key default gen_random_uuid(),
  month date not null unique,
  net_cashflow numeric default 0,
  is_projected boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_cashflow_month on monthly_cashflow_log(month);

-- RLS
alter table settings enable row level security;
alter table agents enable row level security;
alter table deals enable row level security;
alter table monthly_cashflow_log enable row level security;

create policy "Authenticated full access" on settings for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on agents for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on deals for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on monthly_cashflow_log for all using (auth.role() = 'authenticated');

-- Seed settings
insert into settings (key, value) values
  ('liquid_capital', '250000')
on conflict (key) do nothing;

-- Seed agents
insert into agents (agent_name, status) values
  ('Deal Scanner', 'active'),
  ('Underwriter', 'idle'),
  ('Maintenance Router', 'active'),
  ('Refi Monitor', 'idle'),
  ('Financial Reporter', 'idle'),
  ('Tenant Screener', 'idle')
on conflict (agent_name) do nothing;

-- Seed deals from pipeline properties + analyses
insert into deals (property_id, address, property_type, list_price, coc_return, ai_score)
select
  p.id,
  p.address,
  p.type,
  p.list_price,
  round((da.cash_on_cash_return * 100)::numeric, 1),
  da.deal_score
from properties p
join lateral (
  select * from deal_analyses
  where property_id = p.id
  order by created_at desc
  limit 1
) da on true
where p.status in ('scanning', 'underwriting', 'pending_approval', 'approved')
on conflict (property_id) do update set
  address = excluded.address,
  property_type = excluded.property_type,
  list_price = excluded.list_price,
  coc_return = excluded.coc_return,
  ai_score = excluded.ai_score;

-- Seed monthly expenses for active properties from transactions avg
update properties p
set monthly_expenses = sub.total
from (
  select
    property_id,
    coalesce(sum(abs(amount)), 0) as total
  from transactions
  where type = 'expense'
  group by property_id
) sub
where p.id = sub.property_id and p.status = 'active';

-- Seed cashflow from transactions (last 12 months)
insert into monthly_cashflow_log (month, net_cashflow, is_projected)
select
  date_trunc('month', t.date)::date as month,
  sum(case when t.type = 'income' then t.amount else -abs(t.amount) end) as net_cashflow,
  false
from transactions t
where t.date >= date_trunc('month', now()) - interval '11 months'
group by date_trunc('month', t.date)::date
on conflict (month) do nothing;
