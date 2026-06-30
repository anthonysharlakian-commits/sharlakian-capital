import { DEAL_SCANNER_CRITERIA } from "./criteria";
import type { ListingResearch, ScannerListing, UnderwritingResult } from "./types";

/** Rent coverage gradient — 80%+ coverage can reach qualification with other criteria. */
export function coverageScorePoints(rentCoverageRatio: number): number {
  const pct = rentCoverageRatio * 100;
  if (pct >= 100) return 30;
  if (pct >= 90) return 25;
  if (pct >= 80) return 18;
  if (pct >= 65) return 8;
  return 0;
}

export function scoreDeal(
  listing: ScannerListing,
  research: ListingResearch,
  underwriting: UnderwritingResult
): number {
  let score = 0;

  score += coverageScorePoints(underwriting.rentCoverageRatio);
  if (research.aduExists) {
    score += 25;
  } else if (research.aduPotentialOnly) {
    score += 8;
  }
  if (underwriting.totalCashNeeded <= DEAL_SCANNER_CRITERIA.maxCashNeeded) {
    score += 20;
  }
  if (underwriting.cocReturn > 0) score += 10;
  score += research.market === "SCV" ? 10 : 8;

  if (research.hoaMonthly > DEAL_SCANNER_CRITERIA.hoaPenaltyThreshold) {
    score -= 15;
  }
  if (!research.aduSignal) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

export function passesMinScore(score: number): boolean {
  return score >= DEAL_SCANNER_CRITERIA.minDealScore;
}
