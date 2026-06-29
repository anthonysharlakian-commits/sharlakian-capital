import { createClient } from "@supabase/supabase-js";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export function createAdminClient() {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase is not configured. Add keys to .env.local");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
