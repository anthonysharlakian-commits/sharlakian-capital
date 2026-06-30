import { createAdminClient } from "@/lib/supabase/admin";
import type { Property, DealAnalysis } from "@/lib/types/database";
import type { DashboardDeal } from "@/lib/types/dashboard";
import { hasSupabaseConfig } from "@/lib/supabase/config";

const EMPTY_KPIS = {
  totalProperties: 0,
  totalPortfolioValue: 0,
  totalEquity: 0,
  netMonthlyCashFlow: 0,
  overallCoCReturn: 0,
  liquidCapital: 0,
};

export async function getProperties(status?: string): Promise<Property[]> {
  if (!hasSupabaseConfig()) return [];

  const supabase = createAdminClient();
  let query = supabase.from("properties").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return [];
  return (data as Property[]) ?? [];
}

export async function getProperty(id: string): Promise<Property | null> {
  if (!hasSupabaseConfig()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("properties").select("*").eq("id", id).single();
  if (error || !data) return null;
  return data as Property;
}

export async function getDealAnalysis(propertyId: string): Promise<DealAnalysis | null> {
  if (!hasSupabaseConfig()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("deal_analyses")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as DealAnalysis;
}

export async function getDealAnalysesMap(): Promise<Record<string, DealAnalysis>> {
  if (!hasSupabaseConfig()) return {};

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("deal_analyses").select("*");
  if (error || !data?.length) return {};

  const map: Record<string, DealAnalysis> = {};
  for (const a of data) {
    map[a.property_id] = a as DealAnalysis;
  }
  return map;
}

export async function getDealById(id: string): Promise<DashboardDeal | null> {
  if (!hasSupabaseConfig()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("deals").select("*").eq("id", id).single();
  if (error || !data) return null;
  return data as DashboardDeal;
}

export async function getUnderwritingReport(dealId: string) {
  if (!hasSupabaseConfig()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("underwriting_reports")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function getDeals(): Promise<DashboardDeal[]> {
  if (!hasSupabaseConfig()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .order("ai_score", { ascending: false, nullsFirst: false });
  if (error) {
    console.error("getDeals failed:", error.message);
    return [];
  }
  return (data as DashboardDeal[]) ?? [];
}

export async function getOwnedProperties() {
  return getProperties("active");
}

export async function getTenants() {
  if (!hasSupabaseConfig()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("tenants").select("*");
  if (error) return [];
  return data ?? [];
}

export async function getMaintenanceRequests() {
  if (!hasSupabaseConfig()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("maintenance_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function getAgentLogs(limit = 20) {
  if (!hasSupabaseConfig()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("agent_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

export async function getAgents() {
  if (!hasSupabaseConfig()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("agents").select("*").order("agent_name");
  if (error) return [];
  return data ?? [];
}

export async function getTransactions() {
  if (!hasSupabaseConfig()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function getLiquidCapital(): Promise<number> {
  if (!hasSupabaseConfig()) return 0;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "liquid_capital")
    .single();
  if (error || !data?.value) return 0;
  return Number(data.value) || 0;
}

export async function getPortfolioKpis() {
  if (!hasSupabaseConfig()) return { ...EMPTY_KPIS };

  const supabase = createAdminClient();
  const [{ data: owned, error }, liquidCapital] = await Promise.all([
    supabase.from("properties").select("*").eq("status", "active"),
    getLiquidCapital(),
  ]);

  if (error || !owned?.length) {
    return { ...EMPTY_KPIS, liquidCapital };
  }

  const totalValue = owned.reduce((s, p) => s + (p.current_value ?? 0), 0);
  const totalDebt = owned.reduce((s, p) => s + (p.mortgage_balance ?? 0), 0);
  const netMonthlyCashFlow = owned.reduce(
    (s, p) => s + ((p.monthly_rent ?? 0) - (p.monthly_expenses ?? 0)),
    0
  );
  const overallCoCReturn =
    liquidCapital > 0 ? (netMonthlyCashFlow * 12) / liquidCapital : 0;

  return {
    totalProperties: owned.length,
    totalPortfolioValue: totalValue,
    totalEquity: totalValue - totalDebt,
    netMonthlyCashFlow,
    overallCoCReturn,
    liquidCapital,
  };
}

export async function getAcquisitionCriteriaFromStore() {
  if (!hasSupabaseConfig()) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("acquisition_criteria").select("*").limit(1).single();
  if (error || !data) return null;
  return data;
}
