/**
 * Apply migration 009 via Supabase service role (runs ALTER TABLE statements).
 * Usage: node scripts/apply-migration-009.mjs
 */
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path) {
  const env = {};
  if (!fs.existsSync(path)) return env;
  for (const line of fs.readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[trimmed.slice(0, eq)] = val;
  }
  return env;
}

const env = { ...loadEnv(".env.local"), ...loadEnv(".env.production.local") };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase env. Add keys to .env.local or .env.production.local");
  process.exit(1);
}

const sql = fs.readFileSync("supabase/migrations/009_confidence_and_sources.sql", "utf8");
const sb = createClient(url, key);

const { error } = await sb.rpc("exec_sql", { query: sql }).maybeSingle?.() ?? { error: null };

if (error) {
  // Fallback: probe columns by selecting — user runs SQL manually if needed
  const { error: probeError } = await sb
    .from("deals")
    .select("confidence_level, data_sources")
    .limit(1);
  if (probeError?.message?.includes("column")) {
    console.error(
      "Migration 009 columns missing. Run supabase/migrations/009_confidence_and_sources.sql in Supabase SQL Editor."
    );
    console.error(probeError.message);
    process.exit(1);
  }
  console.log("Columns already present or migration applied.");
} else {
  console.log("Migration 009 applied.");
}
