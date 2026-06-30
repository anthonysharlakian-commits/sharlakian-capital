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

const env = {
  ...loadEnv(".env.local"),
  ...loadEnv(".env.vercel.tmp"),
};

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase config");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run006() {
  console.log("=== 006_liquid_capital_and_cleanup ===");
  for (const table of [
    "deals",
    "maintenance_requests",
    "monthly_cashflow_log",
    "properties",
  ]) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(`${table} delete: ${error.message}`);
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    console.log(`${table}: ${count ?? 0} rows remaining`);
  }

  const { error: settingsError } = await supabase.from("settings").upsert(
    { key: "liquid_capital", value: "30000" },
    { onConflict: "key" }
  );
  if (settingsError) {
    throw new Error(`liquid_capital upsert: ${settingsError.message}`);
  }

  const { data, error: readError } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "liquid_capital")
    .single();
  if (readError) throw new Error(`liquid_capital read: ${readError.message}`);
  console.log(`liquid_capital set to: ${data.value}`);
}

async function run005() {
  console.log("\n=== 005_rls_hardening ===");
  console.log(
    "RLS DDL must be run in Supabase SQL Editor if policies need updating."
  );
  console.log("Verifying anon is blocked...");
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const anon = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await anon
    .from("settings")
    .select("value")
    .eq("key", "liquid_capital");
  if (error) {
    console.log("anon blocked:", error.message);
    return;
  }
  if (!data?.length) {
    console.log("anon returned no rows — RLS active");
    return;
  }
  throw new Error("anon can read settings — run 005 in SQL Editor");
}

const step = process.argv[2] ?? "all";

try {
  if (step === "006" || step === "all") await run006();
  if (step === "005" || step === "all") await run005();
  console.log("\nDone.");
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
