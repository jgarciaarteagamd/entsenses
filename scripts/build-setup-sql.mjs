// Concatenates every migration (in order) into supabase/setup.sql, so a new Supabase project can
// be set up by pasting ONE file into the SQL Editor. Run: npm run db:setup
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const parts = files.map((f) => `-- ===== ${f} =====\n${readFileSync(join(dir, f), "utf8").trim()}\n`);
const out =
  "-- ENT Senses — complete database setup for a NEW Supabase project.\n" +
  "-- Generated from supabase/migrations by `npm run db:setup`. Do not edit by hand.\n" +
  "-- Paste the whole file into Supabase → SQL Editor → New query → Run (once).\n\n" +
  parts.join("\n");
writeFileSync(join(root, "supabase", "setup.sql"), out);
console.log(`supabase/setup.sql: ${files.length} migrations`);
