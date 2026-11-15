// Data access for Scales assessments (Supabase, protected by Row Level Security: each doctor reads
// and writes only their own rows; there is no anonymous access).
import { supabase } from "@/lib/supabase";
import { RHINOLOGY_VERSION, summarizeRhinology, type RhinologyScales, type RhinologySummary } from "./rhinology";
import { LARYNX_VERSION, summarizeLarynx, type LarynxScales, type LarynxSummary } from "./larynx";

export const PACKS = ["rhinology", "larynx"] as const;
export type Pack = (typeof PACKS)[number];

interface PackTypes {
  rhinology: { scales: RhinologyScales; summary: RhinologySummary };
  larynx: { scales: LarynxScales; summary: LarynxSummary };
}

/** Version of the definitions and scoring function of each pack (stored with every row). */
const PACK_DEFS: { [P in Pack]: { version: string; summarize: (s: PackTypes[P]["scales"]) => PackTypes[P]["summary"] } } = {
  rhinology: { version: RHINOLOGY_VERSION, summarize: summarizeRhinology },
  larynx: { version: LARYNX_VERSION, summarize: summarizeLarynx },
};

interface RowBase {
  id: string;
  doctor_id: string;
  created_at: string;
  updated_at: string;
  /** YYYY-MM-DD */
  assessed_on: string;
  label: string | null;
  pack_version: string;
}

export type RowOf<P extends Pack> = RowBase & { pack: P } & PackTypes[P];
export type ScaleAssessmentRow = { [P in Pack]: RowOf<P> }[Pack];

export interface AssessmentInput<S = RhinologyScales> {
  assessedOn: string;
  label: string | null;
  scales: S;
}

export function sanitizeLabel(label: string | null | undefined): string | null {
  if (!label) return null;
  const t = label.trim().slice(0, 60);
  return t.length ? t : null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string) => UUID_RE.test(v);

/** Today's date in the browser's time zone, as YYYY-MM-DD. */
export function todayIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function payload<P extends Pack>(pack: P, input: AssessmentInput<PackTypes[P]["scales"]>) {
  if (!DATE_RE.test(input.assessedOn)) throw new Error("invalid date");
  const def = PACK_DEFS[pack];
  return {
    assessed_on: input.assessedOn,
    label: sanitizeLabel(input.label),
    pack_version: def.version,
    scales: input.scales,
    summary: def.summarize(input.scales),
  };
}

export async function createAssessment<P extends Pack>(pack: P, input: AssessmentInput<PackTypes[P]["scales"]>): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("not authenticated");
  const { data, error } = await supabase
    .from("scale_assessments")
    .insert({ doctor_id: u.user.id, pack, ...payload(pack, input) })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateAssessment<P extends Pack>(id: string, pack: P, input: AssessmentInput<PackTypes[P]["scales"]>) {
  const { error } = await supabase.from("scale_assessments").update(payload(pack, input)).eq("id", id);
  if (error) throw error;
}

export async function listMyAssessments(): Promise<ScaleAssessmentRow[]> {
  const { data, error } = await supabase
    .from("scale_assessments")
    .select("*")
    .order("assessed_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as ScaleAssessmentRow[];
}

export async function getAssessment(id: string): Promise<ScaleAssessmentRow | null> {
  const { data, error } = await supabase.from("scale_assessments").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as ScaleAssessmentRow | null;
}

export async function deleteAssessment(id: string) {
  const { error } = await supabase.from("scale_assessments").delete().eq("id", id);
  if (error) throw error;
}

export interface Snot22Response {
  id: string;
  created_at: string;
  total_score: number;
}

/** SNOT-22 responses from Quest with the same patient label (most recent first). */
export async function listSnot22ByLabel(label: string | null): Promise<Snot22Response[]> {
  const l = sanitizeLabel(label);
  if (!l) return [];
  const { data, error } = await supabase
    .from("patient_responses")
    .select("id, created_at, total_score")
    .eq("questionnaire_slug", "snot-22")
    .eq("label", l)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Snot22Response[];
}

/** Assessments of one patient label and pack, oldest first (for the follow-up view). */
export function byLabel<P extends Pack>(rows: ScaleAssessmentRow[], label: string, pack: P): RowOf<P>[] {
  const l = sanitizeLabel(label);
  const mine = rows.filter((r) => r.label === l && r.pack === pack) as unknown as RowOf<P>[];
  return mine.sort((a, b) => a.assessed_on.localeCompare(b.assessed_on) || a.created_at.localeCompare(b.created_at));
}

/** Distinct labels, most recently assessed first. */
export function distinctLabels(rows: ScaleAssessmentRow[]): string[] {
  const seen = new Set<string>();
  for (const r of rows) if (r.label) seen.add(r.label);
  return [...seen];
}

export interface VoiceResultLite {
  id: string;
  created_at: string;
  metrics: { avqi?: { value?: number } | null; vowel?: { cpps?: number; f0Mean?: number } | null; speech?: { f0Mean?: number } | null; mptSeconds?: number | null };
  estimates: { grbas?: { G?: number } };
  clinician: { grbas?: { G?: number } } | null;
}

/** ENT Senses Voice results with the same patient label (most recent first). */
export async function listVoiceByLabel(label: string | null): Promise<VoiceResultLite[]> {
  const l = sanitizeLabel(label);
  if (!l) return [];
  const { data, error } = await supabase
    .from("voice_results")
    .select("id, created_at, metrics, estimates, clinician")
    .eq("label", l)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as VoiceResultLite[];
}
