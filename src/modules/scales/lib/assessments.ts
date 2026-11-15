// Data access for Scales assessments (Supabase, protected by Row Level Security: each doctor reads
// and writes only their own rows; there is no anonymous access).
import { supabase } from "@/lib/supabase";
import { RHINOLOGY_VERSION, summarizeRhinology, type RhinologyScales, type RhinologySummary } from "./rhinology";

export type Pack = "rhinology";

export interface ScaleAssessmentRow {
  id: string;
  doctor_id: string;
  created_at: string;
  updated_at: string;
  /** YYYY-MM-DD */
  assessed_on: string;
  label: string | null;
  pack: Pack;
  pack_version: string;
  scales: RhinologyScales;
  summary: RhinologySummary;
}

export interface AssessmentInput {
  assessedOn: string;
  label: string | null;
  scales: RhinologyScales;
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

function payload(input: AssessmentInput) {
  if (!DATE_RE.test(input.assessedOn)) throw new Error("invalid date");
  return {
    assessed_on: input.assessedOn,
    label: sanitizeLabel(input.label),
    pack_version: RHINOLOGY_VERSION,
    scales: input.scales,
    summary: summarizeRhinology(input.scales),
  };
}

export async function createAssessment(input: AssessmentInput): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("not authenticated");
  const { data, error } = await supabase
    .from("scale_assessments")
    .insert({ doctor_id: u.user.id, pack: "rhinology", ...payload(input) })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateAssessment(id: string, input: AssessmentInput) {
  const { error } = await supabase.from("scale_assessments").update(payload(input)).eq("id", id);
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

/** Assessments of one patient label, oldest first (for the follow-up view). */
export function byLabel(rows: ScaleAssessmentRow[], label: string): ScaleAssessmentRow[] {
  const l = sanitizeLabel(label);
  return rows
    .filter((r) => r.label === l)
    .sort((a, b) => a.assessed_on.localeCompare(b.assessed_on) || a.created_at.localeCompare(b.created_at));
}

/** Distinct labels, most recently assessed first. */
export function distinctLabels(rows: ScaleAssessmentRow[]): string[] {
  const seen = new Set<string>();
  for (const r of rows) if (r.label) seen.add(r.label);
  return [...seen];
}
