import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { logAgentAction } from "@/lib/claude";
import { verifyCronAuth, unauthorizedResponse } from "@/lib/auth/cron";
import { setAgentStatus } from "@/lib/agents/status";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { DEAL_SCANNER_CRITERIA } from "@/lib/deal-scanner/criteria";
import { calculateHouseHackAnalysis } from "@/lib/financial-calculations";
import { analyzeDeal } from "@/lib/underwriter/analyze";
import { enrichUnderwritingWithAi } from "@/lib/underwriter/ai-enrichment";
import {
  buildDeterministicSummary,
  resolveHouseHackInputs,
} from "@/lib/underwriter/house-hack-inputs";
import type { DealForUnderwriting } from "@/lib/underwriter/types";
import type { Property } from "@/lib/types/database";

async function fetchDealsToProcess(dealId?: string) {
  const supabase = createAdminClient();

  if (dealId) {
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .eq("id", dealId)
      .single();
    if (error || !data) return { deals: [], error: "Deal not found" };
    return { deals: [data as DealForUnderwriting], error: null };
  }

  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("status", "new")
    .gte("ai_score", DEAL_SCANNER_CRITERIA.minDealScore)
    .order("ai_score", { ascending: false });

  if (error) return { deals: [], error: error.message };
  return { deals: (data as DealForUnderwriting[]) ?? [], error: null };
}

async function fetchLinkedProperty(
  deal: DealForUnderwriting
): Promise<Property | null> {
  if (!deal.property_id || !hasSupabaseConfig()) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("id", deal.property_id)
    .maybeSingle();
  return (data as Property) ?? null;
}

