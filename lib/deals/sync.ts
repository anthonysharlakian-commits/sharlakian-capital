import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import type { Property, DealAnalysis } from "@/lib/types/database";

interface UpsertDealInput {
  property: Pick<Property, "id" | "address" | "type" | "list_price" | "status">;
  analysis?: Pick<DealAnalysis, "deal_score" | "cash_on_cash_return"> | null;
}

const PIPELINE_STATUSES = new Set([
  "scanning",
  "underwriting",
  "pending_approval",
  "approved",
]);

export async function upsertDealFromProperty({ property, analysis }: UpsertDealInput) {
  if (!hasSupabaseConfig()) return;
  if (!PIPELINE_STATUSES.has(property.status)) return;

  const supabase = createAdminClient();
  const coc = analysis?.cash_on_cash_return;
  const cocPct = coc != null ? (coc <= 1 ? coc * 100 : coc) : null;

  await supabase.from("deals").upsert(
    {
      property_id: property.id,
      address: property.address,
      property_type: property.type,
      list_price: property.list_price,
      coc_return: cocPct != null ? Number(cocPct.toFixed(1)) : null,
      ai_score: analysis?.deal_score ?? null,
    },
    { onConflict: "property_id" }
  );
}

export async function removeDealByPropertyId(propertyId: string) {
  if (!hasSupabaseConfig()) return;
  const supabase = createAdminClient();
  await supabase.from("deals").delete().eq("property_id", propertyId);
}
