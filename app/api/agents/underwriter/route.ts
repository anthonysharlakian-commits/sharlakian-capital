import { NextResponse } from "next/server";
import { callClaude, logAgentAction } from "@/lib/claude";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateFinancialMetrics,
  getOperatingExpenseRatio,
} from "@/lib/financial-calculations";
import { notifyOwner, formatApprovalReadyNotification } from "@/lib/twilio";
import type { MarketData, RehabBreakdown, ComparableSale } from "@/lib/types/database";

export async function POST(request: Request) {
  const { propertyId } = await request.json();
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  let totalTokens = 0;

  try {
    const { data: property } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    await supabase
      .from("properties")
      .update({ status: "underwriting" })
      .eq("id", propertyId);

    const purchasePrice = property.purchase_price ?? property.list_price ?? 0;
    const grossRent = property.monthly_rent ?? 2000;
    const opexRatio = getOperatingExpenseRatio(property.type ?? "sfr");

    // 2a. Financial Model (rule-based)
    const financials = calculateFinancialMetrics({
      purchasePrice,
      grossMonthlyRent: grossRent,
      operatingExpenseRatio: opexRatio,
    });

    // 2b. Market Intel (AI)
    const marketResult = await callClaude<{ market_data: MarketData; comparable_sales: ComparableSale[] }>(
      `Analyze market data for this property and return comparable sales.
      
Property: ${JSON.stringify(property)}

Return JSON: {
  "market_data": {
    "avg_days_on_market": number,
    "list_to_sale_ratio": number,
    "avg_rent_by_bedroom": { "3": number },
    "vacancy_rate": number,
    "price_appreciation_12mo": number,
    "neighborhood_score": number,
    "population_growth": number,
    "job_growth": number
  },
  "comparable_sales": [{ "address": string, "sold_price": number, "sold_date": string, "sqft": number, "beds": number, "baths": number }]
}`,
      { maxTokens: 1200 }
    );
    totalTokens += marketResult.tokensUsed;

    // 2c. Rehab Estimator (AI)
    const rehabResult = await callClaude<RehabBreakdown>(
      `Estimate rehab costs for this property based on its details.
      
Property: ${JSON.stringify(property)}

Return JSON: {
  "total_estimate": number,
  "breakdown": { "roof": number, "hvac": number, "plumbing": number, "electrical": number, "kitchen": number, "bathrooms": number, "flooring": number, "paint": number, "landscaping": number, "other": number },
  "condition_rating": "excellent" | "good" | "fair" | "poor",
  "value_add_potential": number
}`,
      { maxTokens: 1000, images: property.image_url ? [property.image_url] : [] }
    );
    totalTokens += rehabResult.tokensUsed;

    const rehabEstimate = rehabResult.data?.total_estimate ?? 15000;
    const finalFinancials = calculateFinancialMetrics({
      purchasePrice,
      grossMonthlyRent: grossRent,
      operatingExpenseRatio: opexRatio,
      rehabEstimate,
    });

    // Consolidated AI summary
    const summaryResult = await callClaude<{ summary: string; recommendation: string; score: number; breakdown: Record<string, number> }>(
      `Generate a consolidated deal report for this investment property.
      
Property: ${JSON.stringify(property)}
Financials: ${JSON.stringify(finalFinancials)}
Market: ${JSON.stringify(marketResult.data?.market_data)}
Rehab: ${JSON.stringify(rehabResult.data)}

Return JSON: { "summary": string, "recommendation": "strong_buy"|"buy"|"pass"|"investigate", "score": number, "breakdown": { "location": number, "cashflow": number, "appreciation": number, "condition": number, "financing": number } }`,
      { maxTokens: 800 }
    );
    totalTokens += summaryResult.tokensUsed;

    const analysis = {
      property_id: propertyId,
      purchase_price: finalFinancials.purchasePrice,
      down_payment: finalFinancials.downPayment,
      down_payment_pct: finalFinancials.downPaymentPct,
      loan_amount: finalFinancials.loanAmount,
      interest_rate: finalFinancials.interestRate,
      loan_term: finalFinancials.loanTerm,
      monthly_mortgage: finalFinancials.monthlyMortgage,
      gross_monthly_rent: finalFinancials.grossMonthlyRent,
      vacancy_rate: finalFinancials.vacancyRate,
      effective_gross_income: finalFinancials.effectiveGrossIncome,
      operating_expenses: finalFinancials.operatingExpenses,
      noi_monthly: finalFinancials.noiMonthly,
      noi_annual: finalFinancials.noiAnnual,
      monthly_cash_flow: finalFinancials.monthlyCashFlow,
      annual_cash_flow: finalFinancials.annualCashFlow,
      cap_rate: finalFinancials.capRate,
      cash_on_cash_return: finalFinancials.cashOnCashReturn,
      dscr: finalFinancials.dscr,
      grm: finalFinancials.grm,
      rehab_estimate: rehabEstimate,
      total_cash_needed: finalFinancials.totalCashNeeded,
      deal_score: summaryResult.data?.score ?? 75,
      score_breakdown: summaryResult.data?.breakdown ?? null,
      ai_summary: summaryResult.data?.summary ?? "Analysis complete.",
      ai_recommendation: summaryResult.data?.recommendation ?? "investigate",
      comparable_sales: marketResult.data?.comparable_sales ?? null,
      market_data: marketResult.data?.market_data ?? null,
      rehab_breakdown: rehabResult.data ?? null,
    };

    const { data: existing } = await supabase
      .from("deal_analyses")
      .select("id")
      .eq("property_id", propertyId)
      .limit(1)
      .single();

    if (existing) {
      await supabase.from("deal_analyses").update(analysis).eq("id", existing.id);
    } else {
      await supabase.from("deal_analyses").insert(analysis);
    }

    await supabase
      .from("properties")
      .update({ status: "pending_approval", purchase_price: purchasePrice })
      .eq("id", propertyId);

    await notifyOwner(
      formatApprovalReadyNotification({
        address: property.address,
        score: analysis.deal_score,
        recommendation: analysis.ai_recommendation,
        dealId: propertyId,
      })
    );

    await logAgentAction("underwriter", "analysis_complete", {
      propertyId,
      output: { score: analysis.deal_score },
      tokensUsed: totalTokens,
      status: "success",
    });

    return NextResponse.json({ success: true, analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logAgentAction("underwriter", "analysis_failed", {
      propertyId,
      output: { error: message },
      tokensUsed: totalTokens,
      status: "error",
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
