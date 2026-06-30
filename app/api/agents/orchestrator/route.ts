import { NextResponse } from "next/server";
import { AGENT_REGISTRY } from "@/lib/agents/registry";
import { getAgentLogs, getAgents } from "@/lib/data/queries";

function getAppBaseUrl(request: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export async function GET() {
  const [logs, agents] = await Promise.all([getAgentLogs(50), getAgents()]);
  const errorCounts: Record<string, number> = {};

  for (const log of logs) {
    if (log.status === "error") {
      errorCounts[log.agent] = (errorCounts[log.agent] ?? 0) + 1;
    }
  }

  const health = Object.entries(AGENT_REGISTRY).map(([name, config]) => {
    const dbAgent = agents.find(
      (a) => a.agent_name.toLowerCase().replace(/ /g, "_") === name
    );
    return {
      agent: name,
      schedule: config.schedule,
      endpoint: config.endpoint,
      status: dbAgent?.status ?? ((errorCounts[name] ?? 0) >= 3 ? "error" : "idle"),
      last_run_at: dbAgent?.last_run_at ?? null,
      recent_errors: errorCounts[name] ?? 0,
    };
  });

  return NextResponse.json({ agents: health, registry: AGENT_REGISTRY });
}

export async function POST(request: Request) {
  const { agent } = await request.json();
  const config = AGENT_REGISTRY[agent as keyof typeof AGENT_REGISTRY];

  if (!config) {
    return NextResponse.json({ error: "Unknown agent" }, { status: 400 });
  }

  if (agent === "deal_scanner") {
    const { POST: runDealScanner } = await import("@/app/api/agents/deal-scanner/route");
    return runDealScanner(request);
  }

  if (agent === "underwriter") {
    const { POST: runUnderwriter } = await import("@/app/api/agents/underwriter/route");
    return runUnderwriter(request);
  }

  const baseUrl = getAppBaseUrl(request);
  const headers: HeadersInit = {};
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    headers.Authorization = `Bearer ${cronSecret}`;
  }

  try {
    const res = await fetch(`${baseUrl}${config.endpoint}`, {
      method: "POST",
      headers,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent request failed";
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
