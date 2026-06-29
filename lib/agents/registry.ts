export const AGENT_REGISTRY = {
  deal_scanner: { schedule: "0 */6 * * *", endpoint: "/api/agents/deal-scanner" },
  refi_monitor: { schedule: "0 9 1 * *", endpoint: "/api/agents/refi-monitor" },
  financial_reporter: { schedule: "0 8 1 * *", endpoint: "/api/agents/financial-reporter" },
  underwriter: { schedule: "event-driven", endpoint: "/api/agents/underwriter" },
  maintenance_router: { schedule: "event-driven", endpoint: "/api/agents/maintenance-router" },
  tenant_screener: { schedule: "event-driven", endpoint: "/api/agents/tenant-screener" },
} as const;

export type AgentRegistryKey = keyof typeof AGENT_REGISTRY;
