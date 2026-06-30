import { DEAL_SCANNER_CRITERIA, marketForZip } from "@/lib/deal-scanner/criteria";
import { detectHoaFromNotes } from "./calculations";
import type { DealForUnderwriting } from "./types";
import type { Property } from "@/lib/types/database";
import type { HouseHackInputs } from "@/lib/financial-calculations";
import { getOperatingExpenseRatio } from "@/lib/financial-calculations";

export interface ResolvedHouseHackInputs extends HouseHackInputs {
  usedEstimatedSplit: boolean;
  splitNote: string | null;
}

function parseHoaFromNotes(notes?: string | null): number {
  if (!notes) return 0;
  const match = notes.match(/\$?\s*([\d,]+)\s*(?:\/\s*mo(?:nth)?)?\s*hoa/i);
  if (!match) return 0;
  return Number(match[1].replace(/,/g, "")) || 0;
}

function zipFromDeal(deal: DealForUnderwriting): string {
  const notesZip = deal.notes?.match(/\b(\d{5})\b/);
  if (notesZip) return notesZip[1];
  return "";
}

function deriveTaxInsuranceHoa(
  purchasePrice: number,
  deal: DealForUnderwriting,
  property?: Property | null
): number {
  if (property?.monthly_taxes_insurance_hoa != null) {
    return property.monthly_taxes_insurance_hoa;
  }

  const zip = property?.zip ?? zipFromDeal(deal);
  const market = zip ? marketForZip(zip) : null;
  const taxRate = market?.taxRate ?? DEAL_SCANNER_CRITERIA.markets[1].taxRate;
  const taxMonthly = (purchasePrice * taxRate) / 12;
  const insuranceMonthly = DEAL_SCANNER_CRITERIA.insuranceMonthly;
  const hoaMonthly =
    parseHoaFromNotes(deal.notes) ||
    (detectHoaFromNotes(deal.notes) ? 150 : 0);

  return taxMonthly + insuranceMonthly + hoaMonthly;
}

export function resolveHouseHackInputs(
  deal: DealForUnderwriting,
  property?: Property | null
): ResolvedHouseHackInputs {
  const purchasePrice = deal.list_price ?? property?.list_price ?? 0;
  const propertyType = property?.type ?? deal.property_type ?? "sfr";

  let aduMonthlyRent =
    property?.adu_monthly_rent ??
    deal.adu_rent_estimate ??
    null;
  let ownerUnitMarketRent = property?.owner_unit_market_rent ?? null;
  let usedEstimatedSplit = false;
  let splitNote: string | null = null;

  const totalRent =
    deal.monthly_rental_income ??
    property?.monthly_rent ??
    null;

  if (aduMonthlyRent != null && ownerUnitMarketRent == null && totalRent != null) {
    ownerUnitMarketRent = Math.max(0, totalRent - aduMonthlyRent);
  }

  if (ownerUnitMarketRent != null && aduMonthlyRent == null && totalRent != null) {
    aduMonthlyRent = Math.max(0, totalRent - ownerUnitMarketRent);
  }

  if (aduMonthlyRent == null || ownerUnitMarketRent == null) {
    const total =
      totalRent ??
      (aduMonthlyRent != null && ownerUnitMarketRent != null
        ? aduMonthlyRent + ownerUnitMarketRent
        : 0);

    if (total > 0) {
      aduMonthlyRent = aduMonthlyRent ?? total * 0.4;
      ownerUnitMarketRent = ownerUnitMarketRent ?? total * 0.6;
      usedEstimatedSplit = true;
      splitNote = "estimated split — verify actual unit rents";
    } else {
      aduMonthlyRent = aduMonthlyRent ?? 0;
      ownerUnitMarketRent = ownerUnitMarketRent ?? 0;
    }
  }

  return {
    purchasePrice,
    aduMonthlyRent: aduMonthlyRent ?? 0,
    ownerUnitMarketRent: ownerUnitMarketRent ?? 0,
    monthlyTaxesInsuranceHoa: deriveTaxInsuranceHoa(purchasePrice, deal, property),
    operatingExpenseRatio: getOperatingExpenseRatio(propertyType),
    usedEstimatedSplit,
    splitNote,
  };
}

export function buildDeterministicSummary(
  address: string,
  analysis: ReturnType<
    typeof import("@/lib/financial-calculations").calculateHouseHackAnalysis
  >
): string {
  const { phase1, phase2, dealScore, recommendation } = analysis;
  const savings = phase1.monthlySavingsVsRenting;
  const savingsStr =
    savings >= 0
      ? `$${Math.round(savings).toLocaleString()}/mo saved vs market rent`
      : `$${Math.abs(Math.round(savings)).toLocaleString()}/mo above market rent`;

  return (
    `${address}: ${recommendation} (score ${dealScore}/100). ` +
    `Phase 1 — effective housing cost $${Math.round(phase1.effectiveHousingCost).toLocaleString()}/mo, ADU covers ${(phase1.aduRentCoverage * 100).toFixed(0)}% of PITI, ${savingsStr}. ` +
    `Phase 2 — cap rate ${(phase2.capRate * 100).toFixed(1)}%, CoC ${(phase2.cashOnCashReturn * 100).toFixed(1)}% once fully rented.`
  );
}
