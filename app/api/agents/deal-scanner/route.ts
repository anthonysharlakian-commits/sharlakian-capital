import { NextResponse } from "next/server";
import { fetchZillowListings, runQuickScore } from "@/lib/zillow";
import { callClaude, logAgentAction } from "@/lib/claude";
import { getAcquisitionCriteria } from "@/lib/acquisition-criteria";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { notifyOwner, formatDealNotification } from "@/lib/twilio";
import { verifyCronAuth, unauthorizedResponse } from "@/lib/auth/cron";
import { getMockStore, addMockAgentLog } from "@/lib/mock-store";
import type { ScoreBreakdown, AIRecommendation, Property, DealAnalysis } from "@/lib/types/database";

interface AIScoreResult {
  score: number;
  breakdown: ScoreBreakdown;
  summary: string;
  recommendation: AIRecommendation;
}

function ruleBasedScore(quickScore: number, listing: { price: number; rentZestimate?: number }): AIScoreResult {
  const score = Math.min(100, quickScore + 10);
  return {
    score,
    breakdown: {
      location: 7,
      cashflow: score >= 75 ? 8 : 6,
      appreciation: 7,
      condition: 6,
      financing: 7,
    },
    summary: `Rule-based pre-score for $${listing.price.toLocaleString()} property. Estimated rent $${listing.rentZestimate ?? "N/A"}/mo.`,
    recommendation: score >= 80 ? "strong_buy" : score >= 70 ? "buy" : "investigate",
  };
}

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) return unauthorizedResponse();

  const criteria = await getAcquisitionCriteria();
  let totalTokens = 0;
  let qualified = 0;

  try {
    const listings = await fetchZillowListings(criteria);

    for (const listing of listings) {
      const quickScore = runQuickScore(listing);
      if (quickScore < 60) continue;

      let aiScore: AIScoreResult;
      if (process.env.ANTHROPIC_API_KEY) {
        const { data, tokensUsed, error } = await callClaude<AIScoreResult>(
          `You are a real estate investment analyst. Score this property deal from 0-100 based on investment potential.

Property: ${JSON.stringify(listing)}
Acquisition criteria: ${JSON.stringify(criteria)}

Return JSON only: {
  "score": number,
  "breakdown": { "location": number, "cashflow": number, "appreciation": number, "condition": number, "financing": number },
  "summary": string,
  "recommendation": "strong_buy" | "buy" | "pass" | "investigate"
}`,
          { maxTokens: 1000 }
        );
        totalTokens += tokensUsed;
        if (error || !data || data.score < criteria.min_deal_score) continue;
        aiScore = data;
      } else {
        aiScore = ruleBasedScore(quickScore, listing);
        if (aiScore.score < criteria.min_deal_score) continue;
      }

      let propertyId: string;

      if (hasSupabaseConfig()) {
        const supabase = createAdminClient();
        const { data: property, error: propError } = await supabase
          .from("properties")
          .upsert(
            {
              address: listing.address,
              city: listing.city,
              state: listing.state,
              zip: listing.zip,
              type: listing.propertyType.toLowerCase().includes("duplex") ? "duplex" : "sfr",
              status: "underwriting",
              list_price: listing.price,
              bedrooms: listing.bedrooms,
              bathrooms: listing.bathrooms,
              sqft: listing.sqft,
              year_built: listing.yearBuilt,
              monthly_rent: listing.rentZestimate,
              zillow_id: listing.zpid,
              zillow_url: listing.url,
              image_url: listing.images[0] ?? null,
            },
            { onConflict: "zillow_id", ignoreDuplicates: false }
          )
          .select()
          .single();

        if (propError || !property) continue;
        propertyId = property.id;

        await supabase.from("deal_analyses").insert({
          property_id: propertyId,
          deal_score: aiScore.score,
          score_breakdown: aiScore.breakdown,
          ai_summary: aiScore.summary,
          ai_recommendation: aiScore.recommendation,
          purchase_price: listing.price,
        });
      } else {
        const store = getMockStore();
        const existing = store.properties.find((p) => p.zillow_id === listing.zpid);
        if (existing) continue;

        propertyId = `prop-${Date.now()}-${qualified}`;
        const property: Property = {
          id: propertyId,
          address: listing.address,
          city: listing.city,
          state: listing.state,
          zip: listing.zip,
          type: listing.propertyType.toLowerCase().includes("duplex") ? "duplex" : "sfr",
          status: "underwriting",
          list_price: listing.price,
          purchase_price: null,
          current_value: null,
          mortgage_balance: null,
          monthly_rent: listing.rentZestimate ?? null,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          sqft: listing.sqft,
          year_built: listing.yearBuilt ?? null,
          lot_size: null,
          zillow_id: listing.zpid,
          zillow_url: listing.url,
          image_url: listing.images[0] ?? null,
          rejection_notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const analysis: DealAnalysis = {
          id: `analysis-${propertyId}`,
          property_id: propertyId,
          purchase_price: listing.price,
          down_payment: null,
          down_payment_pct: null,
          loan_amount: null,
          interest_rate: null,
          loan_term: 30,
          monthly_mortgage: null,
          gross_monthly_rent: listing.rentZestimate ?? null,
          vacancy_rate: 0.05,
          effective_gross_income: null,
          operating_expenses: null,
          noi_monthly: null,
          noi_annual: null,
          monthly_cash_flow: null,
          annual_cash_flow: null,
          cap_rate: null,
          cash_on_cash_return: null,
          dscr: null,
          grm: null,
          rehab_estimate: null,
          total_cash_needed: null,
          deal_score: aiScore.score,
          score_breakdown: aiScore.breakdown,
          ai_summary: aiScore.summary,
          ai_recommendation: aiScore.recommendation,
          comparable_sales: null,
          market_data: null,
          rehab_breakdown: null,
          created_at: new Date().toISOString(),
        };

        store.properties.unshift(property);
        store.dealAnalyses.unshift(analysis);
        const fs = await import("fs");
        const path = await import("path");
        const storePath = path.join(process.cwd(), ".data", "mock-store.json");
        const dir = path.dirname(storePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
      }

      qualified++;

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      fetch(`${baseUrl}/api/agents/underwriter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      }).catch(() => {});

      if (aiScore.score >= 75) {
        await notifyOwner(
          formatDealNotification({
            address: listing.address,
            city: listing.city,
            score: aiScore.score,
            coc: 0.08,
            cashFlow: listing.rentZestimate ? listing.rentZestimate - 1500 : 0,
            dealId: propertyId,
          })
        );
      }
    }

    await logAgentAction("deal_scanner", "scan_completed", {
      input: { listings_found: listings.length },
      output: { qualified, tokens: totalTokens },
      tokensUsed: totalTokens,
      status: "success",
    });

    if (!hasSupabaseConfig()) {
      addMockAgentLog({
        agent: "deal_scanner",
        action: "scan_completed",
        property_id: null,
        input: { listings_found: listings.length },
        output: { qualified },
        tokens_used: totalTokens,
        status: "success",
      });
    }

    return NextResponse.json({ success: true, scanned: listings.length, qualified });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logAgentAction("deal_scanner", "scan_failed", {
      output: { error: message },
      tokensUsed: totalTokens,
      status: "error",
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
