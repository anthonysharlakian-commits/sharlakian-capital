import fs from "fs";

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

const baseUrl =
  process.argv[2] ??
  env.MOCK_SCAN_URL ??
  "https://sharlakian-holdings-os.vercel.app";
const cronSecret = env.CRON_SECRET;

const headers = { "Content-Type": "application/json" };
if (cronSecret) {
  headers.Authorization = `Bearer ${cronSecret}`;
}

console.log(`Running mock deal scan against ${baseUrl}/api/agents/deal-scanner ...\n`);

const res = await fetch(`${baseUrl}/api/agents/deal-scanner`, {
  method: "POST",
  headers,
});

const data = await res.json();

if (!res.ok) {
  console.error("Scan failed:", data.error ?? res.statusText);
  process.exit(1);
}

console.log(
  `Found ${data.deals_found} · Qualified ${data.deals_qualified} · Inserted ${data.deals_inserted}`
);
console.log(`Mode: ${data.live_mode ? "live RentCast" : "mock"}`);
if (data.api_calls_used) console.log(`API calls: ${data.api_calls_used}`);
if (data.rate_limit_warning) console.log(`WARNING: ${data.rate_limit_warning}`);

if (data.scan_results?.length) {
  console.log("Listing".padEnd(28), "Price".padStart(8), "Score".padStart(6), "Qualified", "Reason");
  console.log("-".repeat(90));
  for (const r of data.scan_results) {
    const label = `${r.city} ${r.zip}`.slice(0, 27);
    const price = `$${(r.price / 1000).toFixed(0)}K`;
    const score = r.dealScore != null ? String(r.dealScore) : "—";
    const qual = r.qualified ? "YES" : "NO";
    const reason = r.disqualifiedReason ?? (r.inserted ? "inserted" : "");
    console.log(
      label.padEnd(28),
      price.padStart(8),
      score.padStart(6),
      qual.padStart(9),
      reason
    );
  }
}

console.log("\nFull scoring breakdown saved to agent_logs (deal_scanner / scan_completed).");
