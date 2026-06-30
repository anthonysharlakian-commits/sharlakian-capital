export interface FinancialInputs {
  purchasePrice: number;
  downPaymentPct?: number;
  interestRate?: number;
  loanTermYears?: number;
  grossMonthlyRent: number;
  vacancyRate?: number;
  operatingExpenseRatio?: number;
  rehabEstimate?: number;
  closingCostPct?: number;
}

export interface FinancialMetrics {
  purchasePrice: number;
  downPayment: number;
  downPaymentPct: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  monthlyMortgage: number;
  grossMonthlyRent: number;
  vacancyRate: number;
  effectiveGrossIncome: number;
  operatingExpenses: number;
  noiMonthly: number;
  noiAnnual: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  capRate: number;
  cashOnCashReturn: number;
  dscr: number;
  grm: number;
  rehabEstimate: number;
  totalCashNeeded: number;
}

export function calcMonthlyMortgage(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  if (principal <= 0) return 0;
  const monthlyRate = annualRate / 12;
  const n = termYears * 12;
  if (monthlyRate === 0) return principal / n;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) /
    (Math.pow(1 + monthlyRate, n) - 1)
  );
}

export function calculateFinancialMetrics(
  inputs: FinancialInputs
): FinancialMetrics {
  const downPaymentPct = inputs.downPaymentPct ?? 0.2;
  const interestRate = inputs.interestRate ?? 0.07;
  const loanTerm = inputs.loanTermYears ?? 30;
  const vacancyRate = inputs.vacancyRate ?? 0.05;
  const opexRatio = inputs.operatingExpenseRatio ?? 0.4;
  const rehabEstimate = inputs.rehabEstimate ?? 0;
  const closingCostPct = inputs.closingCostPct ?? 0.03;

  const purchasePrice = inputs.purchasePrice;
  const downPayment = purchasePrice * downPaymentPct;
  const loanAmount = purchasePrice - downPayment;
  const monthlyMortgage = calcMonthlyMortgage(loanAmount, interestRate, loanTerm);
  const grossMonthlyRent = inputs.grossMonthlyRent;
  const effectiveGrossIncome = grossMonthlyRent * (1 - vacancyRate);
  const operatingExpenses = effectiveGrossIncome * opexRatio;
  const noiMonthly = effectiveGrossIncome - operatingExpenses;
  const noiAnnual = noiMonthly * 12;
  const monthlyCashFlow = noiMonthly - monthlyMortgage;
  const annualCashFlow = monthlyCashFlow * 12;
  const capRate = noiAnnual / purchasePrice;
  const closingCosts = purchasePrice * closingCostPct;
  const totalCashNeeded = downPayment + closingCosts + rehabEstimate;
  const cashOnCashReturn =
    totalCashNeeded > 0 ? annualCashFlow / totalCashNeeded : 0;
  const dscr = monthlyMortgage > 0 ? noiMonthly / monthlyMortgage : 0;
  const grm = grossMonthlyRent > 0 ? purchasePrice / (grossMonthlyRent * 12) : 0;

  return {
    purchasePrice,
    downPayment,
    downPaymentPct,
    loanAmount,
    interestRate,
    loanTerm,
    monthlyMortgage,
    grossMonthlyRent,
    vacancyRate,
    effectiveGrossIncome,
    operatingExpenses,
    noiMonthly,
    noiAnnual,
    capRate,
    cashOnCashReturn,
    dscr,
    grm,
    monthlyCashFlow,
    annualCashFlow,
    rehabEstimate,
    totalCashNeeded,
  };
}

export function getOperatingExpenseRatio(propertyType: string): number {
  const ratios: Record<string, number> = {
    sfr: 0.35,
    duplex: 0.38,
    triplex: 0.4,
    fourplex: 0.42,
    multifamily: 0.45,
  };
  return ratios[propertyType] ?? 0.4;
}

export const FHA_DEFAULTS = {
  downPaymentPct: 0.035,
  upfrontMipPct: 0.0175,
  annualMipPct: 0.0055,
  interestRate: 0.065,
  loanTermYears: 30,
};

