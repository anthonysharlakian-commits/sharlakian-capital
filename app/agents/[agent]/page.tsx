import { notFound } from "next/navigation";
import { getAgents } from "@/lib/data/queries";
import { AGENT_ROUTE_IDS } from "@/lib/agents/status";
import { AgentDetailClient } from "@/components/agents/agent-detail-client";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ agent: string }>;
}) {
  const { agent } = await params;
  const agentId = agent.replace(/-/g, "_");
  const agents = await getAgents();
  const dbAgent = agents.find((a) => AGENT_ROUTE_IDS[a.agent_name] === agentId);

  if (!dbAgent && !["deal_scanner", "underwriter", "market_intel", "maintenance_router", "refi_monitor", "financial_reporter", "tenant_screener"].includes(agentId)) {
    notFound();
  }

  return (
    <AgentDetailClient
      agentId={agentId}
      initialStatus={dbAgent?.status ?? "idle"}
      lastRunAt={dbAgent?.last_run_at ?? null}
    />
  );
}
