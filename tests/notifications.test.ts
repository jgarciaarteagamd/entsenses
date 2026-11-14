// E-mail notifications on patient submissions (trigger private.notify_patient_submission).
// pg_net does not exist in PGlite: a stand-in net.http_post records the calls instead.
import { beforeAll, describe, expect, it } from "vitest";
import { createDb, D1, D2 } from "./helpers/db";

let as: Awaited<ReturnType<typeof createDb>>["as"];
let db: Awaited<ReturnType<typeof createDb>>["db"];
beforeAll(async () => {
  ({ as, db } = await createDb());
});

const SECRET = "x".repeat(40);
const hearing = (doctor: string, source: string, seen: boolean, label: string | null = null) =>
  as(
    source === "patient" ? "anon" : "authenticated",
    source === "patient" ? null : doctor,
    `INSERT INTO public.audiometry_sessions (doctor_id, source, seen, label, calibrated, app_version, audiogram)
     VALUES ($1, $2, $3, $4, false, 'v', '{"right":{"1000":20}}')`,
    [doctor, source, seen, label],
  );
const quest = (doctor: string) =>
  as(
    "anon",
    null,
    `INSERT INTO public.patient_responses (doctor_id, questionnaire_slug, questionnaire_name, answers, total_score, category, seen, label, source)
     VALUES ($1, 'snot-22', 'SNOT-22', '{1,2,3}', 34, 'Moderado', false, null, 'patient')`,
    [doctor],
  );
const calls = async () => (await db.query<{ url: string; body: Record<string, unknown>; headers: Record<string, string> }>("SELECT * FROM net.calls ORDER BY n")).rows;

describe("submission notifications", () => {
  it("patient submissions still work without settings and without pg_net", async () => {
    expect((await hearing(D1, "patient", false)).ok).toBe(true);
    await db.exec(`INSERT INTO private.notification_settings (endpoint, secret) VALUES ('https://example.org/notify', '${SECRET}')`);
    expect((await hearing(D1, "patient", false)).ok).toBe(true);
  });

  it("settings and log are not readable by anon or doctors", async () => {
    expect((await as("anon", null, "SELECT * FROM private.notification_settings")).ok).toBe(false);
    expect((await as("authenticated", D1, "SELECT * FROM private.notification_settings")).ok).toBe(false);
    expect((await as("authenticated", D1, "SELECT * FROM private.notification_log")).ok).toBe(false);
  });

  it("queues one POST per patient submission, none for in-clinic results", async () => {
    await db.exec(`
      CREATE SCHEMA net;
      CREATE TABLE net.calls (n serial, url text, body jsonb, headers jsonb);
      CREATE FUNCTION net.http_post(url text, body jsonb, headers jsonb, timeout_milliseconds integer)
        RETURNS bigint LANGUAGE sql AS $$ INSERT INTO net.calls (url, body, headers) VALUES (url, body, headers) RETURNING n $$;
    `);
    expect((await hearing(D1, "patient", false)).ok).toBe(true);
    expect((await hearing(D1, "doctor", true, "JP")).ok).toBe(true);
    expect((await quest(D1)).ok).toBe(true);
    const c = await calls();
    expect(c).toHaveLength(2);
    expect(c[0].url).toBe("https://example.org/notify");
    expect(c[0].headers["x-notify-secret"]).toBe(SECRET);
    expect(c[0].body).toMatchObject({ to: "a@example.com", module: "hearing", lang: "es" });
    expect(c[1].body).toMatchObject({ module: "quest", detail: { questionnaire: "SNOT-22", score: 34, category: "Moderado" } });
  });

  it("respects the doctor's setting", async () => {
    await db.exec("TRUNCATE net.calls");
    expect((await as("authenticated", D2, `INSERT INTO public.doctor_profiles (id, notify_submissions) VALUES ('${D2}', false)
      ON CONFLICT (id) DO UPDATE SET notify_submissions = false`)).ok).toBe(true);
    expect((await hearing(D2, "patient", false)).ok).toBe(true);
    expect(await calls()).toHaveLength(0);
  });

  it("caps notifications at 30 per doctor and hour", async () => {
    await db.exec("TRUNCATE net.calls");
    for (let i = 0; i < 35; i++) await hearing(D1, "patient", false);
    // two were already sent to D1 in the previous test
    expect(await calls()).toHaveLength(28);
  });
});
