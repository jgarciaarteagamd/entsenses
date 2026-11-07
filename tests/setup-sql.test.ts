// supabase/setup.sql (the one-file setup for a new project) must match the migrations and apply
// cleanly to an empty database.
import { describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MIGRATIONS_DIR, migrationFiles } from "./helpers/db";

const setup = readFileSync(join(MIGRATIONS_DIR, "..", "setup.sql"), "utf8");

describe("supabase/setup.sql", () => {
  it("contains every migration (run `npm run db:setup` after adding one)", () => {
    for (const f of migrationFiles()) {
      expect(setup).toContain(`-- ===== ${f} =====\n${readFileSync(join(MIGRATIONS_DIR, f), "utf8").trim()}\n`);
    }
  });
  it("applies to an empty database", async () => {
    const db = new PGlite();
    await db.exec(`
      CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}'::jsonb);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
      CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT '{}'::jsonb $$;
      CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_user::text $$;
      CREATE PUBLICATION supabase_realtime;
    `);
    await expect(db.exec(setup)).resolves.toBeDefined();
  });
});
