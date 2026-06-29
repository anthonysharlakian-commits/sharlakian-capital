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

function calcMonthlyMortgage(
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
