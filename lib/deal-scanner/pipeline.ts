import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { DEAL_SCANNER_CRITERIA } from "./criteria";
import { MOCK_TEST_NOTES } from "./mock-listings";
import { researchListing } from "./research";
import { scoreDeal, passesMinScore } from "./score";
import { isMockScanMode, searchListings, getRentCastClientForScan } from "./search";
import type { ListingScanResult, ScanSummary, ScoredDeal } from "./types";
import { underwriteDeal } from "./underwrite";

function priceInRange(price: number): boolean {
  return (
    price >= DEAL_SCANNER_CRITERIA.minPrice &&
    price <= DEAL_SCANNER_CRITERIA.maxPrice
  );
}

function buildScanResult(
  listing: { zpid: string; address: string; city: string; zip: string; price: number },
  opts: Partial<ListingScanResult> & { qualified: boolean }
): ListingScanResult {
  return {
    zpid: listing.zpid,
    address: listing.address,
    city: listing.city,
    zip: listing.zip,
    price: listing.price,
    market: opts.market ?? null,
    qualified: opts.qualified,
    disqualifiedReason: opts.disqualifiedReason ?? null,
    dealScore: opts.dealScore ?? null,
    downPayment: opts.downPayment ?? null,
    closingCosts: opts.closingCosts ?? null,
    totalCashNeeded: opts.totalCashNeeded ?? null,
    monthlyPiti: opts.monthlyPiti ?? null,
    monthlyRentalIncome: opts.monthlyRentalIncome ?? null,
    monthlyCashFlow: opts.monthlyCashFlow ?? null,
    cocReturn: opts.cocReturn ?? null,
    rentCoverageRatio: opts.rentCoverageRatio ?? null,
    aduExists: opts.aduExists ?? null,
    confidenceLevel: opts.confidenceLevel ?? null,
    inserted: opts.inserted ?? false,
  };
}

