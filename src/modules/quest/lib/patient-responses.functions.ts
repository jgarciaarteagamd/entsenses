// Patient responses: anonymous submissions (patients) and the doctor's inbox.
// Every rule is enforced by Row Level Security in the database; validation here only gives
// friendlier errors. Functions keep the `{ data }` call shape used by the routes.
import { supabase, supabaseAnon } from "@/modules/quest/lib/supabase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validAnswers(answers: unknown): number[] {
  if (!Array.isArray(answers) || answers.length === 0) throw new Error("answers required");
  if (answers.length > 200) throw new Error("too many answers");
  return answers.map((n) => {
    const v = Number(n);
    if (!Number.isInteger(v) || v < 0 || v > 10) throw new Error("invalid answer value");
    return v;
  });
}

function validSlug(slug: unknown): string {
  if (!slug || typeof slug !== "string" || slug.length > 100) throw new Error("slug required");
  return slug;
}

function cleanLabel(label: unknown): string | null {
  if (label === undefined || label === null) return null;
  if (typeof label !== "string") throw new Error("invalid label");
  const t = label.trim().slice(0, 60);
  return t.length ? t : null;
}

type Client = typeof supabase;

async function score(client: Client, slug: string, answers: number[]) {
  const { data, error } = await client.rpc("calculate_questionnaire_score", {
    questionnaire_slug: slug,
    answers,
  });
  if (error) throw new Error("No se pudo calcular el resultado.");
  const scored = Array.isArray(data) ? data[0] : data;
  const { data: q } = await client.from("questionnaires").select("name").eq("slug", slug).maybeSingle();
  return { scored, name: q?.name ?? slug };
}

/** PUBLIC — a patient submits an anonymous response (no labels, no identifiers). */
export async function submitPatientResponse({
  data: input,
}: {
  data: { doctorId: string; slug: string; answers: number[] };
}) {
  if (!input.doctorId || !UUID_RE.test(input.doctorId)) throw new Error("doctorId required");
  const slug = validSlug(input.slug);
  const answers = validAnswers(input.answers);
  const { scored, name } = await score(supabaseAnon, slug, answers);
  const { error } = await supabaseAnon.from("patient_responses").insert({
    doctor_id: input.doctorId,
    questionnaire_slug: slug,
    questionnaire_name: name,
    answers,
    total_score: scored?.total_score ?? 0,
    category: scored?.category ?? null,
    description: scored?.description ?? null,
    color: scored?.color ?? null,
    seen: false,
    label: null,
    source: "patient",
  });
  if (error) throw new Error("No se pudo registrar la respuesta. Intente nuevamente.");
  return { ok: true, totalScore: scored?.total_score ?? 0 };
}

/** AUTH — the doctor saves a questionnaire completed inside the app. */
export async function submitDoctorResponse({
  data: input,
}: {
  data: { slug: string; answers: number[]; label?: string };
}) {
  const slug = validSlug(input.slug);
  const answers = validAnswers(input.answers);
  const label = cleanLabel(input.label);
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Unauthorized");
  const { scored, name } = await score(supabase, slug, answers);
  const { data: inserted, error } = await supabase
    .from("patient_responses")
    .insert({
      doctor_id: u.user.id,
      questionnaire_slug: slug,
      questionnaire_name: name,
      answers,
      total_score: scored?.total_score ?? 0,
      category: scored?.category ?? null,
      description: scored?.description ?? null,
      color: scored?.color ?? null,
      seen: true,
      label,
      source: "doctor",
    })
    .select("id")
    .single();
  if (error) throw new Error("No se pudo registrar la respuesta.");
  return { ok: true, id: inserted?.id ?? null, totalScore: scored?.total_score ?? 0 };
}

/** AUTH — the current doctor's inbox (RLS returns only their own rows). */
export async function listMyPatientResponses(_?: unknown) {
  const { data, error } = await supabase
    .from("patient_responses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function markResponseSeen({ data }: { data: { id: string; seen?: boolean } }) {
  if (!data.id) throw new Error("id required");
  const { error } = await supabase.from("patient_responses").update({ seen: data.seen ?? true }).eq("id", data.id);
  if (error) throw error;
  return { ok: true };
}

export async function updateResponseLabel({ data }: { data: { id: string; label?: string } }) {
  if (!data.id) throw new Error("id required");
  const { error } = await supabase
    .from("patient_responses")
    .update({ label: cleanLabel(data.label) })
    .eq("id", data.id);
  if (error) throw error;
  return { ok: true };
}

export async function deletePatientResponse({ data }: { data: { id: string } }) {
  if (!data.id) throw new Error("id required");
  const { error } = await supabase.from("patient_responses").delete().eq("id", data.id);
  if (error) throw error;
  return { ok: true };
}
