// In-memory Postgres (PGlite) with a minimal Supabase-like `auth` schema and every migration
// applied in order. Shared by the RLS tests of all modules.
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const D1 = "11111111-1111-1111-1111-111111111111";
export const D2 = "22222222-2222-2222-2222-222222222222";
export const UNKNOWN = "33333333-3333-3333-3333-333333333333";

export const MIGRATIONS_DIR = join(__dirname, "..", "..", "supabase", "migrations");
export const migrationFiles = () => readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();

export async function createDb() {
  const db = new PGlite();
  await db.exec(`
    REVOKE ALL ON SCHEMA public FROM PUBLIC; -- no implicit access: the migrations must grant it
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}'::jsonb);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
      AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT '{}'::jsonb $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_user::text $$;
    GRANT USAGE ON SCHEMA auth TO anon, authenticated;
    CREATE PUBLICATION supabase_realtime;
  `);
  for (const f of migrationFiles()) {
    try {
      await db.exec(readFileSync(join(MIGRATIONS_DIR, f), "utf8"));
    } catch (e) {
      throw new Error(`migration ${f} failed: ${(e as Error).message}`);
    }
  }
  await db.exec(`INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
    ('${D1}', 'a@example.com', '{"first_name":"Ana","license_number":"1"}'),
    ('${D2}', 'b@example.com', '{}');`);

  async function as(role: "anon" | "authenticated", sub: string | null, sql: string, params: unknown[] = []) {
    await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub', '${sub ?? ""}', false); SET ROLE ${role};`);
    try {
      const r = await db.query<Record<string, unknown>>(sql, params);
      return { ok: true as const, rows: r.rows, error: "" };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message, rows: [] as Record<string, unknown>[] };
    } finally {
      await db.exec("RESET ROLE;");
    }
  }
  return { db, as };
}
