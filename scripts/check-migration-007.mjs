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
    const key = trimmed.slice(0, eq);
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = { ...loadEnv(".env.vercel.tmp") };
const sql = fs.readFileSync(
  "supabase/migrations/007_deal_scanner_fields.sql",
  "utf8"
);

const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("--"));

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase config");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Probe whether new columns exist
const { error: probeError } = await supabase
  .from("deals")
  .select("bedrooms, listing_url, status")
  .limit(1);

if (!probeError) {
  console.log("Migration 007 columns already present");
  process.exit(0);
}

console.log(
  "Migration 007 columns missing — apply SQL in Supabase SQL Editor:\n"
);
console.log(sql);
console.error("\nProbe error:", probeError.message);
process.exit(1);
