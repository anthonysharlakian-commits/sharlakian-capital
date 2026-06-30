import { NextResponse } from "next/server";
import { logAgentAction } from "@/lib/claude";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { notifyOwner, formatRefiOpportunity } from "@/lib/twilio";
import { verifyCronAuth, unauthorizedResponse } from "@/lib/auth/cron";
import { getMockStore, addMockAgentLog } from "@/lib/mock-store";
import { setAgentStatus } from "@/lib/agents/status";
import type { Property } from "@/lib/types/database";

async function runMonitor(properties: Property[]) {
  let opportunities = 0;

  for (const property of properties) {
    const currentValue = property.current_value ?? 0;
    const mortgageBalance = property.mortgage_balance ?? 0;
    if (currentValue <= 0) continue;

    const currentLTV = mortgageBalance / currentValue;
    const equity = currentValue - mortgageBalance;
    const equityPct = equity / currentValue;

    if (currentLTV <= 0.7) {
      opportunities++;
      const cashOutAvailable = currentValue * 0.75 - mortgageBalance;

      await notifyOwner(
        formatRefiOpportunity({
          address: property.address,
          equityPct,
          cashAvailable: cashOutAvailable,
        })
      );

      await logAgentAction("refi_monitor", "refi_opportunity_detected", {
        propertyId: property.id,
        output: { ltv: currentLTV, cash_out: cashOutAvailable },
        status: "success",
      });
    }

    if (equityPct >= 0.25) {
      await logAgentAction("refi_monitor", "heloc_eligible", {
        propertyId: property.id,
        output: { equity_pct: equityPct },
        status: "success",
      });
    }
  }

  return opportunities;
}

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) return unauthorizedResponse();

  if (!verifyCronAuth(request)) return unauthorizedResponse();

  await setAgentStatus("refi_monitor", "scanning");

  try {
    let properties: Property[] = [];

    if (hasSupabaseConfig()) {
      const supabase = createAdminClient();
      const { data } = await supabase.from("properties").select("*").in("status", ["active", "owned"]);
      properties = (data as Property[]) ?? [];
    } else {
      properties = getMockStore().properties.filter((p) => p.status === "active" || p.status === "owned");
    }

    const opportunities = await runMonitor(properties);

    if (!hasSupabaseConfig()) {
      addMockAgentLog({
        agent: "refi_monitor",
        action: "monitor_completed",
        property_id: null,
        input: null,
        output: { opportunities, checked: properties.length },
        tokens_used: null,
        status: "success",
      });
    }

    await setAgentStatus("refi_monitor", "idle");
    return NextResponse.json({
      success: true,
      opportunities_checked: properties.length,
      opportunities,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await setAgentStatus("refi_monitor", "error");
    await logAgentAction("refi_monitor", "monitor_failed", {
      output: { error: message },
      status: "error",
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
