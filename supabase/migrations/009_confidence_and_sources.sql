-- Deal confidence + source attribution
ALTER TABLE deals ADD COLUMN IF NOT EXISTS confidence_level TEXT DEFAULT 'Low';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS data_sources JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_deals_confidence ON deals(confidence_level);
