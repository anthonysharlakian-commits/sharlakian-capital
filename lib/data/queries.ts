import { createAdminClient } from "@/lib/supabase/admin";
import {
  PORTFOLIO_KPIS,
} from "@/lib/mock-data";
import { getMockStore } from "@/lib/mock-store";
import type { Property, DealAnalysis } from "@/lib/types/database";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export async function getProperties(status?: string): Promise<Property[]> {
  if (!hasSupabaseConfig()) {
    const store = getMockStore();
    return status
      ? store.properties.filter((p) => p.status === status)
      : store.properties;
  }

  const supabase = createAdminClient();
  let query = supabase.from("properties").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error || !data?.length) return getMockStore().properties;
  return data as Property[];
}

export async function getProperty(id: string): Promise<Property | null> {
  if (!hasSupabaseConfig()) {
    return getMockStore().properties.find((p) => p.id === id) ?? null;
  }

  const supabase = createAdminClient();
  const { data } = await supabase.from("properties").select("*").eq("id", id).single();
  return (data as Property) ?? getMockStore().properties.find((p) => p.id === id) ?? null;
}

export async function getDealAnalysis(propertyId: string): Promise<DealAnalysis | null> {
  if (!hasSupabaseConfig()) {
    return getMockStore().dealAnalyses.find((a) => a.property_id === propertyId) ?? null;
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("deal_analyses")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (data as DealAnalysis) ?? getMockStore().dealAnalyses.find((a) => a.property_id === propertyId) ?? null;
}

export async function getDealAnalysesMap(): Promise<Record<string, DealAnalysis>> {
  if (!hasSupabaseConfig()) {
    const store = getMockStore();
    return Object.fromEntries(store.dealAnalyses.map((a) => [a.property_id, a]));
  }

  const supabase = createAdminClient();
  const { data } = await supabase.from("deal_analyses").select("*");
  const map: Record<string, DealAnalysis> = {};
  for (const a of data ?? getMockStore().dealAnalyses) {
    map[a.property_id] = a as DealAnalysis;
  }
  return map;
}

export async function getOwnedProperties() {
  return getProperties("owned");
}

export async function getTenants() {
  if (!hasSupabaseConfig()) return getMockStore().tenants;
  const supabase = createAdminClient();
  const { data } = await supabase.from("tenants").select("*");
  return data ?? getMockStore().tenants;
}

export async function getMaintenanceRequests() {
  if (!hasSupabaseConfig()) return getMockStore().maintenance;
  const supabase = createAdminClient();
  const { data } = await supabase.from("maintenance_requests").select("*").order("created_at", { ascending: false });
  return data ?? getMockStore().maintenance;
}

export async function getAgentLogs(limit = 20) {
  if (!hasSupabaseConfig()) return getMockStore().agentLogs.slice(0, limit);
  const supabase = createAdminClient();
  const { data } = await supabase.from("agent_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  return data ?? getMockStore().agentLogs.slice(0, limit);
}

export async function getTransactions() {
  if (!hasSupabaseConfig()) return getMockStore().transactions;
  const supabase = createAdminClient();
  const { data } = await supabase.from("transactions").select("*").order("date", { ascending: false });
  return data ?? getMockStore().transactions;
}

export async function getPortfolioKpis() {
  if (!hasSupabaseConfig()) {
    const owned = getMockStore().properties.filter((p) => p.status === "owned");
    if (!owned.length) return PORTFOLIO_KPIS;
    const totalValue = owned.reduce((s, p) => s + (p.current_value ?? 0), 0);
    const totalDebt = owned.reduce((s, p) => s + (p.mortgage_balance ?? 0), 0);
    return {
      ...PORTFOLIO_KPIS,
      totalProperties: owned.length,
      totalPortfolioValue: totalValue,
      totalEquity: totalValue - totalDebt,
    };
  }

  const supabase = createAdminClient();
  const { data: owned } = await supabase.from("properties").select("*").eq("status", "owned");

  if (!owned?.length) return PORTFOLIO_KPIS;

  const totalValue = owned.reduce((s, p) => s + (p.current_value ?? 0), 0);
  const totalDebt = owned.reduce((s, p) => s + (p.mortgage_balance ?? 0), 0);

  return {
    totalProperties: owned.length,
    totalPortfolioValue: totalValue,
    totalEquity: totalValue - totalDebt,
    netMonthlyCashFlow: PORTFOLIO_KPIS.netMonthlyCashFlow,
    overallCoCReturn: PORTFOLIO_KPIS.overallCoCReturn,
    liquidCapital: PORTFOLIO_KPIS.liquidCapital,
  };
}

export async function getAcquisitionCriteriaFromStore() {
  if (!hasSupabaseConfig()) return getMockStore().acquisitionCriteria;
  const supabase = createAdminClient();
  const { data } = await supabase.from("acquisition_criteria").select("*").limit(1).single();
  return data ?? getMockStore().acquisitionCriteria;
}
