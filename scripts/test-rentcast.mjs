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

const env = { ...loadEnv(".env.vercel.tmp"), ...loadEnv(".env.local") };
const key = env.RENTCAST_API_KEY;
if (!key) {
  console.error("No RENTCAST_API_KEY");
  process.exit(1);
}

const zip = process.argv[2] ?? "91321";
const url = new URL("https://api.rentcast.io/v1/listings/sale");
url.searchParams.set("zipCode", zip);
url.searchParams.set("propertyType", "Single Family");
url.searchParams.set("status", "Active");
url.searchParams.set("price", "300000:530000");
url.searchParams.set("limit", "10");

const res = await fetch(url, { headers: { "X-Api-Key": key } });
console.log("HTTP", res.status);
const data = await res.json();
if (!res.ok) {
  console.log("Error body:", JSON.stringify(data).slice(0, 500));
  process.exit(1);
}

const list = Array.isArray(data) ? data : data.listings ?? [];
console.log("Listings returned:", list.length);
if (list[0]) {
  const s = list[0];
  console.log("Sample:", s.formattedAddress ?? s.addressLine1, "$" + s.price);
  console.log("Fields:", Object.keys(s).join(", "));
  const text = (s.remarks ?? s.description ?? "").toLowerCase();
  console.log("Has ADU keyword:", /adu|guest house|in-law|casita/.test(text));
  console.log("Remarks preview:", (s.remarks ?? s.description ?? "(none)").slice(0, 120));
}
