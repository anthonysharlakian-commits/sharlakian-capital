import { hasSupabaseConfig } from "@/lib/supabase/config";

export function verifyCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // open in dev when no secret set

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export function isDemoMode() {
  return !hasSupabaseConfig();
}