export interface HouseHackInputs {
  purchasePrice: number;
  aduMonthlyRent: number;
  ownerUnitMarketRent: number;
  monthlyTaxesInsuranceHoa: number;
  interestRate?: number;
  operatingExpenseRatio?: number;
}

export interface HouseHackAnalysis {
  phase1: {
    monthlyPI: number;
    monthlyMip: number;
    totalPiti: number;
    aduRentCoverage: number;
    effectiveHousingCost: number;
    monthlySavingsVsRenting: number;
  };
  phase2: FinancialMetrics;
  dealScore: number;
  scoreBreakdown: {
    phase1Score: number;
    phase2CapRateScore: number;
    phase2CocScore: number;
  };
  recommendation: "GO" | "CAUTION" | "NO-GO";
}

export function calculateHouseHackAnalysis(
  inputs: HouseHackInputs
): HouseHackAnalysis {
  const rate = inputs.interestRate ?? FHA_DEFAULTS.interestRate;
  const downPayment = inputs.purchasePrice * FHA_DEFAULTS.downPaymentPct;
  const baseLoanAmount = inputs.purchasePrice - downPayment;
  const ufmip = baseLoanAmount * FHA_DEFAULTS.upfrontMipPct;
  const loanAmount = baseLoanAmount + ufmip;
  const monthlyPI = calcMonthlyMortgage(
    loanAmount,
    rate,
    FHA_DEFAULTS.loanTermYears
  );
  const monthlyMip = (loanAmount * FHA_DEFAULTS.annualMipPct) / 12;
  const totalPiti = monthlyPI + monthlyMip + inputs.monthlyTaxesInsuranceHoa;
  const aduRentCoverage =
    totalPiti > 0 ? inputs.aduMonthlyRent / totalPiti : 0;
  const effectiveHousingCost = totalPiti - inputs.aduMonthlyRent;
  const monthlySavingsVsRenting =
    inputs.ownerUnitMarketRent - effectiveHousingCost;

  const savingsRatio =
    inputs.ownerUnitMarketRent > 0
      ? monthlySavingsVsRenting / inputs.ownerUnitMarketRent
      : 0;

  let phase1Score = 0;
  if (savingsRatio >= 0.2) phase1Score = 40;
  else if (savingsRatio >= 0.1) phase1Score = 32;
  else if (savingsRatio >= 0.0) phase1Score = 24;
  else if (savingsRatio >= -0.1) phase1Score = 14;
  else phase1Score = 0;

  const phase2 = calculateFinancialMetrics({
    purchasePrice: inputs.purchasePrice,
    downPaymentPct: FHA_DEFAULTS.downPaymentPct,
    interestRate: rate,
    loanTermYears: FHA_DEFAULTS.loanTermYears,
    grossMonthlyRent: inputs.aduMonthlyRent + inputs.ownerUnitMarketRent,
    operatingExpenseRatio: inputs.operatingExpenseRatio,
  });

  let phase2CapRateScore = 0;
  if (phase2.capRate >= 0.07) phase2CapRateScore = 30;
  else if (phase2.capRate >= 0.06) phase2CapRateScore = 24;
  else if (phase2.capRate >= 0.05) phase2CapRateScore = 16;
  else if (phase2.capRate >= 0.04) phase2CapRateScore = 8;

  let phase2CocScore = 0;
  if (phase2.cashOnCashReturn >= 0.1) phase2CocScore = 30;
  else if (phase2.cashOnCashReturn >= 0.08) phase2CocScore = 24;
  else if (phase2.cashOnCashReturn >= 0.06) phase2CocScore = 16;
  else if (phase2.cashOnCashReturn >= 0.04) phase2CocScore = 8;

  const dealScore = phase1Score + phase2CapRateScore + phase2CocScore;
  const recommendation: "GO" | "CAUTION" | "NO-GO" =
    dealScore >= 70 ? "GO" : dealScore >= 50 ? "CAUTION" : "NO-GO";

  return {
    phase1: {
      monthlyPI,
      monthlyMip,
      totalPiti,
      aduRentCoverage,
      effectiveHousingCost,
      monthlySavingsVsRenting,
    },
    phase2,
    dealScore,
    scoreBreakdown: {
      phase1Score,
      phase2CapRateScore,
      phase2CocScore,
    },
    recommendation,
  };
}
