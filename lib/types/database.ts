export type PropertyStatus =
  | "scanning"
  | "underwriting"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "under_contract"
  | "active"
  | "owned"
  | "dead";

export type PropertyType = "sfr" | "duplex" | "triplex" | "fourplex" | "multifamily";

export type AIRecommendation = "strong_buy" | "buy" | "pass" | "investigate";

export type AgentName =
  | "deal_scanner"
  | "underwriter"
  | "market_intel"
  | "rehab_estimator"
  | "tenant_screener"
  | "maintenance_router"
  | "refi_monitor"
  | "financial_reporter"
  | "orchestrator";

export interface ScoreBreakdown {
  location: number;
  cashflow: number;
  appreciation: number;
  condition: number;
  financing: number;
}

export interface Property {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  type: PropertyType | null;
  status: PropertyStatus;
  list_price: number | null;
  purchase_price: number | null;
  current_value: number | null;
  mortgage_balance: number | null;
  monthly_rent: number | null;
  monthly_expenses?: number | null;
  adu_monthly_rent?: number | null;
  owner_unit_market_rent?: number | null;
  monthly_taxes_insurance_hoa?: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  year_built: number | null;
  lot_size: number | null;
  zillow_id: string | null;
  zillow_url: string | null;
  image_url: string | null;
  rejection_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealAnalysis {
  id: string;
  property_id: string;
  purchase_price: number | null;
  down_payment: number | null;
  down_payment_pct: number | null;
  loan_amount: number | null;
  interest_rate: number | null;
  loan_term: number;
  monthly_mortgage: number | null;
  gross_monthly_rent: number | null;
  vacancy_rate: number;
  effective_gross_income: number | null;
  operating_expenses: number | null;
  noi_monthly: number | null;
  noi_annual: number | null;
  monthly_cash_flow: number | null;
  annual_cash_flow: number | null;
  cap_rate: number | null;
  cash_on_cash_return: number | null;
  dscr: number | null;
  grm: number | null;
  rehab_estimate: number | null;
  total_cash_needed: number | null;
  deal_score: number | null;
  score_breakdown: ScoreBreakdown | null;
  ai_summary: string | null;
  ai_recommendation: AIRecommendation | null;
  comparable_sales: ComparableSale[] | null;
  market_data: MarketData | null;
  rehab_breakdown: RehabBreakdown | null;
  phase1?: HouseHackPhase1 | null;
  phase2?: Record<string, unknown> | null;
  house_hack_score_breakdown?: {
    phase1Score: number;
    phase2CapRateScore: number;
    phase2CocScore: number;
  } | null;
  created_at: string;
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

export interface ComparableSale {
  address: string;
  sold_price: number;
  sold_date: string;
  sqft: number;
  beds: number;
  baths: number;
}

export interface MarketData {
  avg_days_on_market: number;
  list_to_sale_ratio: number;
  avg_rent_by_bedroom: Record<string, number>;
  vacancy_rate: number;
  price_appreciation_12mo: number;
  neighborhood_score: number;
  population_growth: number;
  job_growth: number;
}

export interface RehabBreakdown {
  total_estimate: number;
  breakdown: Record<string, number>;
  condition_rating: "excellent" | "good" | "fair" | "poor";
  value_add_potential: number;
}

export interface Tenant {
  id: string;
  property_id: string;
  unit: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  monthly_rent: number | null;
  lease_start: string | null;
  lease_end: string | null;
  status: "active" | "late" | "eviction" | "former";
  screening_score: number | null;
  screening_report: Record<string, unknown> | null;
  created_at: string;
}

export interface MaintenanceRequest {
  id: string;
  property_id: string;
  tenant_id: string | null;
  unit: string | null;
  title: string | null;
  description: string | null;
  priority: "emergency" | "high" | "medium" | "low";
  status: "open" | "assigned" | "in_progress" | "completed" | "closed";
  contractor_id: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  ai_diagnosis: string | null;
  ai_contractor_recommendation: string | null;
  submitted_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface Contractor {
  id: string;
  name: string | null;
  trade: string | null;
  phone: string | null;
  email: string | null;
  license_number: string | null;
  rating: number | null;
  avg_response_hours: number | null;
  jobs_completed: number;
  notes: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  property_id: string;
  type: "income" | "expense";
  category: string;
  amount: number | null;
  description: string | null;
  date: string | null;
  tenant_id: string | null;
  contractor_id: string | null;
  created_at: string;
}

export interface AgentLog {
  id: string;
  agent: AgentName;
  action: string;
  property_id: string | null;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  tokens_used: number | null;
  status: "success" | "error" | "pending";
  created_at: string;
}

export interface PortfolioSnapshot {
  id: string;
  snapshot_date: string;
  total_properties: number;
  total_portfolio_value: number | null;
  total_debt: number | null;
  total_equity: number | null;
  gross_monthly_rent: number | null;
  total_monthly_expenses: number | null;
  net_monthly_cash_flow: number | null;
  overall_coc_return: number | null;
  created_at: string;
}

export interface AcquisitionCriteria {
  id: string;
  property_types: string[];
  markets: { name: string; cities: string[] }[];
  min_price: number;
  max_price: number;
  min_cap_rate: number;
  min_coc_return: number;
  max_vacancy_rate: number;
  min_deal_score: number;
  updated_at: string;
}

export interface PropertyWithAnalysis extends Property {
  deal_analyses?: DealAnalysis[];
}

export interface ZillowListing {
  zpid: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt?: number;
  lotSize?: number;
  propertyType: string;
  zestimate?: number;
  rentZestimate?: number;
  images: string[];
  url: string;
  description?: string;
}
