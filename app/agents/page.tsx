import Link from "next/link";
import { getAgentLogs } from "@/lib/data/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Clock, Zap } from "lucide-react";

const AGENTS = [
  { id: "deal_scanner", name: "Deal Scanner", schedule: "Every 6 hours", description: "Scans MLS, Zillow, off-market for qualifying deals" },
  { id: "underwriter", name: "Underwriting Engine", schedule: "Event-driven", description: "Deep financial analysis on qualified deals" },
  { id: "maintenance_router", name: "Maintenance Router", schedule: "Event-driven", description: "AI diagnosis and contractor assignment" },
  { id: "refi_monitor", name: "Refi Monitor", schedule: "Monthly", description: "Equity build and refinance opportunity detection" },
  { id: "financial_reporter", name: "Financial Reporter", schedule: "Monthly", description: "P&L reports and anomaly detection" },
  { id: "tenant_screener", name: "Tenant Screener", schedule: "Event-driven", description: "AI-powered tenant application analysis" },
];

export default async function AgentsPage() {
  const logs = await getAgentLogs(20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agent Control Center</h1>
        <p className="text-muted-foreground text-sm mt-1">AI agent registry and activity monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {AGENTS.map((agent) => (
          <Link key={agent.id} href={`/agents/${agent.id}`}>
            <Card className="glass-card hover:border-primary/30 transition-colors h-full">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{agent.name}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {agent.schedule}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{agent.description}</p>
                    <div className="flex items-center gap-1 mt-3">
                      <span className="h-2 w-2 rounded-full bg-score-high" />
                      <span className="text-xs text-score-high">Operational</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                <div>
                  <span className="font-medium capitalize">{log.agent.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground"> — {log.action.replace(/_/g, " ")}</span>
                  {log.tokens_used != null && log.tokens_used > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">({log.tokens_used} tokens)</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                  <Badge variant={log.status === "success" ? "success" : log.status === "error" ? "danger" : "warning"}>
                    {log.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
