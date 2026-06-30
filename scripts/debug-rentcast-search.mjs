import fs from "fs";

function loadEnv(path) {
  const env = {};
  if (!fs.existsSync(path)) return env;
  for (const line of fs.readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = { ...loadEnv(".env.local"), ...loadEnv(".env"), ...loadEnv(".env.vercel.tmp") };
const key = env.RENTCAST_API_KEY;
if (!key) {
  console.error("RENTCAST_API_KEY not set");
  process.exit(1);
}

const zips = ["91321", "91351", "92335", "92336", "92376", "91762", "91764", "91730", "91739"];
let total = 0;

for (const zip of zips) {
  const url = new URL("https://api.rentcast.io/v1/listings/sale");
  url.searchParams.set("zipCode", zip);
  url.searchParams.set("propertyType", "Single Family");
  url.searchParams.set("status", "Active");
  url.searchParams.set("price", "300000:530000");
  url.searchParams.set("limit", "50");

  const res = await fetch(url, {
    headers: { "X-Api-Key": key, Accept: "application/json" },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  const list = Array.isArray(data) ? data : data?.listings ?? [];
  console.log(`${zip} status=${res.status} count=${list.length}`);
  if (!res.ok) console.log(`  error: ${text.slice(0, 100)}`);
  if (list.length) {
    const s = list[0];
    console.log(`  sample: ${s.formattedAddress ?? s.addressLine1} $${s.price}`);
    const desc = [s.remarks, s.description].filter(Boolean).join(" ").slice(0, 120);
    if (desc) console.log(`  desc: ${desc}...`);
  }
  total += list.length;
}

console.log(`TOTAL: ${total}`);
