import type { MarketTier } from "./criteria";
import type { ConfidenceLevel, DealDataSources } from "./confidence";

export interface ScannerListing {
  zpid: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  aduSqft?: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType: string;
  description: string;
  url: string;
  hoaMonthly?: number;
  images: string[];
}

export interface ListingResearch {
  aduSignal: boolean;
  aduExists: boolean;
  aduPotentialOnly: boolean;
  aduRentEstimate: number;
  roomRentEstimate: number;
  hoaMonthly: number;
  taxMonthly: number;
  insuranceMonthly: number;
  market: MarketTier;
  confidenceLevel: ConfidenceLevel;
  dataSources: DealDataSources;
}

export interface UnderwritingResult {
  downPayment: number;
  closingCosts: number;
  totalCashNeeded: number;
  loanAmount: number;
  monthlyPrincipalInterest: number;
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyMortgagePiti: number;
  monthlyRentalIncome: number;
  monthlyCashFlow: number;
  cocReturn: number;
  rentCoverageRatio: number;
}

export interface ScoredDeal {
  listing: ScannerListing;
  research: ListingResearch;
  underwriting: UnderwritingResult;
  dealScore: number;
  confidenceLevel: ConfidenceLevel;
  dataSources: DealDataSources;
}

export interface ScanSummary {
  deals_found: number;
  deals_qualified: number;
  deals_inserted: number;
  scanned: number;
  qualified: number;
  inserted: number;
  api_calls_used?: number;
  rentcast_auth_failures?: number;
  rentcast_last_error?: string;
  rate_limit_warning?: string;
  mock_mode?: boolean;
  live_mode?: boolean;
}

export interface ListingScanResult {
  zpid: string;
  address: string;
  city: string;
  zip: string;
  price: number;
  market: string | null;
  qualified: boolean;
  disqualifiedReason: string | null;
  dealScore: number | null;
  downPayment: number | null;
  closingCosts: number | null;
  totalCashNeeded: number | null;
  monthlyPiti: number | null;
  monthlyRentalIncome: number | null;
  monthlyCashFlow: number | null;
  cocReturn: number | null;
  rentCoverageRatio: number | null;
  aduExists: boolean | null;
  confidenceLevel: ConfidenceLevel | null;
  inserted: boolean;
}
