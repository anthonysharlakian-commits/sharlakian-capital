export type UnderwriterRecommendation = "GO" | "CAUTION" | "NO-GO";

export interface StressScenario {
  label: string;
  monthly_rent: number;
  monthly_piti: number;
  vacancy_adjusted_rent: number;
  maintenance_reserve: number;
  monthly_cash_flow: number;
}

export interface StressTestResults {
  rent_scenarios: StressScenario[];
  rate_scenarios: StressScenario[];
  combined_stress: StressScenario;
  tests: {
    rent_minus_10_passes: boolean;
    rate_plus_50bp_passes: boolean;
    combined_passes: boolean;
  };
  assumptions: {
    vacancy_rate: number;
    maintenance_annual_pct: number;
    base_rate_annual: number;
    base_monthly_rent: number;
    base_monthly_piti: number;
    hoa_monthly: number;
  };
}

export interface UnderwritingReport {
  id: string;
  deal_id: string;
  stress_test_results?: StressTestResults | null;
  risk_flags: string[];
  recommendation: UnderwriterRecommendation;
  reasoning: string;
  created_at: string;
  phase1?: HouseHackPhase1 | null;
  phase2?: Record<string, unknown> | null;
  score_breakdown?: HouseHackScoreBreakdown | null;
  deal_score?: number | null;
  market_data?: Record<string, unknown> | null;
  comparable_sales?: unknown[] | null;
  rehab_breakdown?: Record<string, unknown> | null;
  ai_summary?: string | null;
}

export interface HouseHackPhase1 {
  monthlyPI: number;
  monthlyMip: number;
  totalPiti: number;
  aduRentCoverage: number;
  effectiveHousingCost: number;
  monthlySavingsVsRenting: number;
  ownerUnitMarketRent?: number;
}

export interface HouseHackScoreBreakdown {
  phase1Score: number;
  phase2CapRateScore: number;
  phase2CocScore: number;
}

export interface DealForUnderwriting {
  id: string;
  address: string;
  list_price: number | null;
  property_id?: string | null;
  property_type?: string | null;
  city?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqft?: number | null;
  condition?: string | null;
  monthly_rental_income?: number | null;
  adu_rent_estimate?: number | null;
  monthly_mortgage?: number | null;
  mortgage_estimate?: number | null;
  monthly_cash_flow?: number | null;
  rent_coverage_ratio?: number | null;
  total_cash_needed?: number | null;
  confidence_level?: string | null;
  data_sources?: Record<string, unknown> | null;
  market?: string | null;
  notes?: string | null;
  ai_score?: number | null;
  status?: string | null;
}

export interface UnderwriterResult {
  deal_id: string;
  address: string;
  recommendation: UnderwriterRecommendation;
  reasoning: string;
  risk_flags: string[];
  stress_test_results: StressTestResults;
}
