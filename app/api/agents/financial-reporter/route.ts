import { NextResponse } from "next/server";
import { callClaude, logAgentAction } from "@/lib/claude";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { verifyCronAuth, unauthorizedResponse } from "@/lib/auth/cron";
import { getMockStore } from "@/lib/mock-store";
import { notifyOwner } from "@/lib/twilio";
import { setAgentStatus } from "@/lib/agents/status";

interface AnomalyResult {
  anomalies: string[];
  risk_level: "low" | "medium" | "high";
  summary: string;
}

interface PropertyReport {
  property: string;
  income: number;
  expenses: number;
  net: number;
  anomalies?: string[];
  risk_level?: string;
  summary?: string;
}

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) return unauthorizedResponse();

  await setAgentStatus("financial_reporter", "scanning");

  let totalTokens = 0;
  const reports: PropertyReport[] = [];

  try {
    let properties: { id: string; address: string; monthly_rent: number | null; current_value: number | null; mortgage_balance: number | null }[] = [];

    if (hasSupabaseConfig()) {
      const supabase = createAdminClient();
      const { data } = await supabase.from("properties").select("*").in("status", ["active", "owned"]);
      properties = data ?? [];
    } else {
      properties = getMockStore().properties.filter((p) => p.status === "active" || p.status === "owned");
    }
    for (const property of properties) {
      let income = 0;
      let expenses = 0;
      let avgExpenses = 0;

      if (hasSupabaseConfig()) {
        const supabase = createAdminClient();
        const startOfMonth = new Date();
        startOfMonth.setDate(1);

        const { data: transactions } = await supabase
          .from("transactions")
          .select("*")
          .eq("property_id", property.id)
          .gte("date", startOfMonth.toISOString().split("T")[0]);

        income = (transactions ?? [])
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + (t.amount ?? 0), 0);
        expenses = (transactions ?? [])
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + (t.amount ?? 0), 0);

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const { data: historicalExpenses } = await supabase
          .from("transactions")
          .select("amount")
          .eq("property_id", property.id)
          .eq("type", "expense")
          .gte("date", threeMonthsAgo.toISOString().split("T")[0]);

        avgExpenses =
          (historicalExpenses ?? []).reduce((s, t) => s + (t.amount ?? 0), 0) /
          Math.max(1, (historicalExpenses ?? []).length);
      } else {
        const txs = getMockStore().transactions.filter((t) => t.property_id === property.id);
        income = txs.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount ?? 0), 0);
        expenses = txs.filter((t) => t.type === "expense").reduce((s, t) => s + (t.amount ?? 0), 0);
        avgExpenses = expenses;
      }

      const { data: anomalyCheck, tokensUsed } = await callClaude<AnomalyResult>(
        `Analyze this property's monthly financials and flag any anomalies or concerns.
        
Property: ${property.address}
Expected rent: $${property.monthly_rent}
Collected: $${income}
Expenses this month: $${expenses}
Last 3 months avg expenses: $${avgExpenses.toFixed(0)}

Return JSON: { "anomalies": string[], "risk_level": "low"|"medium"|"high", "summary": string }`,
        { maxTokens: 500 }
      );

      totalTokens += tokensUsed;

      reports.push({
        property: property.address,
        income,
        expenses,
        net: income - expenses,
        ...anomalyCheck,
      });
    }

    const portfolioSummary = reports
      .map((r) => `${r.property}: ${r.summary ?? "No summary"}`)
      .join("\n");

    await notifyOwner(
      `📊 MONTHLY PORTFOLIO REPORT\n\n${portfolioSummary || "No owned properties to report on."}`
    );

    // Save portfolio snapshot (Supabase only)
    if (hasSupabaseConfig()) {
      const supabase = createAdminClient();
      const totalValue = properties.reduce((s, p) => s + (p.current_value ?? 0), 0);
      const totalDebt = properties.reduce((s, p) => s + (p.mortgage_balance ?? 0), 0);

      await supabase.from("portfolio_snapshots").insert({
        snapshot_date: new Date().toISOString().split("T")[0],
        total_properties: properties.length,
        total_portfolio_value: totalValue,
        total_debt: totalDebt,
        total_equity: totalValue - totalDebt,
        gross_monthly_rent: properties.reduce((s, p) => s + (p.monthly_rent ?? 0), 0),
        net_monthly_cash_flow: reports.reduce((s, r) => s + r.net, 0),
      });

      const monthStart = new Date();
      monthStart.setDate(1);
      const netCashflow = reports.reduce((s, r) => s + r.net, 0);
      await supabase.from("monthly_cashflow_log").upsert(
        {
          month: monthStart.toISOString().split("T")[0],
          net_cashflow: netCashflow,
          is_projected: false,
        },
        { onConflict: "month" }
      );
    }

    await logAgentAction("financial_reporter", "monthly_report", {
      output: { properties_reported: reports.length },
      tokensUsed: totalTokens,
      status: "success",
    });

    await setAgentStatus("financial_reporter", "idle");
    return NextResponse.json({ success: true, reports });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await setAgentStatus("financial_reporter", "error");
    await logAgentAction("financial_reporter", "report_failed", {
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
