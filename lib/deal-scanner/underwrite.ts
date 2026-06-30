import { DEAL_SCANNER_CRITERIA } from "./criteria";
import type { ListingResearch, ScannerListing, UnderwritingResult } from "./types";

function monthlyPayment(principal: number, annualRate: number, years: number): number {
  if (principal <= 0) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function underwriteDeal(
  listing: ScannerListing,
  research: ListingResearch
): UnderwritingResult {
  const price = listing.price;
  const downPayment = price * DEAL_SCANNER_CRITERIA.fhaDownPct;
  const closingCosts = price * DEAL_SCANNER_CRITERIA.closingCostPct;
  const totalCashNeeded =
    downPayment + closingCosts + DEAL_SCANNER_CRITERIA.reserves;
  const loanAmount = price - downPayment;

  const monthlyPrincipalInterest = monthlyPayment(
    loanAmount,
    DEAL_SCANNER_CRITERIA.fhaRateAnnual,
    DEAL_SCANNER_CRITERIA.loanTermYears
  );

  const monthlyTax = research.taxMonthly;
  const monthlyInsurance = research.insuranceMonthly;
  const monthlyMortgagePiti =
    monthlyPrincipalInterest +
    monthlyTax +
    monthlyInsurance +
    research.hoaMonthly;

  const monthlyRentalIncome =
    research.aduRentEstimate + research.roomRentEstimate;
  const monthlyCashFlow = monthlyRentalIncome - monthlyMortgagePiti;

  const annualCashFlow = monthlyCashFlow * 12;
  const cocReturn =
    totalCashNeeded > 0 ? (annualCashFlow / totalCashNeeded) * 100 : 0;

  const rentCoverageRatio =
    monthlyMortgagePiti > 0
      ? monthlyRentalIncome / monthlyMortgagePiti
      : 0;

  return {
    downPayment,
    closingCosts,
    totalCashNeeded,
    loanAmount,
    monthlyPrincipalInterest,
    monthlyTax,
    monthlyInsurance,
    monthlyMortgagePiti,
    monthlyRentalIncome,
    monthlyCashFlow,
    cocReturn,
    rentCoverageRatio,
  };
}
