-- House-hack underwriting — property unit rents + analysis storage

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS adu_monthly_rent NUMERIC,
  ADD COLUMN IF NOT EXISTS owner_unit_market_rent NUMERIC,
  ADD COLUMN IF NOT EXISTS monthly_taxes_insurance_hoa NUMERIC;

-- Property-based deal analyses (manual / legacy flow)
ALTER TABLE deal_analyses
  ADD COLUMN IF NOT EXISTS phase1 JSONB,
  ADD COLUMN IF NOT EXISTS phase2 JSONB,
  ADD COLUMN IF NOT EXISTS house_hack_score_breakdown JSONB;

-- Deals pipeline underwriting reports
ALTER TABLE underwriting_reports
  ADD COLUMN IF NOT EXISTS phase1 JSONB,
  ADD COLUMN IF NOT EXISTS phase2 JSONB,
  ADD COLUMN IF NOT EXISTS score_breakdown JSONB,
  ADD COLUMN IF NOT EXISTS deal_score NUMERIC,
  ADD COLUMN IF NOT EXISTS market_data JSONB,
  ADD COLUMN IF NOT EXISTS comparable_sales JSONB,
  ADD COLUMN IF NOT EXISTS rehab_breakdown JSONB,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT;
