-- Seed demo data for Sharlakian Holdings OS
-- Run after 001_initial_schema.sql when setting up a fresh Supabase project

insert into properties (
  id, address, city, state, zip, type, status, list_price, purchase_price,
  current_value, mortgage_balance, monthly_rent, bedrooms, bathrooms, sqft, year_built, zillow_id
) values
  ('11111111-1111-1111-1111-111111111001', '14203 Desert Willow Dr', 'Victorville', 'CA', '92392', 'sfr', 'pending_approval', 389000, 375000, null, null, 2400, 3, 2, 1650, 2004, 'seed-001'),
  ('11111111-1111-1111-1111-111111111002', '2847 E Highland Ave', 'San Bernardino', 'CA', '92404', 'sfr', 'underwriting', 325000, null, null, null, 2200, 4, 2, 1820, 1987, 'seed-002'),
  ('11111111-1111-1111-1111-111111111003', '4512 Copper Hill Rd', 'Apple Valley', 'CA', '92307', 'sfr', 'owned', 279000, 265000, 310000, 198000, 1950, 3, 2, 1480, 1999, 'seed-003'),
  ('11111111-1111-1111-1111-111111111004', '891 W Foothill Blvd', 'Rialto', 'CA', '92376', 'duplex', 'approved', 445000, 430000, null, null, 3200, 4, 3, 2100, 2008, 'seed-004')
on conflict (zillow_id) do nothing;

insert into deal_analyses (
  property_id, purchase_price, down_payment, down_payment_pct, loan_amount,
  interest_rate, loan_term, monthly_mortgage, gross_monthly_rent, vacancy_rate,
  effective_gross_income, operating_expenses, noi_monthly, noi_annual,
  monthly_cash_flow, annual_cash_flow, cap_rate, cash_on_cash_return, dscr, grm,
  rehab_estimate, total_cash_needed, deal_score, score_breakdown,
  ai_summary, ai_recommendation, comparable_sales, market_data, rehab_breakdown
) values (
  '11111111-1111-1111-1111-111111111001',
  375000, 75000, 0.2, 300000, 0.07, 30, 1996, 2400, 0.05,
  2280, 798, 1482, 17784, 486, 5832, 0.0474, 0.059, 0.74, 13.02,
  15000, 98250, 82,
  '{"location": 8, "cashflow": 7, "appreciation": 9, "condition": 8, "financing": 8}'::jsonb,
  'Strong Victorville SFR in established neighborhood. Below-market purchase opportunity with value-add potential through rent optimization.',
  'buy',
  '[{"address": "14100 Desert Willow Dr", "sold_price": 382000, "sold_date": "2025-11-15", "sqft": 1620, "beds": 3, "baths": 2}]'::jsonb,
  '{"avg_days_on_market": 28, "list_to_sale_ratio": 0.97, "avg_rent_by_bedroom": {"3": 2350}, "vacancy_rate": 0.04, "price_appreciation_12mo": 0.062, "neighborhood_score": 72, "population_growth": 0.018, "job_growth": 0.024}'::jsonb,
  '{"total_estimate": 15000, "breakdown": {"paint": 3000, "flooring": 4000, "kitchen": 5000, "bathrooms": 2000, "landscaping": 1000}, "condition_rating": "good", "value_add_potential": 25000}'::jsonb
);

insert into tenants (
  id, property_id, unit, first_name, last_name, email, phone,
  monthly_rent, lease_start, lease_end, status, screening_score
) values (
  '22222222-2222-2222-2222-222222222001',
  '11111111-1111-1111-1111-111111111003',
  'Main', 'Maria', 'Garcia', 'maria.g@email.com', '760-555-0201',
  1950, '2024-06-01', '2025-05-31', 'active', 88
);

insert into maintenance_requests (
  id, property_id, tenant_id, title, description, priority, status,
  estimated_cost, ai_diagnosis, ai_contractor_recommendation
) values (
  '33333333-3333-3333-3333-333333333001',
  '11111111-1111-1111-1111-111111111003',
  '22222222-2222-2222-2222-222222222001',
  'AC not cooling',
  'Air conditioner running but not producing cold air.',
  'high', 'assigned', 350,
  'Likely refrigerant leak or compressor issue.',
  'High Desert HVAC — 4.9 rating'
);

insert into transactions (property_id, type, category, amount, description, date, tenant_id) values
  ('11111111-1111-1111-1111-111111111003', 'income', 'rent', 1950, 'March rent', '2026-03-01', '22222222-2222-2222-2222-222222222001'),
  ('11111111-1111-1111-1111-111111111003', 'expense', 'mortgage', 1420, 'P&I payment', '2026-03-01', null),
  ('11111111-1111-1111-1111-111111111003', 'expense', 'insurance', 145, 'Landlord insurance', '2026-03-05', null);
