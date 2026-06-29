import { NextResponse } from "next/server";
import { AGENT_REGISTRY } from "@/lib/agents/registry";
import { getAgentLogs } from "@/lib/data/queries";

export async function GET() {
  const logs = await getAgentLogs(50);
  const errorCounts: Record<string, number> = {};

  for (const log of logs) {
    if (log.status === "error") {
      errorCounts[log.agent] = (errorCounts[log.agent] ?? 0) + 1;
    }
  }

  const health = Object.entries(AGENT_REGISTRY).map(([name, config]) => ({
    agent: name,
    schedule: config.schedule,
    endpoint: config.endpoint,
    status: (errorCounts[name] ?? 0) >= 3 ? "degraded" : "healthy",
    recent_errors: errorCounts[name] ?? 0,
  }));

  return NextResponse.json({ agents: health, registry: AGENT_REGISTRY });
}

export async function POST(request: Request) {
  const { agent } = await request.json();
  const config = AGENT_REGISTRY[agent as keyof typeof AGENT_REGISTRY];

  if (!config) {
    return NextResponse.json({ error: "Unknown agent" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}${config.endpoint}`, { method: "POST" });
  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}
