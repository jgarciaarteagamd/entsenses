// ENT Senses Quest — Row Level Security rules (shared in-memory database).
import { beforeAll, describe, expect, it } from "vitest";
import { createDb, D1, D2, UNKNOWN } from "./helpers/db";

let as: Awaited<ReturnType<typeof createDb>>["as"];
let db: Awaited<ReturnType<typeof createDb>>["db"];
beforeAll(async () => {
  ({ as, db } = await createDb());
});
const insert = (doctor: string) =>
  `INSERT INTO public.patient_responses (doctor_id, questionnaire_slug, answers, total_score, seen, label, source)
   VALUES ('${doctor}', 'eat-10', ARRAY[1,2,3], 6, $1, $2, $3)`;


describe("catalogue (public data)", () => {
  it("anonymous patients can read questionnaires and compute a score", async () => {
    const q = await as("anon", null, "SELECT slug FROM public.questionnaires WHERE is_active ORDER BY slug");
    expect(q.ok).toBe(true);
    expect(q.rows.map((r) => r.slug)).toEqual(expect.arrayContaining(["eat-10", "snot-22", "vhi-30"]));
    const s = await as("anon", null, "SELECT * FROM public.calculate_questionnaire_score('eat-10', ARRAY[1,1,1,0,0,0,0,0,0,0])");
    expect(s.ok).toBe(true);
    expect(Number(s.rows[0].total_score)).toBe(3);
  });
  it("SNOT-22 has exactly 22 distinct items with 0–5 options", async () => {
    const r = await as(
      "anon",
      null,
      `SELECT jsonb_array_length(structure->'items') AS n,
              (SELECT count(DISTINCT i->>'text') FROM jsonb_array_elements(structure->'items') i) AS d,
              jsonb_array_length(structure #> '{items,21,options}') AS o
       FROM public.questionnaires WHERE slug = 'snot-22'`,
    );
    expect(r.rows[0]).toEqual({ n: 22, d: 22, o: 6 });
  });
  it("sign-up trigger creates the doctor profile", async () => {
    const r = await as("authenticated", D1, "SELECT first_name FROM public.doctor_profiles");
    expect(r.rows).toEqual([{ first_name: "Ana" }]);
  });
});

describe("patient_responses RLS", () => {
  it("anonymous patients can submit for an existing doctor only, without label", async () => {
    expect((await as("anon", null, insert(D1), [false, null, "patient"])).ok).toBe(true);
    expect((await as("anon", null, insert(UNKNOWN), [false, null, "patient"])).ok).toBe(false);
    expect((await as("anon", null, insert(D1), [false, "JP", "patient"])).ok).toBe(false);
    expect((await as("anon", null, insert(D1), [false, null, "doctor"])).ok).toBe(false);
    expect((await as("anon", null, insert(D1), [true, null, "patient"])).ok).toBe(false);
    expect((await as("anon", null, "SELECT * FROM public.patient_responses")).ok).toBe(false);
  });
  it("doctors read, label and delete only their own responses; scores are immutable", async () => {
    expect((await as("authenticated", D1, insert(D1), [true, "AB", "doctor"])).ok).toBe(true);
    expect((await as("authenticated", D1, insert(D2), [true, null, "doctor"])).ok).toBe(false);
    expect((await as("authenticated", D1, "SELECT id FROM public.patient_responses")).rows).toHaveLength(2);
    expect((await as("authenticated", D2, "SELECT id FROM public.patient_responses")).rows).toHaveLength(0);
    expect((await as("authenticated", D1, "UPDATE public.patient_responses SET seen = true, label = 'HC-1'")).ok).toBe(true);
    expect((await as("authenticated", D1, "UPDATE public.patient_responses SET total_score = 0")).ok).toBe(false);
    expect((await as("authenticated", D1, "UPDATE public.patient_responses SET label = repeat('x', 61)")).ok).toBe(false);
    expect((await as("authenticated", D2, "DELETE FROM public.patient_responses RETURNING id")).rows).toHaveLength(0);
    expect((await as("authenticated", D1, "DELETE FROM public.patient_responses RETURNING id")).rows).toHaveLength(2);
  });
});

