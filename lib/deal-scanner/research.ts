import { DEAL_SCANNER_CRITERIA, marketForZip } from "./criteria";
import {
  buildDealDataSources,
  computeConfidenceLevel,
} from "./confidence";
import type { RentCastClient, RentCastPropertyRecord } from "./rentcast-client";
import { isMockScanMode } from "./search";
import type { ListingResearch, ScannerListing } from "./types";

const ZIP_RENT_2BR: Record<string, number> = {
  "91321": 2400,
  "91351": 2350,
  "92335": 2100,
  "92336": 2150,
  "92376": 2000,
  "91762": 2200,
  "91764": 2250,
  "91730": 2300,
  "91739": 2450,
};

const EXISTING_ADU_KEYWORDS = [
  "guest house",
  "in-law",
  "mother-in-law",
  "detached unit",
  "second unit",
  "casita",
  "granny flat",
  "accessory unit",
  "existing adu",
  "permitted adu",
];

function estimateAduRentFallback(zip: string, sqft: number): number {
  const market = zip.slice(0, 5);
  const isScv = market === "91321" || market === "91351";
  const minRent = isScv ? 1800 : 1400;
  const maxRent = isScv ? 2200 : 1800;

  if (sqft >= 700) return maxRent;
  if (sqft >= 550) return Math.round((minRent + maxRent) / 2);
  if (sqft >= 450) return minRent + 100;
  return minRent;
}

function parseHoa(description: string): number {
  const match = description.match(/\$?\s*([\d,]+)\s*(?:\/\s*mo(?:nth)?)?\s*hoa/i);
  if (!match) return 0;
  return Number(match[1].replace(/,/g, ""));
}

function fullAddress(listing: ScannerListing): string {
  return `${listing.address}, ${listing.city}, ${listing.state}, ${listing.zip}`;
}

function detectAduFromDescription(description: string): {
  aduSignal: boolean;
  aduExists: boolean;
  aduPotentialOnly: boolean;
} {
  const desc = description.toLowerCase();
  const hasKeyword = DEAL_SCANNER_CRITERIA.aduKeywords.some((k) =>
    desc.includes(k.toLowerCase())
  );
  const aduPotentialOnly =
    !hasKeyword &&
    DEAL_SCANNER_CRITERIA.potentialAduKeywords.some((k) =>
      desc.includes(k.toLowerCase())
    );

  const existingFromDesc =
    hasKeyword &&
    !DEAL_SCANNER_CRITERIA.potentialAduKeywords.some((k) =>
      desc.includes(k.toLowerCase())
    ) &&
    (desc.includes("existing") ||
      desc.includes("permitted") ||
      EXISTING_ADU_KEYWORDS.some((k) => desc.includes(k)));

  const aduSignal = hasKeyword || aduPotentialOnly;

  return {
    aduSignal,
    aduExists: existingFromDesc,
    aduPotentialOnly:
      aduPotentialOnly ||
      (hasKeyword &&
        DEAL_SCANNER_CRITERIA.potentialAduKeywords.some((k) =>
          desc.includes(k.toLowerCase())
        ) &&
        !existingFromDesc),
  };
}

function detectAduFromPropertyRecord(record: RentCastPropertyRecord): {
  aduSignal: boolean;
  aduExists: boolean;
} {
  const unitCount = record.features?.unitCount;
  if (unitCount != null && unitCount > 1) {
    return { aduSignal: true, aduExists: true };
  }

  const architecture = (record.features?.architectureType ?? "").toLowerCase();
  if (
    architecture.includes("duplex") ||
    architecture.includes("multi") ||
    architecture.includes("2-unit")
  ) {
    return { aduSignal: true, aduExists: true };
  }

  return { aduSignal: false, aduExists: false };
}

function mergeAduDetection(
  fromDesc: ReturnType<typeof detectAduFromDescription>,
  fromRecord: ReturnType<typeof detectAduFromPropertyRecord>
): { aduSignal: boolean; aduExists: boolean; aduPotentialOnly: boolean } {
  const aduExists = fromDesc.aduExists || fromRecord.aduExists;
  const aduSignal = fromDesc.aduSignal || fromRecord.aduSignal;
  const aduPotentialOnly = fromDesc.aduPotentialOnly && !aduExists;

  return { aduSignal, aduExists, aduPotentialOnly };
}

