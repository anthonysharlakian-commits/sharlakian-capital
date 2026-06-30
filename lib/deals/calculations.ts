export interface DealFormInput {
  address: string;
  city: string;
  market: string;
  list_price: number;
  property_type: string;
  adu_rent_estimate: number;
  mortgage_estimate: number;
  condition: string;
  commute_min: number;
  fha_eligible: boolean;
  notes: string;
}

export interface DealCalculations {
  adu_coverage_pct: number;
  phase2_coc: number;
  ai_score: number;
  coc_return: number;
}

export function calculateDealMetrics(input: DealFormInput): DealCalculations {
  const adu_coverage_pct =
    input.mortgage_estimate > 0
      ? (input.adu_rent_estimate / input.mortgage_estimate) * 100
      : 0;

  let ai_score = 0;
  if (input.fha_eligible) ai_score += 20;
  if (adu_coverage_pct >= 40) ai_score += 20;
  if (input.list_price <= 750_000) ai_score += 20;
  if (input.condition === "cosmetic") ai_score += 20;
  if (input.commute_min <= 60) ai_score += 20;

  const cashInvested = input.list_price > 0 ? input.list_price * 0.2 : 0;
  const phase2_coc =
    cashInvested > 0
      ? ((input.adu_rent_estimate * 12) / cashInvested) * 100
      : 0;

  return {
    adu_coverage_pct: Number(adu_coverage_pct.toFixed(1)),
    phase2_coc: Number(phase2_coc.toFixed(1)),
    ai_score,
    coc_return: Number(phase2_coc.toFixed(1)),
  };
}
