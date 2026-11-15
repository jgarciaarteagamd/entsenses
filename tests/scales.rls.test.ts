// ENT Senses Scales — Row Level Security rules (shared in-memory database).
import { beforeAll, describe, expect, it } from "vitest";
import { createDb, D1, D2 } from "./helpers/db";

let as: Awaited<ReturnType<typeof createDb>>["as"];
beforeAll(async () => {
  ({ as } = await createDb());
});

const insert = (doctor: string, label: string | null = "JP", assessedOn = "current_date") =>
  `INSERT INTO public.scale_assessments (doctor_id, label, assessed_on, pack, pack_version, scales, summary)
   VALUES ('${doctor}', ${label === null ? "NULL" : `'${label}'`}, ${assessedOn}, 'rhinology', 'rhinology-1',
           '{"nps":{"right":2,"left":3}}', '{"nps":{"total":5}}')`;

describe("scale_assessments RLS", () => {
  it("anonymous users can neither insert nor read", async () => {
    expect((await as("anon", null, insert(D1))).ok).toBe(false);
    expect((await as("anon", null, "SELECT * FROM public.scale_assessments")).ok).toBe(false);
  });
  it("doctors insert only their own rows", async () => {
    expect((await as("authenticated", D1, insert(D1))).ok).toBe(true);
    expect((await as("authenticated", D1, insert(D1, null, "DATE '2025-03-01'"))).ok).toBe(true);
    expect((await as("authenticated", D1, insert(D2))).ok).toBe(false);
  });
  it("rejects invalid labels, packs, dates and oversized payloads", async () => {
    expect((await as("authenticated", D1, insert(D1, "x".repeat(61)))).ok).toBe(false);
    expect((await as("authenticated", D1, insert(D1, "JP", "current_date + 30"))).ok).toBe(false);
    const badPack = `INSERT INTO public.scale_assessments (doctor_id, pack, pack_version, scales, summary)
      VALUES ('${D1}', 'Rhino; DROP', 'v', '{}', '{}')`;
    expect((await as("authenticated", D1, badPack)).ok).toBe(false);
    const big = `INSERT INTO public.scale_assessments (doctor_id, pack, pack_version, scales, summary)
      VALUES ('${D1}', 'rhinology', 'v', jsonb_build_object('x', repeat('a', 25000)), '{}')`;
    expect((await as("authenticated", D1, big)).ok).toBe(false);
    const notObject = `INSERT INTO public.scale_assessments (doctor_id, pack, pack_version, scales, summary)
      VALUES ('${D1}', 'rhinology', 'v', '[]', '{}')`;
    expect((await as("authenticated", D1, notObject)).ok).toBe(false);
  });
  it("each doctor reads only their own rows", async () => {
    expect((await as("authenticated", D1, "SELECT id FROM public.scale_assessments")).rows).toHaveLength(2);
    expect((await as("authenticated", D2, "SELECT id FROM public.scale_assessments")).rows).toHaveLength(0);
  });
  it("doctors may correct ratings, label and date, but never the owner or the pack", async () => {
    const upd = await as(
      "authenticated",
      D1,
      `UPDATE public.scale_assessments SET label = 'AB', scales = '{"nps":{"right":1,"left":1}}',
         summary = '{"nps":{"total":2}}', assessed_on = DATE '2026-01-10' RETURNING updated_at > created_at AS touched`,
    );
    expect(upd.ok).toBe(true);
    expect(upd.rows).toHaveLength(2);
    expect((await as("authenticated", D1, `UPDATE public.scale_assessments SET doctor_id = '${D2}'`)).ok).toBe(false);
    expect((await as("authenticated", D1, "UPDATE public.scale_assessments SET pack = 'otology'")).ok).toBe(false);
    expect((await as("authenticated", D2, "UPDATE public.scale_assessments SET label = 'X' RETURNING id")).rows).toHaveLength(0);
  });
  it("doctors delete only their own rows", async () => {
    expect((await as("authenticated", D2, "DELETE FROM public.scale_assessments RETURNING id")).rows).toHaveLength(0);
    expect((await as("authenticated", D1, "DELETE FROM public.scale_assessments RETURNING id")).rows).toHaveLength(2);
  });
});
