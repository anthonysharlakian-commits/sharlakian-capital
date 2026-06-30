-- Underwriter Agent — stress test reports for qualified deals
CREATE TABLE IF NOT EXISTS underwriting_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  stress_test_results JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendation TEXT NOT NULL CHECK (recommendation IN ('GO', 'CAUTION', 'NO-GO')),
  reasoning TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_underwriting_reports_deal_id ON underwriting_reports(deal_id);
CREATE INDEX IF NOT EXISTS idx_underwriting_reports_created_at ON underwriting_reports(created_at DESC);

ALTER TABLE underwriting_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_underwriting_reports"
  ON underwriting_reports FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_insert_underwriting_reports"
  ON underwriting_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_update_underwriting_reports"
  ON underwriting_reports FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated');
