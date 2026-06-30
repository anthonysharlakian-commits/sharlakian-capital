import type { AcquisitionCriteria } from "@/lib/types/database";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { DEFAULT_ACQUISITION_CRITERIA } from "@/lib/constants/acquisition-defaults";

export { DEFAULT_ACQUISITION_CRITERIA };

export async function getAcquisitionCriteria(): Promise<AcquisitionCriteria | null> {
  if (!hasSupabaseConfig()) return null;

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("acquisition_criteria")
      .select("*")
      .limit(1)
      .single();

    if (error || !data) return null;
    return data as AcquisitionCriteria;
  } catch {
    return null;
  }
}
