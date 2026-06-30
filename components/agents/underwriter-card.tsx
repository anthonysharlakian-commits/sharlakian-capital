"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Clock, Play } from "lucide-react";

interface UnderwriteResult {
  success?: boolean;
  error?: string;
  processed?: number;
  total?: number;
  results?: Array<{
    address: string;
    recommendation: string;
    reasoning: string;
    error?: string;
  }>;
}

interface UnderwriterCardProps {
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

export function UnderwriterCard({
  agentId,
  agentName,
  status: initialStatus,
  schedule,
  description,
}: UnderwriterCardProps) {
  const [status, setStatus] = useState(initialStatus);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<UnderwriteResult | null>(null);

  function runUnderwriting(e: React.MouseEvent) {
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
        const data = (await res.json()) as UnderwriteResult;
        setResult(data);
        setStatus(res.ok ? "idle" : "error");
      } catch {
        setResult({ error: "Underwriting request failed" });
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
            onClick={runUnderwriting}
            disabled={pending}
            className="gap-2 w-full"
          >
            <Play className="h-3 w-3" />
            {pending ? "Running..." : "Run Underwriting"}
          </Button>
          {result && (
            <div className="caption-sm text-[var(--text-secondary)] mt-2 space-y-1">
              {result.error ? (
                <p>{result.error}</p>
              ) : (
                <>
                  <p>
                    Processed {result.processed ?? 0} of {result.total ?? 0} deals
                  </p>
                  {result.results?.map((r, i) => (
                    <p key={i}>
                      {r.recommendation} — {r.address}
                      {r.error ? ` (${r.error})` : ""}
                    </p>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
