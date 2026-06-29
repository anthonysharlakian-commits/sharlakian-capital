import type { ZillowListing } from "@/lib/types/database";
import { DEFAULT_ACQUISITION_CRITERIA } from "@/lib/acquisition-criteria";

const MOCK_LISTINGS: ZillowListing[] = [
  {
    zpid: "mock-001",
    address: "14203 Desert Willow Dr",
    city: "Victorville",
    state: "CA",
    zip: "92392",
    price: 389000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1650,
    yearBuilt: 2004,
    propertyType: "sfr",
    zestimate: 395000,
    rentZestimate: 2400,
    images: ["https://photos.zillowstatic.com/fp/placeholder.jpg"],
    url: "https://zillow.com/homedetails/mock-001",
    description: "Well-maintained SFR in established neighborhood. Updated kitchen, dual pane windows.",
  },
  {
    zpid: "mock-002",
    address: "2847 E Highland Ave",
    city: "San Bernardino",
    state: "CA",
    zip: "92404",
    price: 325000,
    bedrooms: 4,
    bathrooms: 2,
    sqft: 1820,
    yearBuilt: 1987,
    propertyType: "sfr",
    zestimate: 330000,
    rentZestimate: 2200,
    images: ["https://photos.zillowstatic.com/fp/placeholder.jpg"],
    url: "https://zillow.com/homedetails/mock-002",
    description: "Four bedroom with large lot. Needs cosmetic updates. Strong rental demand area.",
  },
  {
    zpid: "mock-003",
    address: "4512 Copper Hill Rd",
    city: "Apple Valley",
    state: "CA",
    zip: "92307",
    price: 279000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1480,
    yearBuilt: 1999,
    propertyType: "sfr",
    zestimate: 285000,
    rentZestimate: 1950,
    images: ["https://photos.zillowstatic.com/fp/placeholder.jpg"],
    url: "https://zillow.com/homedetails/mock-003",
    description: "Move-in ready. New roof 2022. Fenced backyard.",
  },
  {
    zpid: "mock-004",
    address: "891 W Foothill Blvd",
    city: "Rialto",
    state: "CA",
    zip: "92376",
    price: 445000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2100,
    yearBuilt: 2008,
    propertyType: "duplex",
    zestimate: 460000,
    rentZestimate: 3200,
    images: ["https://photos.zillowstatic.com/fp/placeholder.jpg"],
    url: "https://zillow.com/homedetails/mock-004",
    description: "Duplex with separate meters. Both units currently rented below market.",
  },
  {
    zpid: "mock-005",
    address: "22015 Soledad Canyon Rd",
    city: "Santa Clarita",
    state: "CA",
    zip: "91350",
    price: 525000,
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 1750,
    yearBuilt: 2012,
    propertyType: "sfr",
    zestimate: 540000,
    rentZestimate: 3100,
    images: ["https://photos.zillowstatic.com/fp/placeholder.jpg"],
    url: "https://zillow.com/homedetails/mock-005",
    description: "Modern build in SCV. HOA community. Strong appreciation market.",
  },
];

export async function fetchZillowListings(
  criteria = DEFAULT_ACQUISITION_CRITERIA
): Promise<ZillowListing[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  const host = process.env.ZILLOW_API_HOST ?? "zillow-com1.p.rapidapi.com";

  if (!apiKey) {
    return MOCK_LISTINGS.filter((l) => {
      const inMarket = criteria.markets.some((m) =>
        m.cities.some((c) => l.city.toLowerCase().includes(c.toLowerCase()))
      );
      return (
        inMarket &&
        l.price >= criteria.min_price &&
        l.price <= criteria.max_price
      );
    });
  }

  try {
    const allCities = criteria.markets.flatMap((m) => m.cities);
    const listings: ZillowListing[] = [];

    for (const city of allCities.slice(0, 3)) {
      const res = await fetch(
        `https://${host}/propertyExtendedSearch?location=${encodeURIComponent(city + ", CA")}&status_type=ForSale&home_type=Houses`,
        {
          headers: {
            "X-RapidAPI-Key": apiKey,
            "X-RapidAPI-Host": host,
          },
        }
      );

      if (!res.ok) continue;
      const data = await res.json();
      const props = data.props ?? data.results ?? [];

      for (const p of props) {
        const price = p.price ?? p.unformattedPrice;
        if (price < criteria.min_price || price > criteria.max_price) continue;

        listings.push({
          zpid: String(p.zpid ?? p.id),
          address: p.address ?? p.streetAddress,
          city: p.addressCity ?? city,
          state: p.addressState ?? "CA",
          zip: p.addressZipcode ?? "",
          price,
          bedrooms: p.bedrooms ?? 0,
          bathrooms: p.bathrooms ?? 0,
          sqft: p.livingArea ?? p.area ?? 0,
          yearBuilt: p.yearBuilt,
          propertyType: p.propertyType ?? "sfr",
          zestimate: p.zestimate,
          rentZestimate: p.rentZestimate,
          images: p.imgSrc ? [p.imgSrc] : [],
          url: p.detailUrl ?? `https://zillow.com/homedetails/${p.zpid}`,
          description: p.description,
        });
      }
    }

    return listings.length > 0 ? listings : MOCK_LISTINGS;
  } catch {
    return MOCK_LISTINGS;
  }
}

export function runQuickScore(listing: ZillowListing): number {
  let score = 50;

  if (listing.rentZestimate && listing.price) {
    const grossYield = (listing.rentZestimate * 12) / listing.price;
    if (grossYield >= 0.08) score += 20;
    else if (grossYield >= 0.06) score += 12;
    else if (grossYield >= 0.05) score += 6;
  }

  if (listing.price <= 350000) score += 8;
  else if (listing.price <= 450000) score += 4;

  if (listing.yearBuilt && listing.yearBuilt >= 2000) score += 6;
  else if (listing.yearBuilt && listing.yearBuilt >= 1990) score += 3;

  if (listing.sqft >= 1400) score += 4;

  return Math.min(100, Math.max(0, score));
}
