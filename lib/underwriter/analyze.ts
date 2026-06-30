import { DEAL_SCANNER_CRITERIA } from "@/lib/deal-scanner/criteria";
import {
  deriveDealFinancials,
  detectHoaFromNotes,
  runStressTests,
} from "./calculations";
import type {
  DealForUnderwriting,
  UnderwriterRecommendation,
  UnderwriterResult,
} from "./types";

function buildRiskFlags(
  deal: DealForUnderwriting,
  stress: ReturnType<typeof runStressTests>
): string[] {
  const flags: string[] = [];
  const { price, hoaMonthly } = deriveDealFinancials(deal);
  const coverage =
    deal.rent_coverage_ratio ??
    (stress.assumptions.base_monthly_piti > 0
      ? stress.assumptions.base_monthly_rent /
        stress.assumptions.base_monthly_piti
      : 0);

  if (
    deal.confidence_level?.toLowerCase() === "low" ||
    !deal.confidence_level
  ) {
    flags.push("Low confidence in rent estimates — verify comps before acting");
  }

  if (hoaMonthly > 0 || detectHoaFromNotes(deal.notes)) {
    flags.push("HOA fees present — reduces net cash flow and adds risk");
  }

  if (coverage < 0.9) {
    flags.push(
      `Rent coverage below 90% in best case (${(coverage * 100).toFixed(0)}%)`
    );
  }

  const cashNeeded = deal.total_cash_needed ?? 0;
  if (cashNeeded >= DEAL_SCANNER_CRITERIA.maxCashNeeded - 2_000) {
    flags.push(
      `Total cash needed (${formatMoney(cashNeeded)}) is within $2,000 of the $40,000 limit — little buffer for surprises`
    );
  }

  if (price >= DEAL_SCANNER_CRITERIA.maxPrice - 10_000) {
    flags.push(
      `List price (${formatMoney(price)}) is within $10,000 of the $530,000 max — limited negotiation room`
    );
  }

  return flags;
}

function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

function deriveRecommendation(
  tests: ReturnType<typeof runStressTests>["tests"]
): UnderwriterRecommendation {
  if (tests.combined_passes) return "GO";
  if (tests.rent_minus_10_passes || tests.rate_plus_50bp_passes) {
    return "CAUTION";
  }
  return "NO-GO";
}

function buildReasoning(
  deal: DealForUnderwriting,
  recommendation: UnderwriterRecommendation,
  stress: ReturnType<typeof runStressTests>,
  flags: string[]
): string {
  const combined = stress.combined_stress;
  const cashStr = formatMoney(combined.monthly_cash_flow);

  if (recommendation === "GO") {
    return `${deal.address} holds up under combined stress (rent -10% and rate +0.5%), with ${cashStr}/mo cash flow after vacancy and maintenance reserves. ${flags.length ? `Watch: ${flags[0]}` : "No major risk flags."}`;
  }

  if (recommendation === "CAUTION") {
    const passes: string[] = [];
    if (stress.tests.rent_minus_10_passes) passes.push("rent -10% at current rate");
    if (stress.tests.rate_plus_50bp_passes) passes.push("rate +0.5% at current rent");
    return `${deal.address} passes ${passes.join(" and ")} individually but fails combined stress. Combined scenario shows ${cashStr}/mo — proceed only with verified rents and rate lock plan.`;
  }

  return `${deal.address} fails both rent (-10%) and rate (+0.5%) stress tests individually. Combined cash flow is ${cashStr}/mo — not recommended at current assumptions.`;
}

export function analyzeDeal(deal: DealForUnderwriting): UnderwriterResult {
  const stress = runStressTests(deal);
  const risk_flags = buildRiskFlags(deal, stress);
  const recommendation = deriveRecommendation(stress.tests);
  const reasoning = buildReasoning(deal, recommendation, stress, risk_flags);

  return {
    deal_id: deal.id,
    address: deal.address,
    recommendation,
    reasoning,
    risk_flags,
    stress_test_results: stress,
  };
}
