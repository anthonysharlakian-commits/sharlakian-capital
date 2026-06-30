import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseConfig } from "@/lib/supabase/config";

const TABLES = [
  "deals",
  "maintenance_requests",
  "monthly_cashflow_log",
  "properties",
] as const;

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  }

  const supabase = createAdminClient();
  const results: Record<string, number> = {};

  for (const table of TABLES) {
    const { count: before } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    const { error } = await supabase
      .from(table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      return NextResponse.json(
        { error: `${table}: ${error.message}` },
        { status: 500 }
      );
    }
    results[table] = before ?? 0;
  }

  return NextResponse.json({ cleared: results });
}