function mergeRiskFlags(
  stressFlags: string[],
  usedEstimatedSplit: boolean,
  splitNote: string | null,
  confidenceLevel?: string | null
): string[] {
  const flags = [...stressFlags];
  if (usedEstimatedSplit && splitNote) {
    flags.unshift(`Low confidence — ${splitNote}`);
  } else if (
    confidenceLevel?.toLowerCase() === "low" ||
    !confidenceLevel
  ) {
    flags.unshift("Low confidence in rent estimates — verify comps before acting");
  }
  return flags;
}

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) return unauthorizedResponse();

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  let dealId: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    dealId = typeof body.deal_id === "string" ? body.deal_id : undefined;
  } catch {
    // batch mode
  }

  await setAgentStatus("underwriter", "scanning");

  const supabase = createAdminClient();
  const { deals, error: fetchError } = await fetchDealsToProcess(dealId);

  if (fetchError) {
    await setAgentStatus("underwriter", "error");
    return NextResponse.json(
      { error: fetchError },
      { status: fetchError === "Deal not found" ? 404 : 500 }
    );
  }

  if (deals.length === 0) {
    await setAgentStatus("underwriter", "idle");
    return NextResponse.json({
      success: true,
      processed: 0,
      results: [],
      message: "No qualified deals with status 'new' to underwrite",
    });
  }

  const results: Array<{
    deal_id: string;
    address: string;
    scanner_score: number | null;
    deal_score: number;
    recommendation: string;
    reasoning: string;
    risk_flags: string[];
    error?: string;
  }> = [];

  try {
    for (const deal of deals) {
      const property = await fetchLinkedProperty(deal);
      const inputs = resolveHouseHackInputs(deal, property);
      const houseHack = calculateHouseHackAnalysis(inputs);
      const stressAnalysis = analyzeDeal(deal);

      const ai = await enrichUnderwritingWithAi(deal, houseHack);
      const reasoning =
        ai.ai_summary ??
        buildDeterministicSummary(deal.address, houseHack);

      const risk_flags = mergeRiskFlags(
        stressAnalysis.risk_flags,
        inputs.usedEstimatedSplit,
        inputs.splitNote,
        deal.confidence_level
      );

      const phase1Payload = {
        ...houseHack.phase1,
        ownerUnitMarketRent: inputs.ownerUnitMarketRent,
      };

      const reportRow = {
        deal_id: deal.id,
        stress_test_results: stressAnalysis.stress_test_results,
        risk_flags,
        recommendation: houseHack.recommendation,
        reasoning,
        phase1: phase1Payload,
        phase2: houseHack.phase2,
        score_breakdown: houseHack.scoreBreakdown,
        deal_score: houseHack.dealScore,
        market_data: ai.market_data,
        comparable_sales: ai.comparable_sales,
        rehab_breakdown: ai.rehab_breakdown,
        ai_summary: ai.ai_summary,
      };

      const { error: insertError } = await supabase
        .from("underwriting_reports")
        .insert(reportRow);

      if (insertError) {
        results.push({
          deal_id: deal.id,
          address: deal.address,
          scanner_score: deal.ai_score ?? null,
          deal_score: houseHack.dealScore,
          recommendation: houseHack.recommendation,
          reasoning,
          risk_flags,
          error: insertError.message,
        });
        continue;
      }

      const dealUpdates: Record<string, unknown> = { status: "underwritten" };
      if (inputs.usedEstimatedSplit) {
        dealUpdates.confidence_level = "Low";
        const existingSources =
          (deal.data_sources as Record<string, unknown>) ?? {};
        dealUpdates.data_sources = {
          ...existingSources,
          rent_split: {
            source: "Underwriter estimate",
            note: inputs.splitNote,
          },
        };
      }

      const { error: statusError } = await supabase
        .from("deals")
        .update(dealUpdates)
        .eq("id", deal.id);

      if (statusError) {
        results.push({
          deal_id: deal.id,
          address: deal.address,
          scanner_score: deal.ai_score ?? null,
          deal_score: houseHack.dealScore,
          recommendation: houseHack.recommendation,
          reasoning,
          risk_flags,
          error: `Report saved but status update failed: ${statusError.message}`,
        });
        continue;
      }

      if (property) {
        await supabase.from("deal_analyses").insert({
          property_id: property.id,
          purchase_price: inputs.purchasePrice,
          down_payment: houseHack.phase2.downPayment,
          down_payment_pct: houseHack.phase2.downPaymentPct,
          loan_amount: houseHack.phase2.loanAmount,
          interest_rate: houseHack.phase2.interestRate,
          loan_term: houseHack.phase2.loanTerm,
          monthly_mortgage: houseHack.phase2.monthlyMortgage,
          gross_monthly_rent:
            inputs.aduMonthlyRent + inputs.ownerUnitMarketRent,
          vacancy_rate: houseHack.phase2.vacancyRate,
          effective_gross_income: houseHack.phase2.effectiveGrossIncome,
          operating_expenses: houseHack.phase2.operatingExpenses,
          noi_monthly: houseHack.phase2.noiMonthly,
          noi_annual: houseHack.phase2.noiAnnual,
          monthly_cash_flow: houseHack.phase2.monthlyCashFlow,
          annual_cash_flow: houseHack.phase2.annualCashFlow,
          cap_rate: houseHack.phase2.capRate,
          cash_on_cash_return: houseHack.phase2.cashOnCashReturn,
          dscr: houseHack.phase2.dscr,
          grm: houseHack.phase2.grm,
          rehab_estimate: ai.rehab_breakdown?.total_estimate ?? null,
          total_cash_needed: houseHack.phase2.totalCashNeeded,
          deal_score: houseHack.dealScore,
          score_breakdown: houseHack.scoreBreakdown,
          ai_summary: reasoning,
          ai_recommendation:
            houseHack.recommendation === "GO"
              ? "buy"
              : houseHack.recommendation === "CAUTION"
                ? "investigate"
                : "pass",
          comparable_sales: ai.comparable_sales,
          market_data: ai.market_data,
          rehab_breakdown: ai.rehab_breakdown,
          phase1: phase1Payload,
          phase2: houseHack.phase2,
          house_hack_score_breakdown: houseHack.scoreBreakdown,
        });
      }

      results.push({
        deal_id: deal.id,
        address: deal.address,
        scanner_score: deal.ai_score ?? null,
        deal_score: houseHack.dealScore,
        recommendation: houseHack.recommendation,
        reasoning,
        risk_flags,
      });
    }

    await logAgentAction("underwriter", "underwriting_complete", {
      input: { deal_id: dealId ?? "batch", count: deals.length },
      output: {
        processed: results.filter((r) => !r.error).length,
        results: results.map((r) => ({
          address: r.address,
          scanner_score: r.scanner_score,
          deal_score: r.deal_score,
          recommendation: r.recommendation,
        })),
      },
      status: results.some((r) => r.error) ? "error" : "success",
    });

    await setAgentStatus("underwriter", "idle");

    revalidatePath("/deals");
    revalidatePath("/agents");

    return NextResponse.json({
      success: true,
      processed: results.filter((r) => !r.error).length,
      total: deals.length,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await setAgentStatus("underwriter", "error");
    await logAgentAction("underwriter", "underwriting_failed", {
      output: { error: message },
      status: "error",
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
