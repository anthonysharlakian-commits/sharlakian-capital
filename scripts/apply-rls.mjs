import fs from "fs";

const sqlPath = "supabase/migrations/005_rls_hardening.sql";
const sql = fs.readFileSync(sqlPath, "utf8");

console.log("Apply this SQL in the Supabase SQL Editor:");
console.log("https://supabase.com/dashboard/project/wqhrakrfrdxehiaindpq/sql/new\n");
console.log(sql);