export async function researchListing(
  listing: ScannerListing,
  rentcast?: RentCastClient | null
): Promise<ListingResearch | null> {
  const market = marketForZip(listing.zip);
  if (!market) return null;

  const mockMode = isMockScanMode();
  const fromDesc = detectAduFromDescription(listing.description);

  let fromRecord = { aduSignal: false, aduExists: false };
  if (!mockMode && rentcast) {
    const record = await rentcast.getPropertyRecord(fullAddress(listing));
    if (record) {
      fromRecord = detectAduFromPropertyRecord(record);
      if (record.squareFootage && record.squareFootage < listing.sqft * 0.6) {
        listing = { ...listing, aduSqft: record.squareFootage };
      }
    }
  }

  const { aduSignal, aduExists, aduPotentialOnly } = mergeAduDetection(
    fromDesc,
    fromRecord
  );

  const aduSqft = listing.aduSqft ?? Math.round(listing.sqft * 0.35);
  let aduRentEstimate = 0;
  let rentSource = mockMode
    ? "No ADU signal — room rent only (mock mode)"
    : "No ADU signal — room rent only";
  let compMeta = null;
  let compSummary: string | undefined;
  let rentcastConfidence: string | undefined;
  let listingSource: string | undefined;

  if (aduSignal) {
    aduRentEstimate = estimateAduRentFallback(listing.zip, aduSqft);
    rentSource = mockMode
      ? "Market Average — no comps found (mock mode)"
      : "RentCast AVM — no comps returned";

    if (!mockMode && rentcast) {
      const avm = await rentcast.getRentEstimate({
        address: fullAddress(listing),
        bedrooms: 1,
        bathrooms: 1,
        squareFootage: aduSqft,
        propertyType: "Single Family",
      });

      if (avm?.rent) {
        aduRentEstimate = Math.round(avm.rent);
        rentSource = "RentCast AVM";
        if (avm.rentRangeLow && avm.rentRangeHigh) {
          rentcastConfidence = `$${avm.rentRangeLow}–$${avm.rentRangeHigh}/mo range`;
        }
      }

      const summary = rentcast.summarizeComps(avm?.comparables);
      compMeta = {
        count: summary.count,
        maxDistanceMiles: summary.maxDistanceMiles,
        oldestMonths: summary.oldestMonths,
      };

      if (summary.comps.length) {
        compSummary = summary.comps
          .map(
            (c) =>
              `${c.address}: $${c.rent}/mo${c.distanceMiles != null ? ` (${c.distanceMiles.toFixed(1)}mi)` : ""}`
          )
          .join("; ");
      } else {
        rentSource = "RentCast AVM — no comparable listings found";
      }

      listingSource = "RentCast Property Listings API";
    }
  }

  const zip2br = ZIP_RENT_2BR[listing.zip.slice(0, 5)] ?? 2000;
  const roomRentEstimate = aduExists
    ? Math.round(zip2br * 0.75)
    : Math.round(zip2br * 0.15);

  const annualTax = listing.price * market.taxRate;
  const hoaMonthly = listing.hoaMonthly ?? parseHoa(listing.description);

  const confidenceLevel = computeConfidenceLevel(compMeta, mockMode);
  const dataSources = buildDealDataSources(listing, {
    mockMode,
    marketName: market.name,
    taxRate: market.taxRate,
    rentSource,
    rentcastConfidence,
    compSummary,
    listingSource,
  });

  return {
    aduSignal,
    aduExists,
    aduPotentialOnly,
    aduRentEstimate,
    roomRentEstimate,
    hoaMonthly,
    taxMonthly: annualTax / 12,
    insuranceMonthly: DEAL_SCANNER_CRITERIA.insuranceMonthly,
    market: market.tier,
    confidenceLevel,
    dataSources,
  };
}
