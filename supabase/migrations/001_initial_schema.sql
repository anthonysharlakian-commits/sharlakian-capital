-- Sharlakian Holdings OS — Initial Schema
-- Run in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Contractors (referenced by maintenance_requests)
create table contractors (
  id uuid primary key default gen_random_uuid(),
  name text,
  trade text,
  phone text,
  email text,
  license_number text,
  rating numeric,
  avg_response_hours numeric,
  jobs_completed int default 0,
  notes text,
  created_at timestamptz default now()
);

-- Properties
create table properties (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  city text,
  state text,
  zip text,
  type text,
  status text default 'scanning',
  list_price numeric,
  purchase_price numeric,
  current_value numeric,
  mortgage_balance numeric,
  monthly_rent numeric,
  bedrooms int,
  bathrooms numeric,
  sqft int,
  year_built int,
  lot_size numeric,
  zillow_id text unique,
  zillow_url text,
  image_url text,
  rejection_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Deal Analysis
create table deal_analyses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  purchase_price numeric,
  down_payment numeric,
  down_payment_pct numeric,
  loan_amount numeric,
  interest_rate numeric,
  loan_term int default 30,
  monthly_mortgage numeric,
  gross_monthly_rent numeric,
  vacancy_rate numeric default 0.05,
  effective_gross_income numeric,
  operating_expenses numeric,
  noi_monthly numeric,
  noi_annual numeric,
  monthly_cash_flow numeric,
  annual_cash_flow numeric,
  cap_rate numeric,
  cash_on_cash_return numeric,
  dscr numeric,
  grm numeric,
  rehab_estimate numeric,
  total_cash_needed numeric,
  deal_score numeric,
  score_breakdown jsonb,
  ai_summary text,
  ai_recommendation text,
  comparable_sales jsonb,
  market_data jsonb,
  rehab_breakdown jsonb,
  created_at timestamptz default now()
);

-- Tenants
create table tenants (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  unit text,
  first_name text,
  last_name text,
  email text,
  phone text,
  monthly_rent numeric,
  lease_start date,
  lease_end date,
  status text default 'active',
  screening_score numeric,
  screening_report jsonb,
  created_at timestamptz default now()
);

-- Maintenance Requests
create table maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  tenant_id uuid references tenants(id),
  unit text,
  title text,
  description text,
  priority text default 'medium',
  status text default 'open',
  contractor_id uuid references contractors(id),
  estimated_cost numeric,
  actual_cost numeric,
  ai_diagnosis text,
  ai_contractor_recommendation text,
  submitted_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Financial Ledger
create table transactions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  type text,
  category text,
  amount numeric,
  description text,
  date date,
  tenant_id uuid references tenants(id),
  contractor_id uuid references contractors(id),
  created_at timestamptz default now()
);

-- Agent Activity Log
create table agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent text,
  action text,
  property_id uuid references properties(id),
  input jsonb,
  output jsonb,
  tokens_used int,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Portfolio Snapshots
create table portfolio_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date,
  total_properties int,
  total_portfolio_value numeric,
  total_debt numeric,
  total_equity numeric,
  gross_monthly_rent numeric,
  total_monthly_expenses numeric,
  net_monthly_cash_flow numeric,
  overall_coc_return numeric,
  created_at timestamptz default now()
);

-- Acquisition criteria (user-configurable)
create table acquisition_criteria (
  id uuid primary key default gen_random_uuid(),
  property_types text[] default array['sfr','duplex','triplex','fourplex'],
  markets jsonb default '[]'::jsonb,
  min_price numeric default 250000,
  max_price numeric default 550000,
  min_cap_rate numeric default 0.05,
  min_coc_return numeric default 0.06,
  max_vacancy_rate numeric default 0.08,
  min_deal_score numeric default 65,
  updated_at timestamptz default now()
);

-- Indexes
create index idx_properties_status on properties(status);
create index idx_deal_analyses_property on deal_analyses(property_id);
create index idx_agent_logs_agent on agent_logs(agent);
create index idx_agent_logs_created on agent_logs(created_at desc);
create index idx_transactions_property on transactions(property_id);
create index idx_maintenance_status on maintenance_requests(status);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger properties_updated_at
  before update on properties
  for each row execute function update_updated_at();

-- Row Level Security
alter table properties enable row level security;
alter table deal_analyses enable row level security;
alter table tenants enable row level security;
alter table maintenance_requests enable row level security;
alter table contractors enable row level security;
alter table transactions enable row level security;
alter table agent_logs enable row level security;
alter table portfolio_snapshots enable row level security;
alter table acquisition_criteria enable row level security;

-- Authenticated users can read/write all (single-owner system)
create policy "Authenticated full access" on properties for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on deal_analyses for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on tenants for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on maintenance_requests for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on contractors for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on transactions for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on agent_logs for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on portfolio_snapshots for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on acquisition_criteria for all using (auth.role() = 'authenticated');

-- Seed default acquisition criteria
insert into acquisition_criteria (markets) values (
  '[
    {"name": "Inland Empire", "cities": ["Riverside", "San Bernardino", "Moreno Valley", "Corona"]},
    {"name": "High Desert", "cities": ["Victorville", "Apple Valley", "Hesperia", "Adelanto"]},
    {"name": "Santa Clarita Valley", "cities": ["Santa Clarita", "Valencia", "Newhall", "Canyon Country"]}
  ]'::jsonb
);

-- Seed sample contractors
insert into contractors (name, trade, phone, email, rating, avg_response_hours, jobs_completed) values
  ('Desert Pro Plumbing', 'plumbing', '760-555-0101', 'dispatch@desertpro.com', 4.8, 2, 142),
  ('IE Electric Co', 'electrical', '909-555-0102', 'jobs@ieelectric.com', 4.6, 4, 89),
  ('High Desert HVAC', 'hvac', '760-555-0103', 'service@hdhvac.com', 4.9, 3, 201),
  ('All Valley General', 'general', '661-555-0104', 'info@allvalleygeneral.com', 4.5, 6, 156),
  ('Summit Roofing', 'roofing', '909-555-0105', 'estimates@summitroof.com', 4.7, 8, 67);
