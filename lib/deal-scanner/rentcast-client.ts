import { DEAL_SCANNER_CRITERIA } from "./criteria";

const BASE_URL = "https://api.rentcast.io/v1";

export interface RentCastSaleListing {
  id: string;
  formattedAddress?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType?: string;
  status?: string;
  listedDate?: string;
  removedDate?: string | null;
  lastSeenDate?: string;
  daysOnMarket?: number;
  latitude?: number;
  longitude?: number;
  hoa?: { fee?: number } | number | null;
  remarks?: string;
  description?: string;
  listingUrl?: string;
  url?: string;
}

export interface RentCastComparable {
  id?: string;
  formattedAddress?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  propertyType?: string;
  status?: string;
  listedDate?: string;
  distance?: number;
  correlation?: number;
}

export interface RentCastRentEstimate {
  rent?: number;
  rentRangeLow?: number;
  rentRangeHigh?: number;
  comparables?: RentCastComparable[];
}

export interface RentCastPropertyRecord {
  id?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: number;
  features?: {
    unitCount?: number;
    roomCount?: number;
    floorCount?: number;
    architectureType?: string;
  };
}

export interface RentCastCompSummary {
  count: number;
  maxDistanceMiles: number;
  oldestMonths: number;
  comps: Array<{ address: string; rent: number; distanceMiles: number | null; listedDate: string | null }>;
}

function monthsSince(dateStr: string | null | undefined): number {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 999;
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
}

function milesFromMeters(meters: number | undefined): number | null {
  if (meters == null) return null;
  // RentCast distance may be miles or meters — treat values > 50 as meters
  if (meters > 50) return meters / 1609.34;
  return meters;
}

export class RentCastClient {
  private apiKey: string;
  callCount = 0;
  lastError: string | null = null;
  authFailures = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(path: string, params: Record<string, string | number>): Promise<T | null> {
    const url = new URL(`${BASE_URL}${path}`);
    for (const [k, v] of Object.entries(params)) {
      if (v !== "" && v != null) url.searchParams.set(k, String(v));
    }

    this.callCount++;

    const res = await fetch(url.toString(), {
      headers: { "X-Api-Key": this.apiKey, Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) this.authFailures++;
      this.lastError = `RentCast ${path} returned ${res.status}`;
      return null;
    }
    this.lastError = null;
    return (await res.json()) as T;
  }

  /** Search active for-sale SFR listings in a zip within price range. */
  async searchSaleListings(zip: string): Promise<RentCastSaleListing[]> {
    const data = await this.request<RentCastSaleListing[] | { listings?: RentCastSaleListing[] }>(
      "/listings/sale",
      {
        zipCode: zip,
        propertyType: "Single Family",
        status: "Active",
        price: `${DEAL_SCANNER_CRITERIA.minPrice}:${DEAL_SCANNER_CRITERIA.maxPrice}`,
        limit: 50,
      }
    );

    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.listings ?? [];
  }

  /** Property record for unit count, structures, and sqft signals. */
  async getPropertyRecord(address: string): Promise<RentCastPropertyRecord | null> {
    const data = await this.request<
      RentCastPropertyRecord[] | RentCastPropertyRecord
    >("/properties", { address });

    if (!data) return null;
    if (Array.isArray(data)) return data[0] ?? null;
    return data;
  }

  /** Rent AVM + comparable rentals for an address (ADU-sized unit params). */
  async getRentEstimate(opts: {
    address: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    propertyType?: string;
  }): Promise<RentCastRentEstimate | null> {
    return this.request<RentCastRentEstimate>("/avm/rent/long-term", {
      address: opts.address,
      propertyType: opts.propertyType ?? "Single Family",
      bedrooms: opts.bedrooms ?? 1,
      bathrooms: opts.bathrooms ?? 1,
      squareFootage: opts.squareFootage ?? 600,
      maxRadius: 3,
      daysOld: 180,
      compCount: 20,
    });
  }

  summarizeComps(comparables: RentCastComparable[] | undefined): RentCastCompSummary {
    const comps = (comparables ?? []).map((c) => {
      const address =
        c.formattedAddress ??
        [c.addressLine1, c.city, c.state, c.zipCode].filter(Boolean).join(", ");
      const distanceMiles = milesFromMeters(c.distance);
      return {
        address: address || "Unknown",
        rent: c.price ?? 0,
        distanceMiles,
        listedDate: c.listedDate ?? null,
      };
    });

    const within6mo = comps.filter((c) => monthsSince(c.listedDate) <= 6);
    const distances = within6mo
      .map((c) => c.distanceMiles)
      .filter((d): d is number => d != null);

    return {
      count: within6mo.length,
      maxDistanceMiles: distances.length ? Math.max(...distances) : 999,
      oldestMonths: within6mo.length
        ? Math.max(...within6mo.map((c) => monthsSince(c.listedDate)))
        : 999,
      comps: comps.slice(0, 5),
    };
  }
}

export function createRentCastClient(): RentCastClient | null {
  const key = process.env.RENTCAST_API_KEY;
  if (!key) return null;
  return new RentCastClient(key);
}
