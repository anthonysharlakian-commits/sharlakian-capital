"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Play } from "lucide-react";
import { AGENT_REGISTRY } from "@/lib/agents/registry";
import type { AgentStatus } from "@/lib/agents/status";

const AGENT_INFO: Record<string, { name: string; description: string }> = {
  deal_scanner: { name: "Deal Scanner", description: "Scans MLS, Zillow, off-market for qualifying deals" },
  underwriter: { name: "Underwriting Engine", description: "Deep financial analysis on qualified deals" },
  market_intel: { name: "Market Intel", description: "Market comps, rent data, and neighborhood analysis" },
  maintenance_router: { name: "Maintenance Router", description: "AI diagnosis and contractor assignment" },
  refi_monitor: { name: "Refi Monitor", description: "Equity build and refinance opportunity detection" },
  financial_reporter: { name: "Financial Reporter", description: "P&L reports and anomaly detection" },
  tenant_screener: { name: "Tenant Screener", description: "AI-powered tenant application analysis" },
};

function statusColor(status: string): string {
  switch (status) {
    case "active": return "#00C97A";
    case "scanning": return "#C9A84C";
    case "error": return "#E05252";
    default: return "#3A5068";
  }
}

interface AgentDetailClientProps {
  agentId: string;
  initialStatus: AgentStatus | string;
  lastRunAt: string | null;
}

export function AgentDetailClient({ agentId, initialStatus, lastRunAt }: AgentDetailClientProps) {
  const info = AGENT_INFO[agentId];
  const registry = AGENT_REGISTRY[agentId as keyof typeof AGENT_REGISTRY];
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  const [result, setResult] = useState<{
    success?: boolean;
    error?: string;
    deals_found?: number;
    deals_qualified?: number;
    deals_inserted?: number;
  } | null>(null);

  function runAgent() {
    setStatus("scanning");
    startTransition(async () => {
      try {
        const res = await fetch("/api/agents/orchestrator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agent: agentId }),
        });
        const data = await res.json();
        setResult(data);
        setStatus(res.ok ? "idle" : "error");
      } catch {
        setResult({ error: "Agent request failed" });
        setStatus("error");
      }
    });
  }

  if (!info) {
    return <p className="empty-state py-8">AGENT NOT FOUND</p>;
  }

  const dotColor = statusColor(status);

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-[2px] bg-[rgba(201,168,76,0.08)] flex items-center justify-center">
          <Bot className="h-5 w-5 text-[var(--gold)]" />
        </div>
        <div>
          <h1 className="page-title">{info.name}</h1>
          <p className="page-subtitle mt-1">{info.description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
            <span className="agent-status-label text-[var(--text-secondary)]">
              {status}
            </span>
          </div>
          {lastRunAt && (
            <p className="caption-sm">
              Last run: {new Date(lastRunAt).toLocaleString()}
            </p>
          )}
          {registry && (
            <div className="caption-sm space-y-1 text-[var(--text-muted)]">
              <p><span className="text-[var(--text-hint)]">Schedule:</span> {registry.schedule}</p>
              <p><span className="text-[var(--text-hint)]">Endpoint:</span> {registry.endpoint}</p>
            </div>
          )}
          <Button onClick={runAgent} disabled={pending} className="gap-2">
            <Play className="h-3 w-3" />
            {pending ? "Running..." : "Run Now"}
          </Button>
          {result && (
            <div className="space-y-1">
              <Badge variant={result.success ? "success" : "danger"}>
                {result.success ? "Completed" : result.error ?? "Failed"}
              </Badge>
              {result.success && agentId === "deal_scanner" && (
                <p className="caption-sm text-[var(--text-secondary)]">
                  Found {result.deals_found ?? 0} · Qualified{" "}
                  {result.deals_qualified ?? 0} · Inserted{" "}
                  {result.deals_inserted ?? 0}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
