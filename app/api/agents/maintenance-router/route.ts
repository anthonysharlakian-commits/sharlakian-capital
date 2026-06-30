import { NextResponse } from "next/server";
import { callClaude, logAgentAction } from "@/lib/claude";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import {
  notifyOwner,
  sendSMS,
  isEmergencyIssue,
  formatEmergencyMaintenance,
} from "@/lib/twilio";
import {
  getMockMaintenanceRequest,
  updateMockMaintenanceRequest,
  getMockStore,
  addMockAgentLog,
} from "@/lib/mock-store";
import { setAgentStatus } from "@/lib/agents/status";

interface DiagnosisResult {
  trade: string;
  priority: "emergency" | "high" | "medium" | "low";
  estimated_cost_min: number;
  estimated_cost_max: number;
  diagnosis: string;
  recommended_fix: string;
}

function ruleBasedDiagnosis(title: string, description: string, isEmergency: boolean): DiagnosisResult {
  const lower = `${title} ${description}`.toLowerCase();
  let trade = "general";
  if (/ac|heat|hvac|cool|furnace/.test(lower)) trade = "hvac";
  else if (/plumb|faucet|pipe|toilet|drain|leak/.test(lower)) trade = "plumbing";
  else if (/electric|power|outlet|breaker/.test(lower)) trade = "electrical";

  return {
    trade,
    priority: isEmergency ? "emergency" : /ac|heat/.test(lower) ? "high" : "medium",
    estimated_cost_min: 100,
    estimated_cost_max: 500,
    diagnosis: `Rule-based diagnosis: ${trade} issue detected from request description.`,
    recommended_fix: "Schedule contractor inspection and repair.",
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  const requestId = body.requestId;

  if (!requestId) {
    return NextResponse.json({ error: "requestId required" }, { status: 400 });
  }

  await setAgentStatus("maintenance_router", "scanning");

  try {
    let maintRequest: {
      id: string;
      property_id: string;
      title: string | null;
      description: string | null;
      address?: string;
    } | null = null;

    if (hasSupabaseConfig()) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("maintenance_requests")
        .select("*, properties(address, city)")
        .eq("id", requestId)
        .single();

      if (data) {
        const prop = data.properties as { address: string } | null;
        maintRequest = { ...data, address: prop?.address };
      }
    } else {
      const mock = getMockMaintenanceRequest(requestId);
      if (mock) {
        const property = getMockStore().properties.find((p) => p.id === mock.property_id);
        maintRequest = {
          id: mock.id,
          property_id: mock.property_id,
          title: mock.title,
          description: mock.description,
          address: property?.address,
        };
      }
    }

    if (!maintRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isEmergency = isEmergencyIssue(maintRequest.description ?? "");

    let diagnosis: DiagnosisResult;
    let tokensUsed = 0;

    if (process.env.ANTHROPIC_API_KEY) {
      const result = await callClaude<DiagnosisResult>(
        `Diagnose this maintenance issue for a rental property.
      
Issue: ${maintRequest.title}
Description: ${maintRequest.description}
${isEmergency ? "NOTE: This may be an EMERGENCY based on keywords." : ""}

Return JSON: {
  "trade": "plumbing"|"electrical"|"hvac"|"general"|"roofing"|"landscaping",
  "priority": "emergency"|"high"|"medium"|"low",
  "estimated_cost_min": number,
  "estimated_cost_max": number,
  "diagnosis": string,
  "recommended_fix": string
}`,
        { maxTokens: 600 }
      );
      tokensUsed = result.tokensUsed;
      if (!result.data) throw new Error(result.error ?? "Diagnosis failed");
      diagnosis = result.data;
    } else {
      diagnosis = ruleBasedDiagnosis(
        maintRequest.title ?? "",
        maintRequest.description ?? "",
        isEmergency
      );
    }

    const priority = isEmergency ? "emergency" : diagnosis.priority;
    const estimatedCost = (diagnosis.estimated_cost_min + diagnosis.estimated_cost_max) / 2;
    const contractorName = diagnosis.trade === "hvac" ? "High Desert HVAC" : "Desert Pro Plumbing";

    if (hasSupabaseConfig()) {
      const supabase = createAdminClient();
      const { data: contractors } = await supabase
        .from("contractors")
        .select("*")
        .eq("trade", diagnosis.trade)
        .order("rating", { ascending: false })
        .limit(1);

      const contractor = contractors?.[0];

      await supabase
        .from("maintenance_requests")
        .update({
          priority,
          status: contractor ? "assigned" : "open",
          contractor_id: contractor?.id ?? null,
          estimated_cost: estimatedCost,
          ai_diagnosis: diagnosis.diagnosis,
          ai_contractor_recommendation: contractor
            ? `${contractor.name} — ${contractor.rating} rating`
            : "No contractor available",
        })
        .eq("id", requestId);

      if (contractor?.phone) {
        await sendSMS(
          contractor.phone,
          `🔧 NEW JOB: ${maintRequest.title}\n${maintRequest.description}\nPriority: ${priority}`
        );
      }
    } else {
      updateMockMaintenanceRequest(requestId, {
        priority,
        status: "assigned",
        estimated_cost: estimatedCost,
        ai_diagnosis: diagnosis.diagnosis,
        ai_contractor_recommendation: `${contractorName} — recommended for ${diagnosis.trade}`,
      });
      addMockAgentLog({
        agent: "maintenance_router",
        action: "request_routed",
        property_id: maintRequest.property_id,
        input: { requestId, priority },
        output: { contractor: contractorName, diagnosis: diagnosis.diagnosis },
        tokens_used: tokensUsed,
        status: "success",
      });
    }

    if (priority === "emergency") {
      await notifyOwner(
        formatEmergencyMaintenance({
          address: maintRequest.address ?? "Unknown",
          title: maintRequest.title ?? "Emergency",
          description: maintRequest.description ?? "",
        })
      );
    }

    await logAgentAction("maintenance_router", "request_routed", {
      propertyId: maintRequest.property_id,
      input: { requestId, priority },
      output: { contractor: contractorName, diagnosis: diagnosis.diagnosis },
      tokensUsed,
      status: "success",
    });

    await setAgentStatus("maintenance_router", "active");
    return NextResponse.json({ success: true, diagnosis, contractor: contractorName });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await setAgentStatus("maintenance_router", "error");
    await logAgentAction("maintenance_router", "routing_failed", {
      input: { requestId },
      output: { error: message },
      status: "error",
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
