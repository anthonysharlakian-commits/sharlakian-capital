import type { AcquisitionCriteria } from "@/lib/types/database";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { DEFAULT_ACQUISITION_CRITERIA } from "@/lib/constants/acquisition-defaults";

export { DEFAULT_ACQUISITION_CRITERIA };

export async function getAcquisitionCriteria(): Promise<AcquisitionCriteria> {
  if (!hasSupabaseConfig()) {
    const { getMockStore } = await import("@/lib/mock-store");
    return getMockStore().acquisitionCriteria;
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("acquisition_criteria")
      .select("*")
      .limit(1)
      .single();

    if (data) return data as AcquisitionCriteria;
  } catch {
    // fall through
  }
  return DEFAULT_ACQUISITION_CRITERIA;
}
