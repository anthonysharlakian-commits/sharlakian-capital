/**
 * Apply migration 010 — probe underwriting_reports table, print manual SQL if missing.
 * Usage: node scripts/apply-migration-010.mjs
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

const env = {
  ...loadEnv(".env.local"),
  ...loadEnv(".env.production.local"),
  ...loadEnv(".env.vercel.tmp"),
};
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error } = await sb.from("underwriting_reports").select("id").limit(1);

if (error?.message?.includes("does not exist") || error?.code === "42P01") {
  console.error(
    "underwriting_reports table missing. Run supabase/migrations/010_underwriting_reports.sql in Supabase SQL Editor."
  );
  console.error(error.message);
  process.exit(1);
}

console.log("Migration 010 OK — underwriting_reports table exists.");
