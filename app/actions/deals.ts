"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { logAgentAction } from "@/lib/claude";
import {
  updateMockProperty,
  addMockMaintenanceRequest,
  addMockAgentLog,
  updateMockAcquisitionCriteria,
} from "@/lib/mock-store";

export async function approveDeal(propertyId: string, notes?: string) {
  if (hasSupabaseConfig()) {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("properties")
      .update({ status: "approved", rejection_notes: notes || null })
      .eq("id", propertyId);
    if (error) throw new Error(error.message);
  } else {
    updateMockProperty(propertyId, { status: "approved", rejection_notes: notes || null });
    addMockAgentLog({
      agent: "orchestrator",
      action: "deal_approved",
      property_id: propertyId,
      input: { notes },
      output: null,
      tokens_used: null,
      status: "success",
    });
  }

  await logAgentAction("orchestrator", "deal_approved", {
    propertyId,
    input: { notes },
    status: "success",
  });

  revalidatePath("/deals");
  revalidatePath(`/deals/${propertyId}`);
  revalidatePath("/");
  return { success: true };
}

export async function rejectDeal(propertyId: string, notes?: string) {
  if (hasSupabaseConfig()) {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("properties")
      .update({ status: "dead", rejection_notes: notes || "Rejected by owner" })
      .eq("id", propertyId);
    if (error) throw new Error(error.message);
  } else {
    updateMockProperty(propertyId, {
      status: "dead",
      rejection_notes: notes || "Rejected by owner",
    });
    addMockAgentLog({
      agent: "orchestrator",
      action: "deal_rejected",
      property_id: propertyId,
      input: { notes },
      output: null,
      tokens_used: null,
      status: "success",
    });
  }

  await logAgentAction("orchestrator", "deal_rejected", {
    propertyId,
    input: { notes },
    status: "success",
  });

  revalidatePath("/deals");
  revalidatePath(`/deals/${propertyId}`);
  return { success: true };
}

export async function updateAcquisitionCriteria(criteria: {
  min_price: number;
  max_price: number;
  min_cap_rate: number;
  min_coc_return: number;
  max_vacancy_rate: number;
  min_deal_score: number;
}) {
  if (hasSupabaseConfig()) {
    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("acquisition_criteria")
      .select("id")
      .limit(1)
      .single();

    if (existing) {
      await supabase
        .from("acquisition_criteria")
        .update({ ...criteria, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }
  } else {
    updateMockAcquisitionCriteria(criteria);
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function submitMaintenanceRequest(data: {
  property_id: string;
  tenant_id?: string;
  title: string;
  description: string;
  unit?: string;
}) {
  let requestId: string;

  if (hasSupabaseConfig()) {
    const supabase = createAdminClient();
    const { data: request, error } = await supabase
      .from("maintenance_requests")
      .insert({
        property_id: data.property_id,
        tenant_id: data.tenant_id ?? null,
        title: data.title,
        description: data.description,
        unit: data.unit ?? null,
        status: "open",
        priority: "medium",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    requestId = request.id;
  } else {
    const request = addMockMaintenanceRequest({
      property_id: data.property_id,
      tenant_id: data.tenant_id ?? null,
      unit: data.unit ?? null,
      title: data.title,
      description: data.description,
      priority: "medium",
      status: "open",
      contractor_id: null,
      estimated_cost: null,
      actual_cost: null,
      ai_diagnosis: null,
      ai_contractor_recommendation: null,
      completed_at: null,
    });
    requestId = request.id;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  fetch(`${baseUrl}/api/agents/maintenance-router`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId }),
  }).catch(() => {});

  revalidatePath("/maintenance");
  return { success: true, id: requestId };
}

export async function screenTenantApplication(data: {
  property_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  monthly_rent: number;
  application: Record<string, unknown>;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/agents/tenant-screener`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  revalidatePath("/tenants");
  return result;
}
