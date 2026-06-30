import { callClaude, callClaudeText } from "@/lib/claude";
import type { ComparableSale, MarketData, RehabBreakdown } from "@/lib/types/database";
import type { HouseHackAnalysis } from "@/lib/financial-calculations";

export interface AiEnrichment {
  market_data: MarketData | null;
  comparable_sales: ComparableSale[] | null;
  rehab_breakdown: RehabBreakdown | null;
  ai_summary: string | null;
  tokens_used: number;
}

interface MarketAiResult {
  market_data: MarketData;
  comparable_sales: ComparableSale[];
}

interface RehabAiResult {
  rehab_breakdown: RehabBreakdown;
}

export async function enrichUnderwritingWithAi(
  deal: {
    address: string;
    city?: string | null;
    list_price: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    sqft?: number | null;
    notes?: string | null;
    condition?: string | null;
  },
  analysis: HouseHackAnalysis
): Promise<AiEnrichment> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      market_data: null,
      comparable_sales: null,
      rehab_breakdown: null,
      ai_summary: null,
      tokens_used: 0,
    };
  }

  let tokensUsed = 0;

  const marketPrompt = `Research market context for this FHA house-hack candidate in Southern California.
Address: ${deal.address}, ${deal.city ?? ""}
List price: $${deal.list_price?.toLocaleString() ?? "unknown"}
Notes: ${deal.notes ?? "none"}

Return JSON only:
{
  "market_data": {
    "avg_days_on_market": number,
    "list_to_sale_ratio": number (0-1),
    "avg_rent_by_bedroom": { "1": number, "2": number, "3": number },
    "vacancy_rate": number (0-1),
    "price_appreciation_12mo": number (0-1),
    "neighborhood_score": number (0-100),
    "population_growth": number (0-1),
    "job_growth": number (0-1)
  },
  "comparable_sales": [
    { "address": string, "sold_price": number, "sold_date": "YYYY-MM", "sqft": number, "beds": number, "baths": number }
  ]
}
Use realistic SCV/IE estimates. Do NOT include score or recommendation fields.`;

  const rehabPrompt = `Estimate rehab for this property (condition from scanner: ${deal.condition ?? "unknown"}).
Address: ${deal.address}
Price: $${deal.list_price?.toLocaleString() ?? "unknown"}
Sqft: ${deal.sqft ?? "unknown"}
Notes: ${deal.notes ?? "none"}

Return JSON only:
{
  "rehab_breakdown": {
    "total_estimate": number,
    "breakdown": { "cosmetic": number, "systems": number, "adu_prep": number },
    "condition_rating": "excellent"|"good"|"fair"|"poor",
    "value_add_potential": number (0-100)
  }
}`;

  const [marketResult, rehabResult] = await Promise.all([
    callClaude<MarketAiResult>(marketPrompt, { maxTokens: 800 }),
    callClaude<RehabAiResult>(rehabPrompt, { maxTokens: 600 }),
  ]);

  const market_data = marketResult.data?.market_data ?? null;
  const comparable_sales = marketResult.data?.comparable_sales ?? null;
  const rehab_breakdown = rehabResult.data?.rehab_breakdown ?? null;
  tokensUsed += marketResult.tokensUsed + rehabResult.tokensUsed;

  const summaryPrompt = `Write a 2-3 sentence plain-English underwriting summary for Anthony (real estate investor, FHA house-hack strategy).
Use ONLY these pre-computed numbers — do not invent scores or change the recommendation.

Address: ${deal.address}
Recommendation: ${analysis.recommendation}
Deal score: ${analysis.dealScore}/100 (Phase 1: ${analysis.scoreBreakdown.phase1Score}, Cap rate pts: ${analysis.scoreBreakdown.phase2CapRateScore}, CoC pts: ${analysis.scoreBreakdown.phase2CocScore})
Phase 1 effective housing cost: $${Math.round(analysis.phase1.effectiveHousingCost)}/mo
Phase 1 market rent benchmark: $${Math.round(analysis.phase1.effectiveHousingCost + analysis.phase1.monthlySavingsVsRenting)}/mo
Monthly savings vs renting: $${Math.round(analysis.phase1.monthlySavingsVsRenting)}/mo
ADU rent coverage of PITI: ${(analysis.phase1.aduRentCoverage * 100).toFixed(0)}%
Phase 2 cap rate: ${(analysis.phase2.capRate * 100).toFixed(1)}%
Phase 2 cash-on-cash: ${(analysis.phase2.cashOnCashReturn * 100).toFixed(1)}%

Return plain text only — no JSON, no score override.`;

  const summaryResult = await callClaudeText(summaryPrompt, { maxTokens: 300 });
  tokensUsed += summaryResult.tokensUsed;

  return {
    market_data,
    comparable_sales,
    rehab_breakdown,
    ai_summary: summaryResult.data ?? null,
    tokens_used: tokensUsed,
  };
}
