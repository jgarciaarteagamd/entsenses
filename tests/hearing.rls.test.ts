// ENT Senses Hearing — Row Level Security rules (shared in-memory database).
import { beforeAll, describe, expect, it } from "vitest";
import { createDb, D1, D2, UNKNOWN } from "./helpers/db";

let as: Awaited<ReturnType<typeof createDb>>["as"];
let db: Awaited<ReturnType<typeof createDb>>["db"];
beforeAll(async () => {
  ({ as, db } = await createDb());
});
// $1 source, $2 seen, $3 label, $4 report, $5 calibrated
const insert = (doctor: string) =>
  `INSERT INTO public.audiometry_sessions (doctor_id, source, seen, label, report, calibrated, app_version, audiogram)
   VALUES ('${doctor}', $1, $2, $3, $4, $5, 'entsenses-hearing-0.2.0', '{"right":{"1000":20}}')`;


describe("audiometry_sessions RLS", () => {
  it("anonymous patient can submit a valid row for an existing doctor", async () => {
    expect((await as("anon", null, insert(D1), ["patient", false, null, null, false])).ok).toBe(true);
  });
  it("anonymous inserts with wrong doctor / label / source / seen / report / calibrated are rejected", async () => {
    expect((await as("anon", null, insert(UNKNOWN), ["patient", false, null, null, false])).ok).toBe(false);
    expect((await as("anon", null, insert(D1), ["patient", false, "JP", null, false])).ok).toBe(false);
    expect((await as("anon", null, insert(D1), ["doctor", false, null, null, false])).ok).toBe(false);
    expect((await as("anon", null, insert(D1), ["patient", true, null, null, false])).ok).toBe(false);
    expect((await as("anon", null, insert(D1), ["patient", false, null, '{"diagnosis":"x"}', false])).ok).toBe(false);
    expect((await as("anon", null, insert(D1), ["patient", false, null, null, true])).ok).toBe(false);
  });
  it("anonymous users cannot read results; oversized payloads are rejected", async () => {
    expect((await as("anon", null, "SELECT * FROM public.audiometry_sessions")).ok).toBe(false);
    const big = await as(
      "anon",
      null,
      `INSERT INTO public.audiometry_sessions (doctor_id, app_version, audiogram)
       VALUES ('${D1}', 'v', jsonb_build_object('x', repeat('a', 25000)))`,
    );
    expect(big.ok).toBe(false);
  });
  it("doctors insert/read only their own rows", async () => {
    expect((await as("authenticated", D1, insert(D1), ["doctor", true, "JP", '{"diagnosis":"normal"}', true])).ok).toBe(true);
    expect((await as("authenticated", D1, insert(D2), ["doctor", true, null, null, true])).ok).toBe(false);
    expect((await as("authenticated", D1, "SELECT id FROM public.audiometry_sessions")).rows).toHaveLength(2);
    expect((await as("authenticated", D2, "SELECT id FROM public.audiometry_sessions")).rows).toHaveLength(0);
  });
  it("doctors may update seen/label/report but never the measurements", async () => {
    expect(
      (await as("authenticated", D1, `UPDATE public.audiometry_sessions SET seen = true, label = 'AB', report = '{"impedance":{}}'`)).ok,
    ).toBe(true);
    expect((await as("authenticated", D1, "UPDATE public.audiometry_sessions SET audiogram = '{}'")).ok).toBe(false);
    expect((await as("authenticated", D1, "UPDATE public.audiometry_sessions SET calibrated = true")).ok).toBe(false);
    expect((await as("authenticated", D1, "UPDATE public.audiometry_sessions SET label = repeat('x', 61)")).ok).toBe(false);
    expect((await as("authenticated", D2, "UPDATE public.audiometry_sessions SET seen = false RETURNING id")).rows).toHaveLength(0);
  });
  it("doctors delete only their own rows", async () => {
    expect((await as("authenticated", D2, "DELETE FROM public.audiometry_sessions RETURNING id")).rows).toHaveLength(0);
    expect((await as("authenticated", D1, "DELETE FROM public.audiometry_sessions RETURNING id")).rows).toHaveLength(2);
  });
});

describe("manual audiogram corrections", () => {
  const add = (source: string, calibrated: boolean, entry: string, role: "anon" | "authenticated" = "authenticated") =>
    as(
      role,
      role === "anon" ? null : D1,
      `INSERT INTO public.audiometry_sessions (doctor_id, source, seen, calibrated, app_version, device, audiogram)
       VALUES ('${D1}', '${source}', ${role === "anon" ? "false" : "true"}, ${calibrated}, 'entsenses-hearing-0.2.0', '{"entry":"${entry}"}', '{"right":{"air":{"1000":20}}}')
       RETURNING id`,
    );
  const fix = (id: unknown) =>
    as("authenticated", D1, `UPDATE public.audiometry_sessions SET audiogram = '{"right":{"air":{"1000":25}}}' WHERE id = '${id}'`);

  it("doctors can correct manually typed audiograms only", async () => {
    const manual = await add("doctor", false, "manual");
    expect((await fix(manual.rows[0].id)).ok).toBe(true);
    const calibrated = await add("doctor", true, "audiometer");
    expect((await fix(calibrated.rows[0].id)).error).toContain("audiogram_immutable");
    expect((await as("anon", null, `INSERT INTO public.audiometry_sessions (doctor_id, app_version, device) VALUES ('${D1}', 'v', '{"entry":"remote"}')`)).ok).toBe(true);
    const patient = await as("authenticated", D1, "SELECT id FROM public.audiometry_sessions WHERE source = 'patient' LIMIT 1");
    expect((await fix(patient.rows[0].id)).error).toContain("audiogram_immutable");
    // the report of any own session stays editable
    expect((await as("authenticated", D1, `UPDATE public.audiometry_sessions SET report = '{"plan":"x"}' WHERE id = '${calibrated.rows[0].id}'`)).ok).toBe(true);
  });
});

describe("keepalive", () => {
  it("anonymous clients can call keepalive() (used by the scheduled Netlify function)", async () => {
    const r = await as("anon", null, "SELECT public.keepalive() AS t");
    expect(r.ok).toBe(true);
    expect(r.rows).toHaveLength(1);
  });
});
