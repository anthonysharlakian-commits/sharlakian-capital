"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Play } from "lucide-react";
import { AGENT_REGISTRY } from "@/lib/agents/registry";

const AGENT_INFO: Record<string, { name: string; description: string }> = {
  deal_scanner: { name: "Deal Scanner", description: "Scans MLS, Zillow, off-market for qualifying deals" },
  underwriter: { name: "Underwriting Engine", description: "Deep financial analysis on qualified deals" },
  maintenance_router: { name: "Maintenance Router", description: "AI diagnosis and contractor assignment" },
  refi_monitor: { name: "Refi Monitor", description: "Equity build and refinance opportunity detection" },
  financial_reporter: { name: "Financial Reporter", description: "P&L reports and anomaly detection" },
  tenant_screener: { name: "Tenant Screener", description: "AI-powered tenant application analysis" },
};

export default function AgentDetailPage({ params }: { params: { agent: string } }) {
  const agentId = params.agent.replace(/-/g, "_");
  const info = AGENT_INFO[agentId];
  const registry = AGENT_REGISTRY[agentId as keyof typeof AGENT_REGISTRY];
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  function runAgent() {
    startTransition(async () => {
      const res = await fetch("/api/agents/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: agentId }),
      });
      setResult(await res.json());
    });
  }

  if (!info) {
    return <p className="text-muted-foreground">Agent not found</p>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{info.name}</h1>
          <p className="text-muted-foreground text-sm">{info.description}</p>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Agent Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-score-high" />
            <span className="text-sm">Operational</span>
          </div>
          {registry && (
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Schedule:</span> {registry.schedule}</p>
              <p><span className="text-muted-foreground">Endpoint:</span> {registry.endpoint}</p>
            </div>
          )}
          <Button onClick={runAgent} disabled={pending} className="gap-2">
            <Play className="h-4 w-4" />
            {pending ? "Running..." : "Run Now"}
          </Button>
          {result && (
            <Badge variant={result.success ? "success" : "danger"}>
              {result.success ? "Completed" : result.error ?? "Failed"}
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
