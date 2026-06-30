import fs from "fs";

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

const env = { ...loadEnv(".env.local"), ...loadEnv(".env.vercel.tmp") };
const baseUrl = process.argv[2] ?? "https://sharlakian-holdings-os.vercel.app";

const headers = { "Content-Type": "application/json" };
if (env.CRON_SECRET) headers.Authorization = `Bearer ${env.CRON_SECRET}`;

console.log(`Scanning ${baseUrl}/api/agents/deal-scanner ...\n`);

const res = await fetch(`${baseUrl}/api/agents/deal-scanner`, {
  method: "POST",
  headers,
});

const data = await res.json();
if (!res.ok) {
  console.error("Failed:", data.error ?? res.statusText);
  process.exit(1);
}

console.log(
  `Found ${data.deals_found} · Qualified ${data.deals_qualified} · Inserted ${data.deals_inserted}`
);
console.log(`Mode: ${data.live_mode ? "live" : "mock"} · API calls: ${data.api_calls_used ?? "—"}`);
if (data.rentcast_auth_failures) console.log(`Auth failures: ${data.rentcast_auth_failures}`);
if (data.rentcast_last_error) console.log(`Last RentCast error: ${data.rentcast_last_error}`);
if (data.rate_limit_warning) console.log(`WARNING: ${data.rate_limit_warning}`);

for (const r of (data.scan_results ?? []).slice(0, 10)) {
  console.log(
    `${r.address} | $${r.price?.toLocaleString()} | score=${r.dealScore ?? "—"} | ADU=${r.aduExists} | ${r.qualified ? "QUALIFIED" : r.disqualifiedReason}`
  );
}

fs.writeFileSync(
  "scan-full.json",
  JSON.stringify(
    {
      summary: {
        deals_found: data.deals_found,
        deals_qualified: data.deals_qualified,
        deals_inserted: data.deals_inserted,
        api_calls_used: data.api_calls_used,
        live_mode: data.live_mode,
      },
      scan_results: data.scan_results,
    },
    null,
    2
  )
);

console.log("\nSaved scan-full.json");
