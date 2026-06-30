export interface DashboardProperty {
  id: string;
  current_value: number | null;
  mortgage_balance: number | null;
  monthly_rent: number | null;
  monthly_expenses: number | null;
  status: string;
}

export interface DashboardDeal {
  id: string;
  property_id: string | null;
  address: string;
  city?: string | null;
  property_type: string | null;
  list_price: number | null;
  coc_return: number | null;
  ai_score: number | null;
  adu_rent_estimate?: number | null;
  mortgage_estimate?: number | null;
  adu_coverage_pct?: number | null;
  market?: string | null;
  condition?: string | null;
  commute_min?: number | null;
  phase2_coc?: number | null;
  fha_eligible?: boolean | null;
  listing_url?: string | null;
  status?: string | null;
  monthly_cash_flow?: number | null;
  rent_coverage_ratio?: number | null;
  total_cash_needed?: number | null;
  notes?: string | null;
  confidence_level?: string | null;
  data_sources?: Record<string, unknown> | null;
  monthly_rental_income?: number | null;
  monthly_mortgage?: number | null;
}

export interface DashboardUnderwritingReport {
  id: string;
  deal_id: string;
  stress_test_results: Record<string, unknown>;
  risk_flags: string[];
  recommendation: "GO" | "CAUTION" | "NO-GO";
  reasoning: string;
  created_at: string;
}

export interface CashflowEntry {
  month: string;
  net_cashflow: number | null;
  is_projected: boolean | null;
}

export interface DashboardAgent {
  id: string;
  agent_name: string;
  status: 'active' | 'scanning' | 'idle' | 'error' | string;
}

export interface DashboardMaintenance {
  id: string;
  title: string | null;
  unit: string | null;
  priority: 'high' | 'low' | 'medium' | 'emergency' | string;
  resolved: boolean | null;
}

export interface DashboardSetting {
  key: string;
  value: string | number | null;
}

export interface DashboardKpis {
  portfolioValue: number;
  totalEquity: number;
  monthlyCashFlow: number;
  liquidCapital: number;
  propertyCount: number;
}
