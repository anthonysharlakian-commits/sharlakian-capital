#!/usr/bin/env node
/**
 * Setup checklist — run after cloning: node scripts/setup-check.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");
const envExample = path.join(root, ".env.example");

console.log("\n🏠 Sharlakian Holdings OS — Setup Check\n");

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envPath);
    console.log("✓ Created .env.local from .env.example");
  }
} else {
  console.log("✓ .env.local exists");
}

const env = fs.readFileSync(envPath, "utf8");
const keys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
];

let configured = 0;
for (const key of keys) {
  const match = env.match(new RegExp(`^${key}=(.+)$`, "m"));
  const value = match?.[1]?.trim();
  if (value) {
    console.log(`✓ ${key} is set`);
    configured++;
  } else {
    console.log(`○ ${key} — not set (optional for mock mode)`);
  }
}

console.log("\n--- Next Steps ---\n");
console.log("1. Create Supabase project: https://supabase.com/dashboard");
console.log("2. Run SQL migrations in order:");
console.log("   - supabase/migrations/001_initial_schema.sql");
console.log("   - supabase/migrations/002_seed_data.sql (optional demo data)");
console.log("   - supabase/migrations/003_dashboard_schema.sql (dashboard tables)");
console.log("3. Copy Project URL + anon key + service role key → .env.local");
console.log("4. Add ANTHROPIC_API_KEY for AI agents");
console.log("5. npm run dev → http://localhost:3000");
console.log("\nWithout Supabase keys, the app runs in mock/demo mode.\n");

if (configured >= 3) {
  console.log("Status: Ready for live data ✓\n");
} else {
  console.log("Status: Demo mode (mock data) — add Supabase keys for production\n");
}
