/**
 * Batch underwriter test — resets qualified deals to status=new, runs analysis, prints results.
 * Usage: node --import tsx scripts/run-underwriter-test.mjs
 */
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { analyzeDeal } from "../lib/underwriter/index.ts";
import { DEAL_SCANNER_CRITERIA } from "../lib/deal-scanner/criteria.ts";

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

const { error: tableError } = await sb.from("underwriting_reports").select("id").limit(1);
if (tableError) {
  console.error("underwriting_reports table missing — run migration 010 first");
  console.error(tableError.message);
  process.exit(1);
}

const { data: deals, error } = await sb
  .from("deals")
  .select("*")
  .gte("ai_score", DEAL_SCANNER_CRITERIA.minDealScore)
  .order("ai_score", { ascending: false });

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(`Found ${deals?.length ?? 0} qualified deals (score >= ${DEAL_SCANNER_CRITERIA.minDealScore})`);

await sb
  .from("underwriting_reports")
  .delete()
  .in(
    "deal_id",
    (deals ?? []).map((d) => d.id)
  );

for (const deal of deals ?? []) {
  await sb.from("deals").update({ status: "new" }).eq("id", deal.id);
}

const results = [];
for (const deal of deals ?? []) {
  const analysis = analyzeDeal(deal);
  const { error: insertError } = await sb.from("underwriting_reports").insert({
    deal_id: deal.id,
    stress_test_results: analysis.stress_test_results,
    risk_flags: analysis.risk_flags,
    recommendation: analysis.recommendation,
    reasoning: analysis.reasoning,
  });

  if (!insertError) {
    await sb.from("deals").update({ status: "underwritten" }).eq("id", deal.id);
  }

  results.push({
    address: deal.address,
    score: deal.ai_score,
    recommendation: analysis.recommendation,
    reasoning: analysis.reasoning.split(".")[0],
    error: insertError?.message,
  });
}

console.log("\n=== Underwriter Results ===");
for (const r of results) {
  console.log(
    `${r.recommendation} | ${r.address} (score ${r.score}) — ${r.reasoning}${r.error ? ` [ERR: ${r.error}]` : ""}`
  );
}
