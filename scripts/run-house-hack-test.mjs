/**
 * House-hack underwriter test — runs calculateHouseHackAnalysis on 5 mock qualified deals.
 * Usage: node --import tsx scripts/run-house-hack-test.mjs
 */
import { MOCK_LISTINGS } from "../lib/deal-scanner/mock-listings.ts";
import { researchListing } from "../lib/deal-scanner/research.ts";
import { underwriteDeal } from "../lib/deal-scanner/underwrite.ts";
import { scoreDeal } from "../lib/deal-scanner/score.ts";
import { calculateHouseHackAnalysis } from "../lib/financial-calculations.ts";
import { resolveHouseHackInputs } from "../lib/underwriter/house-hack-inputs.ts";
import { analyzeDeal } from "../lib/underwriter/analyze.ts";

const qualifiedAddresses = new Set([
  "24512 Main St",
  "27101 Sand Canyon Rd",
  "15420 Sierra Lakes Pkwy",
  "1847 N Linden Ave",
  "15222 Summit Ave",
]);

console.log("=== House-Hack Underwriter Test (5 mock qualified deals) ===\n");
console.log(
  "| Address | Price | Scanner Score | House-Hack Score | Rec (old stress) | Rec (new) |"
);
console.log("| --- | --- | --- | --- | --- | --- |");

const results = [];

for (const listing of MOCK_LISTINGS) {
  if (!qualifiedAddresses.has(listing.address)) continue;

  const research = await researchListing(listing);
  if (!research) continue;

  const underwriting = underwriteDeal(listing, research);
  const scannerScore = scoreDeal(listing, research, underwriting);

  const deal = {
    id: listing.zpid,
    address: listing.address,
    list_price: listing.price,
    city: listing.city,
    property_type: "sfr",
    adu_rent_estimate: research.aduRentEstimate,
    monthly_rental_income: underwriting.monthlyRentalIncome,
    monthly_mortgage: underwriting.monthlyMortgagePiti,
    mortgage_estimate: underwriting.monthlyMortgagePiti,
    monthly_cash_flow: underwriting.monthlyCashFlow,
    rent_coverage_ratio: underwriting.rentCoverageRatio,
    total_cash_needed: underwriting.totalCashNeeded,
    confidence_level: research.confidenceLevel,
    market: research.market,
    notes: listing.description,
    ai_score: scannerScore,
    status: "new",
  };

  const inputs = resolveHouseHackInputs(deal);
  const houseHack = calculateHouseHackAnalysis(inputs);
  const stress = analyzeDeal(deal);

  results.push({
    address: listing.address,
    price: listing.price,
    scannerScore,
    houseHackScore: houseHack.dealScore,
    oldRec: stress.recommendation,
    newRec: houseHack.recommendation,
    phase1Coverage: (houseHack.phase1.aduRentCoverage * 100).toFixed(0),
    phase2Cap: (houseHack.phase2.capRate * 100).toFixed(1),
    phase2Coc: (houseHack.phase2.cashOnCashReturn * 100).toFixed(1),
  });

  console.log(
    `| ${listing.address} | $${(listing.price / 1000).toFixed(0)}K | ${scannerScore} | ${houseHack.dealScore} | ${stress.recommendation} | ${houseHack.recommendation} |`
  );
}

console.log("\n=== Detail ===");
for (const r of results) {
  console.log(
    `${r.address}: scanner ${r.scannerScore} → house-hack ${r.houseHackScore} (${r.oldRec} → ${r.newRec}) | ADU coverage ${r.phase1Coverage}% | Phase 2 cap ${r.phase2Cap}% CoC ${r.phase2Coc}%`
  );
}
