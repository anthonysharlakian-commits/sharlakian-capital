import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import type { DashboardKpis } from "@/lib/types/dashboard";

function getEmptyDashboardData() {
  return {
    properties: [],
    deals: [],
    cashflow: [],
    agents: [],
    maintenance: [],
    kpis: {
      portfolioValue: 0,
      totalEquity: 0,
      monthlyCashFlow: 0,
      liquidCapital: 0,
      propertyCount: 0,
    },
    isDemo: false,
  };
}

function computeKpis(
  properties: Array<{
    current_value?: number | null;
    mortgage_balance?: number | null;
    monthly_rent?: number | null;
    monthly_expenses?: number | null;
  }>,
  liquidCapital: number
): DashboardKpis {
  const portfolioValue = properties.reduce((s, p) => s + (p.current_value || 0), 0);
  const totalEquity = properties.reduce(
    (s, p) => s + ((p.current_value || 0) - (p.mortgage_balance || 0)),
    0
  );
  const monthlyCashFlow = properties.reduce(
    (s, p) => s + ((p.monthly_rent || 0) - (p.monthly_expenses || 0)),
    0
  );

  return {
    portfolioValue,
    totalEquity,
    monthlyCashFlow,
    liquidCapital,
    propertyCount: properties.length,
  };
}

async function getLiveDashboardData() {
  const supabase = createAdminClient();

  const [
    propertiesRes,
    dealsRes,
    cashflowRes,
    agentsRes,
    maintenanceRes,
    settingsRes,
  ] = await Promise.all([
    supabase.from("properties").select("*").in("status", ["active", "owned"]),
    supabase.from("deals").select("*").order("ai_score", { ascending: false }).limit(5),
    supabase.from("monthly_cashflow_log").select("*").order("month").limit(12),
    supabase.from("agents").select("*").order("agent_name"),
    supabase
      .from("maintenance_requests")
      .select("*")
      .eq("resolved", false)
      .order("priority", { ascending: false })
      .limit(3),
    supabase.from("settings").select("*"),
  ]);

  const properties = propertiesRes.data ?? [];
  const settings = settingsRes.data ?? [];
  const liquidCapital = Number(
    settings.find((s) => s.key === "liquid_capital")?.value ?? 0
  );

  return {
    properties,
    deals: dealsRes.data ?? [],
    cashflow: cashflowRes.data ?? [],
    agents: agentsRes.data ?? [],
    maintenance: maintenanceRes.data ?? [],
    kpis: computeKpis(properties, liquidCapital),
    isDemo: false,
  };
}

export async function getDashboardData() {
  if (!hasSupabaseConfig()) {
    return getEmptyDashboardData();
  }

  try {
    return await getLiveDashboardData();
  } catch (err) {
    console.error("Dashboard live fetch failed:", err);
    return getEmptyDashboardData();
  }
}
