import { DEAL_SCANNER_CRITERIA } from "@/lib/deal-scanner/criteria";
import { marketForZip } from "@/lib/deal-scanner/criteria";
import type { DealForUnderwriting, StressScenario, StressTestResults } from "./types";

const VACANCY_RATE = 0.05;
const MAINTENANCE_ANNUAL_PCT = 0.01;

export function monthlyPayment(
  principal: number,
  annualRate: number,
  years: number
): number {
  if (principal <= 0) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function taxRateForDeal(deal: DealForUnderwriting): number {
  if (deal.market === "SCV") {
    return DEAL_SCANNER_CRITERIA.markets[0].taxRate;
  }
  if (deal.market === "IE") {
    return DEAL_SCANNER_CRITERIA.markets[1].taxRate;
  }
  return DEAL_SCANNER_CRITERIA.markets[1].taxRate;
}

export function deriveDealFinancials(deal: DealForUnderwriting) {
  const price = deal.list_price ?? 0;
  const baseRent =
    deal.monthly_rental_income ?? deal.adu_rent_estimate ?? 0;
  const basePiti =
    deal.monthly_mortgage ?? deal.mortgage_estimate ?? 0;

  const downPayment = price * DEAL_SCANNER_CRITERIA.fhaDownPct;
  const loanAmount = price - downPayment;
  const taxMonthly = (price * taxRateForDeal(deal)) / 12;
  const insuranceMonthly = DEAL_SCANNER_CRITERIA.insuranceMonthly;
  const basePi = monthlyPayment(
    loanAmount,
    DEAL_SCANNER_CRITERIA.fhaRateAnnual,
    DEAL_SCANNER_CRITERIA.loanTermYears
  );
  const hoaMonthly = Math.max(
    0,
    basePiti - basePi - taxMonthly - insuranceMonthly
  );

  return {
    price,
    baseRent,
    basePiti,
    loanAmount,
    taxMonthly,
    insuranceMonthly,
    hoaMonthly,
    basePi,
  };
}

function pitiAtRate(
  loanAmount: number,
  rateAnnual: number,
  taxMonthly: number,
  insuranceMonthly: number,
  hoaMonthly: number
): number {
  const pi = monthlyPayment(
    loanAmount,
    rateAnnual,
    DEAL_SCANNER_CRITERIA.loanTermYears
  );
  return pi + taxMonthly + insuranceMonthly + hoaMonthly;
}

function scenarioCashFlow(
  monthlyRent: number,
  monthlyPiti: number,
  price: number
): Omit<StressScenario, "label" | "monthly_rent" | "monthly_piti"> & {
  monthly_rent: number;
  monthly_piti: number;
} {
  const vacancyAdjustedRent = monthlyRent * (1 - VACANCY_RATE);
  const maintenanceReserve = (price * MAINTENANCE_ANNUAL_PCT) / 12;
  const monthlyCashFlow =
    vacancyAdjustedRent - maintenanceReserve - monthlyPiti;

  return {
    monthly_rent: monthlyRent,
    monthly_piti: monthlyPiti,
    vacancy_adjusted_rent: vacancyAdjustedRent,
    maintenance_reserve: maintenanceReserve,
    monthly_cash_flow: monthlyCashFlow,
  };
}

function buildScenario(
  label: string,
  monthlyRent: number,
  monthlyPiti: number,
  price: number
): StressScenario {
  return { label, ...scenarioCashFlow(monthlyRent, monthlyPiti, price) };
}

export function runStressTests(deal: DealForUnderwriting): StressTestResults {
  const {
    price,
    baseRent,
    basePiti,
    loanAmount,
    taxMonthly,
    insuranceMonthly,
    hoaMonthly,
  } = deriveDealFinancials(deal);

  const baseRate = DEAL_SCANNER_CRITERIA.fhaRateAnnual;
  const ratePlus50 = baseRate + 0.005;
  const ratePlus100 = baseRate + 0.01;

  const pitiBase = basePiti;
  const pitiPlus50 = pitiAtRate(
    loanAmount,
    ratePlus50,
    taxMonthly,
    insuranceMonthly,
    hoaMonthly
  );
  const pitiPlus100 = pitiAtRate(
    loanAmount,
    ratePlus100,
    taxMonthly,
    insuranceMonthly,
    hoaMonthly
  );

  const rentAsIs = baseRent;
  const rentMinus10 = baseRent * 0.9;
  const rentMinus20 = baseRent * 0.8;

  const rentScenarios = [
    buildScenario("As-is rent", rentAsIs, pitiBase, price),
    buildScenario("Rent -10%", rentMinus10, pitiBase, price),
    buildScenario("Rent -20%", rentMinus20, pitiBase, price),
  ];

  const rateScenarios = [
    buildScenario("Current rate", rentAsIs, pitiBase, price),
    buildScenario("Rate +0.5%", rentAsIs, pitiPlus50, price),
    buildScenario("Rate +1.0%", rentAsIs, pitiPlus100, price),
  ];

  const combinedStress = buildScenario(
    "Rent -10% + Rate +0.5%",
    rentMinus10,
    pitiPlus50,
    price
  );

  const rentMinus10Passes =
    buildScenario("Rent -10% test", rentMinus10, pitiBase, price)
      .monthly_cash_flow >= 0;
  const ratePlus50Passes =
    buildScenario("Rate +0.5% test", rentAsIs, pitiPlus50, price)
      .monthly_cash_flow >= 0;
  const combinedPasses = combinedStress.monthly_cash_flow >= 0;

  return {
    rent_scenarios: rentScenarios,
    rate_scenarios: rateScenarios,
    combined_stress: combinedStress,
    tests: {
      rent_minus_10_passes: rentMinus10Passes,
      rate_plus_50bp_passes: ratePlus50Passes,
      combined_passes: combinedPasses,
    },
    assumptions: {
      vacancy_rate: VACANCY_RATE,
      maintenance_annual_pct: MAINTENANCE_ANNUAL_PCT,
      base_rate_annual: baseRate,
      base_monthly_rent: baseRent,
      base_monthly_piti: basePiti,
      hoa_monthly: hoaMonthly,
    },
  };
}

export function detectHoaFromNotes(notes?: string | null): boolean {
  if (!notes) return false;
  return /\bhoa\b/i.test(notes);
}

/** Re-export for zip-based tax lookup when market column missing */
export { marketForZip };
