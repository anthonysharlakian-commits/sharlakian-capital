"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Clock, Play } from "lucide-react";

interface ScanResult {
  success?: boolean;
  error?: string;
  deals_found?: number;
  deals_qualified?: number;
  deals_inserted?: number;
  mock_mode?: boolean;
  live_mode?: boolean;
  api_calls_used?: number;
  rate_limit_warning?: string;
}

interface DealScannerCardProps {
  agentId: string;
  agentName: string;
  status: string;
  schedule?: string;
  description?: string;
}

function statusColor(status: string): string {
  switch (status) {
    case "active":
      return "#00C97A";
    case "scanning":
      return "#C9A84C";
    case "error":
      return "#E05252";
    default:
      return "#3A5068";
  }
}

export function DealScannerCard({
  agentId,
  agentName,
  status: initialStatus,
  schedule,
  description,
}: DealScannerCardProps) {
  const [status, setStatus] = useState(initialStatus);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ScanResult | null>(null);

  function runScan(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setStatus("scanning");
    setResult(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/agents/orchestrator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agent: agentId }),
        });
        const data = (await res.json()) as ScanResult;
        setResult(data);
        setStatus(res.ok ? "idle" : "error");
      } catch {
        setResult({ error: "Scan request failed" });
        setStatus("error");
      }
    });
  }

  const dotColor = statusColor(status);

  return (
    <Card className="hover:border-[rgba(201,168,76,0.3)] transition-colors h-full">
      <CardContent className="p-4">
        <Link href={`/agents/${agentId}`} className="block">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-[2px] bg-[rgba(201,168,76,0.08)] flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-[var(--gold)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="body-text">{agentName}</p>
              {schedule && (
                <div className="flex items-center gap-1 mt-1 caption-sm">
                  <Clock className="h-3 w-3" />
                  {schedule}
                </div>
              )}
              {description && (
                <p className="caption-sm text-[var(--text-muted)] mt-2">
                  {description}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-3">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
                <span className="agent-status-label" style={{ color: dotColor }}>
                  {status}
                </span>
              </div>
            </div>
          </div>
        </Link>

        <div className="mt-4 pt-3 border-t border-[var(--border)]">
          <Button
            type="button"
            size="sm"
            onClick={runScan}
            disabled={pending}
            className="gap-2 w-full"
          >
            <Play className="h-3 w-3" />
            {pending ? "Scanning..." : "Run Scan"}
          </Button>
          {result && (
            <div className="caption-sm text-[var(--text-secondary)] mt-2 space-y-1">
              {result.error ? (
                <p>{result.error}</p>
              ) : (
                <>
                  <p>
                    {result.live_mode ? "Live" : "Mock"} · Found {result.deals_found ?? 0} ·
                    Qualified {result.deals_qualified ?? 0} · Inserted{" "}
                    {result.deals_inserted ?? 0}
                    {result.api_calls_used != null && result.api_calls_used > 0
                      ? ` · ${result.api_calls_used} API calls`
                      : ""}
                  </p>
                  {result.rate_limit_warning && (
                    <p className="text-[var(--red)]">{result.rate_limit_warning}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
