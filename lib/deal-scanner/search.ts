import { DEAL_SCANNER_CRITERIA } from "./criteria";
import { MOCK_LISTINGS } from "./mock-listings";
import {
  createRentCastClient,
  type RentCastClient,
  type RentCastSaleListing,
} from "./rentcast-client";
import type { ScannerListing } from "./types";

function listingDescription(raw: RentCastSaleListing): string {
  return [raw.remarks, raw.description].filter(Boolean).join(" ");
}

function parseHoa(raw: RentCastSaleListing): number | undefined {
  if (raw.hoa == null) return undefined;
  if (typeof raw.hoa === "number") return raw.hoa;
  return raw.hoa.fee ?? undefined;
}

function toScannerListing(raw: RentCastSaleListing, zip: string): ScannerListing | null {
  const price = raw.price;
  if (!price) return null;

  const address =
    raw.formattedAddress ?? raw.addressLine1 ?? "Unknown";
  const state = raw.state ?? "CA";
  const city = raw.city ?? "";
  const zipCode = (raw.zipCode ?? zip).slice(0, 5);

  return {
    zpid: String(raw.id),
    address,
    city,
    state,
    zip: zipCode,
    price,
    bedrooms: raw.bedrooms ?? 0,
    bathrooms: raw.bathrooms ?? 0,
    sqft: raw.squareFootage ?? 0,
    lotSize: raw.lotSize,
    yearBuilt: raw.yearBuilt,
    propertyType: raw.propertyType ?? "sfr",
    description: listingDescription(raw),
    url: raw.listingUrl ?? raw.url ?? "",
    hoaMonthly: parseHoa(raw),
    images: [],
  };
}

function isSingleFamily(propertyType: string | undefined): boolean {
  if (!propertyType) return true;
  const normalized = propertyType.toLowerCase();
  return (
    normalized.includes("single family") ||
    normalized === "sfr" ||
    normalized === "single-family"
  );
}

function matchesCriteria(listing: ScannerListing): boolean {
  const zip = listing.zip.slice(0, 5);
  const inMarket = DEAL_SCANNER_CRITERIA.markets.some((m) =>
    (m.zips as readonly string[]).includes(zip)
  );
  if (!inMarket) return false;
  if (
    listing.price < DEAL_SCANNER_CRITERIA.minPrice ||
    listing.price > DEAL_SCANNER_CRITERIA.maxPrice
  ) {
    return false;
  }
  return isSingleFamily(listing.propertyType);
}

/** Mock when DEAL_SCANNER_USE_MOCK=true or no RENTCAST_API_KEY. */
export function isMockScanMode(): boolean {
  if (process.env.DEAL_SCANNER_USE_MOCK === "true") return true;
  return !process.env.RENTCAST_API_KEY;
}

export function isLiveRentCastMode(): boolean {
  return !isMockScanMode() && !!process.env.RENTCAST_API_KEY;
}

export async function searchListings(
  rentcast?: RentCastClient | null
): Promise<ScannerListing[]> {
  if (isMockScanMode()) {
    return MOCK_LISTINGS;
  }

  const client = rentcast ?? createRentCastClient();
  if (!client) {
    return MOCK_LISTINGS;
  }

  const listings: ScannerListing[] = [];
  const zips = DEAL_SCANNER_CRITERIA.markets.flatMap((m) => m.zips);

  for (const zip of zips) {
    try {
      const results = await client.searchSaleListings(zip);
      for (const raw of results) {
        const listing = toScannerListing(raw, zip);
        if (listing && matchesCriteria(listing)) {
          listings.push(listing);
        }
      }
    } catch {
      // continue to next zip
    }
  }

  const seen = new Set<string>();
  const deduped = listings.filter((l) => {
    if (seen.has(l.zpid)) return false;
    seen.add(l.zpid);
    return true;
  });

  return deduped;
}

export function getRentCastClientForScan(): RentCastClient | null {
  if (isMockScanMode()) return null;
  return createRentCastClient();
}
