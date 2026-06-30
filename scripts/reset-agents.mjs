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
  console.error("Missing Supabase config — run: npx vercel env pull .env.vercel.tmp --yes");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error: deleteError } = await supabase.from("agents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
if (deleteError) {
  console.error("DELETE failed:", deleteError.message);
  process.exit(1);
}

const agents = [
  { agent_name: "Deal Scanner", status: "idle" },
  { agent_name: "Underwriter", status: "idle" },
  { agent_name: "Market Intel", status: "idle" },
  { agent_name: "Tenant Screener", status: "idle" },
  { agent_name: "Refi Monitor", status: "idle" },
];

const { data, error: insertError } = await supabase.from("agents").insert(agents).select();
if (insertError) {
  console.error("INSERT failed:", insertError.message);
  process.exit(1);
}

console.log("Agents reset:", data?.length ?? 0);
for (const a of data ?? []) {
  console.log(`  - ${a.agent_name}: ${a.status}`);
}
