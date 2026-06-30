import { DEAL_SCANNER_CRITERIA } from "./criteria";
import type { ScannerListing } from "./types";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export interface RentCompMeta {
  count: number;
  maxDistanceMiles: number;
  oldestMonths: number;
}

export interface DataSourceEntry {
  source: string;
  date: string;
  note?: string;
}

export interface DealDataSources {
  rent_estimate: DataSourceEntry;
  property_tax: DataSourceEntry;
  insurance: DataSourceEntry;
  interest_rate: DataSourceEntry;
  listing_source?: DataSourceEntry;
  comps_used?: DataSourceEntry;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Confidence requires real comp data — never assume High without comps. */
export function computeConfidenceLevel(
  comps: RentCompMeta | null,
  mockMode: boolean
): ConfidenceLevel {
  if (mockMode || !comps || comps.count === 0) return "Low";

  const { count, maxDistanceMiles, oldestMonths } = comps;
  const high =
    count >= 3 && maxDistanceMiles <= 1 && oldestMonths <= 6;
  if (high) return "High";

  const medium =
    (count >= 1 && count <= 2) ||
    (maxDistanceMiles > 1 && maxDistanceMiles <= 3) ||
    oldestMonths > 6;
  if (medium) return "Medium";

  return "Low";
}

export function buildDealDataSources(
  listing: ScannerListing,
  opts: {
    mockMode: boolean;
    marketName: string;
    taxRate: number;
    rentSource: string;
    rentcastConfidence?: string;
    compSummary?: string;
    listingSource?: string;
  }
): DealDataSources {
  const date = todayIso();
  const ratePct = (DEAL_SCANNER_CRITERIA.fhaRateAnnual * 100).toFixed(1);

  const sources: DealDataSources = {
    rent_estimate: {
      source: opts.rentSource,
      date,
      note: opts.rentcastConfidence
        ? `RentCast AVM confidence: ${opts.rentcastConfidence}`
        : opts.mockMode
          ? "Mock listing — no live comp search performed"
          : undefined,
    },
    property_tax: {
      source: `${opts.marketName} assessor rate (${(opts.taxRate * 100).toFixed(2)}% annual)`,
      date,
    },
    insurance: {
      source: "Default estimate — not a quote",
      date,
      note: `$${DEAL_SCANNER_CRITERIA.insuranceMonthly}/mo placeholder until carrier quote`,
    },
    interest_rate: {
      source: `FHA 30yr fixed at ${ratePct}% — Freddie Mac PMMS benchmark`,
      date,
      note: `Applied to ${listing.address}`,
    },
  };

  if (opts.listingSource) {
    sources.listing_source = { source: opts.listingSource, date };
  }
  if (opts.compSummary) {
    sources.comps_used = { source: "RentCast comparable rentals", date, note: opts.compSummary };
  }

  return sources;
}
