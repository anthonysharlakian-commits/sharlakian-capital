/** Hardcoded FHA house-hack acquisition criteria — Deal Scanner Phase 1 */
export const DEAL_SCANNER_CRITERIA = {
  minPrice: 300_000,
  maxPrice: 530_000,
  minDealScore: 65,
  fhaDownPct: 0.035,
  closingCostPct: 0.025,
  reserves: 8_000,
  fhaRateAnnual: 0.068,
  loanTermYears: 30,
  insuranceMonthly: 150,
  maxCashNeeded: 40_000,
  hoaPenaltyThreshold: 300,
  aduKeywords: [
    "adu",
    "guest house",
    "mother-in-law",
    "in-law",
    "in-law suite",
    "garage conversion",
    "detached unit",
    "second unit",
    "granny flat",
    "casita",
    "accessory unit",
  ],
  potentialAduKeywords: [
    "adu potential",
    "potential adu",
    "adu-ready",
    "adu ready",
    "potential only",
    "conversion potential",
  ],
  markets: [
    {
      tier: "SCV" as const,
      name: "Santa Clarita Valley",
      zips: ["91321", "91351"],
      taxRate: 0.0125,
    },
    {
      tier: "IE" as const,
      name: "Inland Empire",
      zips: ["92335", "92336", "92376", "91762", "91764", "91730", "91739"],
      taxRate: 0.011,
    },
  ],
} as const;

export type MarketTier = "SCV" | "IE";

export function marketForZip(zip: string) {
  const normalized = zip.slice(0, 5);
  return (
    DEAL_SCANNER_CRITERIA.markets.find((m) =>
      (m.zips as readonly string[]).includes(normalized)
    ) ?? null
  );
}
