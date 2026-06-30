-- STEP 1: Clear fake seed data (keeps agents + settings)
DELETE FROM deals;
DELETE FROM maintenance_requests;
DELETE FROM monthly_cashflow_log;
DELETE FROM properties;

-- STEP 2: Extended deal fields for manual pipeline entries
ALTER TABLE deals ADD COLUMN IF NOT EXISTS adu_rent_estimate NUMERIC DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS mortgage_estimate NUMERIC DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS adu_coverage_pct NUMERIC DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS market TEXT DEFAULT '';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'cosmetic';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS commute_min INTEGER DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS phase2_coc NUMERIC DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS fha_eligible BOOLEAN DEFAULT true;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Standalone deals (no linked property) for manual entry
ALTER TABLE deals ALTER COLUMN property_id DROP NOT NULL;
