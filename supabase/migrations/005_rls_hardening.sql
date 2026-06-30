-- RLS hardening: authenticated-only access on dashboard tables

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_cashflow_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON properties;
DROP POLICY IF EXISTS "Allow all" ON deals;
DROP POLICY IF EXISTS "Allow all" ON monthly_cashflow_log;
DROP POLICY IF EXISTS "Allow all" ON agents;
DROP POLICY IF EXISTS "Allow all" ON maintenance_requests;
DROP POLICY IF EXISTS "Allow all" ON settings;
DROP POLICY IF EXISTS "Authenticated full access" ON properties;
DROP POLICY IF EXISTS "Authenticated full access" ON deals;
DROP POLICY IF EXISTS "Authenticated full access" ON monthly_cashflow_log;
DROP POLICY IF EXISTS "Authenticated full access" ON agents;
DROP POLICY IF EXISTS "Authenticated full access" ON maintenance_requests;
DROP POLICY IF EXISTS "Authenticated full access" ON settings;

CREATE POLICY "Auth only" ON properties FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth only" ON deals FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth only" ON monthly_cashflow_log FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth only" ON agents FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth only" ON maintenance_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth only" ON settings FOR ALL USING (auth.role() = 'authenticated');
