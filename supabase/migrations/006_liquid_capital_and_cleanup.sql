-- Session log pending tasks — run in Supabase SQL Editor
-- https://supabase.com/dashboard/project/wqhrakrfrdxehiaindpq/sql

-- Clear fake seed data (keeps agents + settings)
DELETE FROM deals;
DELETE FROM maintenance_requests;
DELETE FROM monthly_cashflow_log;
DELETE FROM properties;

-- Set liquid capital to $30,000
INSERT INTO settings (key, value, updated_at)
VALUES ('liquid_capital', '30000', now())
ON CONFLICT (key) DO UPDATE SET value = '30000', updated_at = now();
