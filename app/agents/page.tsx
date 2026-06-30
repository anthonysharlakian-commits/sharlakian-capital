import Link from "next/link";
import { getAgentLogs, getAgents } from "@/lib/data/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DealScannerCard } from "@/components/agents/deal-scanner-card";
import { UnderwriterCard } from "@/components/agents/underwriter-card";
import { AGENT_ROUTE_IDS } from "@/lib/agents/status";
import { AGENT_REGISTRY, type AgentRegistryKey } from "@/lib/agents/registry";
import { Bot, Clock } from "lucide-react";

const AGENT_DESCRIPTIONS: Record<string, string> = {
  deal_scanner: "Scans MLS, Zillow, off-market for qualifying deals",
  underwriter: "Deep financial analysis on qualified deals",
  market_intel: "Market comps, rent data, and neighborhood analysis",
  maintenance_router: "AI diagnosis and contractor assignment",
  refi_monitor: "Equity build and refinance opportunity detection",
  financial_reporter: "P&L reports and anomaly detection",
  tenant_screener: "AI-powered tenant application analysis",
};

function statusColor(status: string): string {
  switch (status) {
    case "active": return "#00C97A";
    case "scanning": return "#C9A84C";
    case "error": return "#E05252";
    default: return "#3A5068";
  }
}

export default async function AgentsPage() {
  const [agents, logs] = await Promise.all([getAgents(), getAgentLogs(20)]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Agents"
        subtitle="AI agent registry and activity monitoring"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {agents.length === 0 ? (
          <p className="empty-state col-span-full">NO AGENTS REGISTERED</p>
        ) : (
          agents.map((agent) => {
          const routeId = AGENT_ROUTE_IDS[agent.agent_name];
          const registry =
            routeId && routeId in AGENT_REGISTRY
              ? AGENT_REGISTRY[routeId as AgentRegistryKey]
              : null;
          const dotColor = statusColor(agent.status);

          if (routeId === "deal_scanner") {
            return (
              <DealScannerCard
                key={agent.id}
                agentId={routeId}
                agentName={agent.agent_name}
                status={agent.status}
                schedule={registry?.schedule}
                description={AGENT_DESCRIPTIONS[routeId]}
              />
            );
          }

          if (routeId === "underwriter") {
            return (
              <UnderwriterCard
                key={agent.id}
                agentId={routeId}
                agentName={agent.agent_name}
                status={agent.status}
                schedule={registry?.schedule}
                description={AGENT_DESCRIPTIONS[routeId]}
              />
            );
          }

          return (
            <Link key={agent.id} href={`/agents/${routeId ?? agent.agent_name.toLowerCase().replace(/ /g, "_")}`}>
              <Card className="hover:border-[rgba(201,168,76,0.3)] transition-colors h-full">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-[2px] bg-[rgba(201,168,76,0.08)] flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-[var(--gold)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="body-text">{agent.agent_name}</p>
                      {registry && (
                        <div className="flex items-center gap-1 mt-1 caption-sm">
                          <Clock className="h-3 w-3" />
                          {registry.schedule}
                        </div>
                      )}
                      {routeId && AGENT_DESCRIPTIONS[routeId] && (
                        <p className="caption-sm text-[var(--text-muted)] mt-2">{AGENT_DESCRIPTIONS[routeId]}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-3">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                        <span className="agent-status-label" style={{ color: dotColor }}>
                          {agent.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {logs.length === 0 ? (
              <p className="empty-state py-4">NO ACTIVITY LOGGED</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0 caption-sm">
                  <div className="text-[var(--text-secondary)]">
                    <span className="capitalize">
                      {(log.agent ?? "unknown").replace(/_/g, " ")}
                    </span>
                    <span className="text-[var(--text-muted)]">
                      {" "}
                      — {(log.action ?? "action").replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="caption-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                    <Badge variant={log.status === "success" ? "success" : log.status === "error" ? "danger" : "warning"}>
                      {log.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
