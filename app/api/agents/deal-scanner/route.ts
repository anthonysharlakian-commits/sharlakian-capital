import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runDealScannerPipeline } from "@/lib/deal-scanner/pipeline";
import { isMockScanMode } from "@/lib/deal-scanner/search";
import { logAgentAction } from "@/lib/claude";
import { verifyCronAuth, unauthorizedResponse } from "@/lib/auth/cron";
import { setAgentStatus } from "@/lib/agents/status";

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) return unauthorizedResponse();

  await setAgentStatus("deal_scanner", "scanning");

  try {
    const { summary, scanResults, insertErrors } = await runDealScannerPipeline();

    await logAgentAction("deal_scanner", "scan_completed", {
      input: {
        deals_found: summary.deals_found,
        mock_mode: summary.mock_mode,
        api_calls_used: summary.api_calls_used,
      },
      output: {
        deals_qualified: summary.deals_qualified,
        deals_inserted: summary.deals_inserted,
        rate_limit_warning: summary.rate_limit_warning,
        qualified_deals: scanResults
          .filter((r) => r.qualified)
          .map((r) => ({
            address: r.address,
            zip: r.zip,
            score: r.dealScore,
            confidence: r.confidenceLevel,
          })),
        insert_errors: insertErrors,
        scoring_breakdown: scanResults.map((r) => ({
          zpid: r.zpid,
          address: r.address,
          city: r.city,
          zip: r.zip,
          price: r.price,
          market: r.market,
          score: r.dealScore,
          qualified: r.qualified,
          reason: r.disqualifiedReason,
          down_payment: r.downPayment,
          closing_costs: r.closingCosts,
          total_cash_needed: r.totalCashNeeded,
          monthly_piti: r.monthlyPiti,
          monthly_rental_income: r.monthlyRentalIncome,
          monthly_cash_flow: r.monthlyCashFlow,
          coc_return: r.cocReturn,
          rent_coverage_ratio: r.rentCoverageRatio,
          adu_exists: r.aduExists,
          confidence_level: r.confidenceLevel,
          inserted: r.inserted,
        })),
      },
      status: "success",
    });

    await setAgentStatus("deal_scanner", "idle");

    if (summary.deals_inserted > 0) {
      revalidatePath("/deals");
      revalidatePath("/dashboard");
    }

    return NextResponse.json({
      success: true,
      mock_mode: isMockScanMode(),
      scan_results: scanResults,
      insert_errors: insertErrors,
      ...summary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await setAgentStatus("deal_scanner", "error");
    await logAgentAction("deal_scanner", "scan_failed", {
      output: { error: message },
      status: "error",
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