export async function runDealScannerPipeline(): Promise<{
  summary: ScanSummary;
  qualifiedDeals: ScoredDeal[];
  scanResults: ListingScanResult[];
  insertErrors: string[];
}> {
  const rentcast = getRentCastClientForScan();
  const listings = await searchListings(rentcast);
  const qualifiedDeals: ScoredDeal[] = [];
  const scanResults: ListingScanResult[] = [];
  const mockMode = isMockScanMode();

  for (const listing of listings) {
    if (!priceInRange(listing.price)) {
      scanResults.push(
        buildScanResult(listing, {
          qualified: false,
          disqualifiedReason: `Price $${listing.price.toLocaleString()} exceeds max $${DEAL_SCANNER_CRITERIA.maxPrice.toLocaleString()}`,
        })
      );
      continue;
    }

    const research = await researchListing(listing, rentcast);
    if (!research) {
      scanResults.push(
        buildScanResult(listing, {
          qualified: false,
          disqualifiedReason: "Outside target market zips",
        })
      );
      continue;
    }

    const underwriting = underwriteDeal(listing, research);
    const dealScore = scoreDeal(listing, research, underwriting);
    const qualified = passesMinScore(dealScore);

    scanResults.push(
      buildScanResult(listing, {
        market: research.market,
        qualified,
        disqualifiedReason: qualified
          ? null
          : `Score ${dealScore} below minimum ${DEAL_SCANNER_CRITERIA.minDealScore}`,
        dealScore,
        downPayment: Math.round(underwriting.downPayment),
        closingCosts: Math.round(underwriting.closingCosts),
        totalCashNeeded: Math.round(underwriting.totalCashNeeded),
        monthlyPiti: Math.round(underwriting.monthlyMortgagePiti),
        monthlyRentalIncome: Math.round(underwriting.monthlyRentalIncome),
        monthlyCashFlow: Math.round(underwriting.monthlyCashFlow),
        cocReturn: Number(underwriting.cocReturn.toFixed(2)),
        rentCoverageRatio: Number(underwriting.rentCoverageRatio.toFixed(3)),
        aduExists: research.aduExists,
        confidenceLevel: research.confidenceLevel,
      })
    );

    if (!qualified) continue;

    qualifiedDeals.push({
      listing,
      research,
      underwriting,
      dealScore,
      confidenceLevel: research.confidenceLevel,
      dataSources: research.dataSources,
    });
  }

  let inserted = 0;
  const insertErrors: string[] = [];
  if (hasSupabaseConfig()) {
    const supabase = createAdminClient();

    if (mockMode) {
      const { error: deleteError } = await supabase
        .from("deals")
        .delete()
        .ilike("notes", "%MOCK TEST DATA%");
      if (deleteError) insertErrors.push(`Clear mock deals: ${deleteError.message}`);
    }

    for (const deal of qualifiedDeals) {
      const { listing, research, underwriting, dealScore, confidenceLevel, dataSources } =
        deal;
      const notes = mockMode
        ? MOCK_TEST_NOTES
        : `Auto-scanned ${listing.zip}. ADU ${research.aduExists ? "existing" : "potential"}.`;

      const fullRow = {
        address: listing.address,
        city: listing.city,
        market: research.market,
        property_type: "sfr",
        list_price: listing.price,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        sqft: listing.sqft,
        lot_size: listing.lotSize ?? null,
        adu_exists: research.aduExists,
        adu_rent_estimate: research.aduRentEstimate,
        mortgage_estimate: underwriting.monthlyMortgagePiti,
        monthly_mortgage: underwriting.monthlyMortgagePiti,
        monthly_rental_income: underwriting.monthlyRentalIncome,
        monthly_cash_flow: underwriting.monthlyCashFlow,
        rent_coverage_ratio: Number(underwriting.rentCoverageRatio.toFixed(3)),
        total_cash_needed: underwriting.totalCashNeeded,
        adu_coverage_pct: Number(
          (underwriting.rentCoverageRatio * 100).toFixed(1)
        ),
        coc_return: Number(underwriting.cocReturn.toFixed(2)),
        ai_score: dealScore,
        listing_url: listing.url,
        status: "new",
        fha_eligible: true,
        notes,
        confidence_level: confidenceLevel,
        data_sources: dataSources,
        property_id: null,
      };

      let { error } = await supabase.from("deals").insert(fullRow);

      if (error?.message.includes("column")) {
        const { error: fallbackError } = await supabase.from("deals").insert({
          address: fullRow.address,
          city: fullRow.city,
          market: fullRow.market,
          property_type: fullRow.property_type,
          list_price: fullRow.list_price,
          adu_rent_estimate: fullRow.adu_rent_estimate,
          mortgage_estimate: fullRow.mortgage_estimate,
          adu_coverage_pct: fullRow.adu_coverage_pct,
          coc_return: fullRow.coc_return,
          ai_score: fullRow.ai_score,
          fha_eligible: true,
          notes: JSON.stringify({
            scanner: notes,
            confidence_level: confidenceLevel,
            data_sources: dataSources,
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            sqft: listing.sqft,
            listing_url: listing.url,
            status: "new",
            adu_exists: research.aduExists,
            monthly_cash_flow: underwriting.monthlyCashFlow,
            rent_coverage_ratio: underwriting.rentCoverageRatio,
            total_cash_needed: underwriting.totalCashNeeded,
          }),
          property_id: null,
        });
        error = fallbackError;
      }

      if (!error) {
        inserted++;
        const result = scanResults.find((r) => r.zpid === listing.zpid);
        if (result) result.inserted = true;
      } else {
        insertErrors.push(`${listing.address}: ${error.message}`);
      }
    }
  } else {
    insertErrors.push("Supabase not configured — deals not inserted");
  }

  const apiCallsUsed = rentcast?.callCount ?? 0;
  const rateLimitWarning =
    apiCallsUsed > 20
      ? `Scan used ${apiCallsUsed} RentCast API calls (>${20} threshold). Consider fewer zips or listings to preserve free-tier quota.`
      : undefined;

  const summary: ScanSummary = {
    deals_found: listings.length,
    deals_qualified: qualifiedDeals.length,
    deals_inserted: inserted,
    scanned: listings.length,
    qualified: qualifiedDeals.length,
    inserted,
    api_calls_used: apiCallsUsed,
    rentcast_auth_failures: rentcast?.authFailures,
    rentcast_last_error: rentcast?.lastError ?? undefined,
    rate_limit_warning: rateLimitWarning,
    mock_mode: mockMode,
    live_mode: !mockMode,
  };

  return { summary, qualifiedDeals, scanResults, insertErrors };
}
