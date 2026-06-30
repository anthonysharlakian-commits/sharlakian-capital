import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import type { AgentRegistryKey } from "@/lib/agents/registry";

export type AgentStatus = "active" | "scanning" | "idle" | "error";

export const AGENT_DISPLAY_NAMES: Record<AgentRegistryKey, string> = {
  deal_scanner: "Deal Scanner",
  underwriter: "Underwriter",
  maintenance_router: "Maintenance Router",
  refi_monitor: "Refi Monitor",
  financial_reporter: "Financial Reporter",
  tenant_screener: "Tenant Screener",
};

export const AGENT_ROUTE_IDS: Record<string, AgentRegistryKey | string> = {
  "Deal Scanner": "deal_scanner",
  Underwriter: "underwriter",
  "Market Intel": "market_intel",
  "Maintenance Router": "maintenance_router",
  "Refi Monitor": "refi_monitor",
  "Financial Reporter": "financial_reporter",
  "Tenant Screener": "tenant_screener",
};

const SUCCESS_STATUS: Record<AgentRegistryKey, AgentStatus> = {
  deal_scanner: "idle",
  maintenance_router: "idle",
  refi_monitor: "idle",
  financial_reporter: "idle",
  underwriter: "idle",
  tenant_screener: "idle",
};

export async function setAgentStatus(agent: AgentRegistryKey, status: AgentStatus) {
  if (!hasSupabaseConfig()) return;

  const supabase = createAdminClient();
  await supabase
    .from("agents")
    .update({
      status,
      last_run_at: new Date().toISOString(),
    })
    .eq("agent_name", AGENT_DISPLAY_NAMES[agent]);
}

export async function withAgentRun<T>(
  agent: AgentRegistryKey,
  fn: () => Promise<T>
): Promise<T> {
  await setAgentStatus(agent, "scanning");
  try {
    const result = await fn();
    await setAgentStatus(agent, SUCCESS_STATUS[agent]);
    return result;
  } catch (err) {
    await setAgentStatus(agent, "error");
    throw err;
  }
}