describe("patient invitations", () => {
  const create = (doctor: string, label: string, expires = "now() + interval '14 days'") =>
    `INSERT INTO public.patient_invitations (doctor_id, questionnaire_slug, label, expires_at)
     VALUES ('${doctor}', 'eat-10', '${label}', ${expires}) RETURNING token`;
  let token = "";

  it("doctors create invitations only for themselves, with a label; patients cannot read them", async () => {
    const r = await as("authenticated", D1, create(D1, "HC-77"));
    expect(r.ok).toBe(true);
    token = String(r.rows[0].token);
    expect((await as("authenticated", D1, create(D2, "X"))).ok).toBe(false);
    expect((await as("authenticated", D1, create(D1, "   "))).ok).toBe(false);
    expect((await as("authenticated", D1, create(D1, "x".repeat(61)))).ok).toBe(false);
    expect(
      (await as("authenticated", D1, `INSERT INTO public.patient_invitations (questionnaire_slug, label, completed_at) VALUES ('eat-10', 'A', now())`)).ok,
    ).toBe(false);
    expect((await as("anon", null, "SELECT * FROM public.patient_invitations")).ok).toBe(false);
    expect((await as("anon", null, create(D1, "A"))).ok).toBe(false);
    expect((await as("authenticated", D2, "SELECT id FROM public.patient_invitations")).rows).toHaveLength(0);
  });

  it("the public lookup returns the questionnaire and status, never the label", async () => {
    const r = await as("anon", null, "SELECT * FROM public.get_invitation($1)", [token]);
    expect(r.rows).toEqual([{ questionnaire_slug: "eat-10", variant: null, status: "pending" }]);
    expect((await as("anon", null, "SELECT * FROM public.get_invitation($1)", [UNKNOWN])).rows).toHaveLength(0);
  });

  it("a patient answers once; the response arrives labelled and the invitation closes", async () => {
    const sub = await as("anon", null, "SELECT public.submit_invited_response($1, ARRAY[1,1,1,0,0,0,0,0,0,0]) AS s", [token]);
    expect(sub.ok).toBe(true);
    expect(Number(sub.rows[0].s)).toBe(3);
    const resp = await as(
      "authenticated",
      D1,
      "SELECT label, source, seen, total_score FROM public.patient_responses WHERE label = 'HC-77'",
    );
    expect(resp.rows).toEqual([{ label: "HC-77", source: "patient", seen: false, total_score: 3 }]);
    const again = await as("anon", null, "SELECT public.submit_invited_response($1, ARRAY[1]) AS s", [token]);
    expect(again.ok).toBe(false);
    expect(again.error).toContain("invitation_completed");
    expect((await as("anon", null, "SELECT status FROM public.get_invitation($1)", [token])).rows).toEqual([{ status: "completed" }]);
  });

  it("expired tokens and invalid answers are rejected", async () => {
    const r = await as("authenticated", D1, create(D1, "OLD"));
    const t2 = String(r.rows[0].token);
    expect((await as("anon", null, "SELECT public.submit_invited_response($1, ARRAY[11])", [t2])).error).toContain("invalid_answers");
    expect((await as("anon", null, "SELECT public.submit_invited_response($1, ARRAY[]::int[])", [t2])).error).toContain("invalid_answers");
    await db.exec(`UPDATE public.patient_invitations SET created_at = now() - interval '20 days', expires_at = now() - interval '1 day' WHERE token = '${t2}'`);
    expect((await as("anon", null, "SELECT status FROM public.get_invitation($1)", [t2])).rows).toEqual([{ status: "expired" }]);
    expect((await as("anon", null, "SELECT public.submit_invited_response($1, ARRAY[1])", [t2])).error).toContain("invitation_expired");
  });

  it("doctors delete only their own invitations", async () => {
    expect((await as("authenticated", D2, "DELETE FROM public.patient_invitations RETURNING id")).rows).toHaveLength(0);
    expect((await as("authenticated", D1, "DELETE FROM public.patient_invitations RETURNING id")).rows).toHaveLength(2);
  });
});

describe("feedback & keepalive", () => {
  it("anyone can send feedback but not read it", async () => {
    const ins = await as("anon", null, "INSERT INTO public.feedback (message, category, language) VALUES ('hola', 'general', 'es')");
    expect(ins.ok).toBe(true);
    expect((await as("anon", null, "SELECT * FROM public.feedback")).ok).toBe(false);
  });
  it("keepalive() is callable anonymously", async () => {
    expect((await as("anon", null, "SELECT public.keepalive()")).ok).toBe(true);
  });
});
