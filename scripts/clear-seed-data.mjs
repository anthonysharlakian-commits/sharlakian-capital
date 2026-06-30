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
    let val = trimmed.slice(eq + 1);
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

const env = { ...loadEnv(".env.local"), ...loadEnv(".env.production.local") };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase config");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function clearTable(name) {
  const { count: before } = await supabase
    .from(name)
    .select("*", { count: "exact", head: true });
  const { error } = await supabase
    .from(name)
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  const { count: after } = await supabase
    .from(name)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`${name}: ${error.message}`);
  console.log(
    `${name}: deleted ${before ?? 0} rows, remaining ${after ?? 0}`
  );
}

for (const table of [
  "deals",
  "maintenance_requests",
  "monthly_cashflow_log",
  "properties",
]) {
  await clearTable(table);
}

for (const table of [
  "properties",
  "deals",
  "maintenance_requests",
  "monthly_cashflow_log",
  "agents",
  "settings",
]) {
  const { count } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  console.log(`verify ${table}: ${count}`);
}
