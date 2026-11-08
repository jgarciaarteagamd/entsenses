// ENT Senses Hearing — calibration profiles and daily checks (Supabase, RLS: own rows only).
import { supabase } from "@/lib/supabase";
import { emptyPerEar, type BiologicalListener, type PerEar } from "../audio/levels";

export interface CalibrationProfile {
  id: string;
  name: string;
  transducer_model: string | null;
  transducer_serial: string | null;
  interface_model: string | null;
  technician: string | null;
  notes: string | null;
  method: "objective" | "manual" | "biological";
  reference_dbfs: number;
  max_dbfs: number;
  retspl: Partial<Record<number, number>>;
  measured_spl: PerEar;
  zero_hl: PerEar;
  /** Biological calibration: the listeners measured (thresholds in dBFS). */
  biological: BiologicalListener[];
  calibrated_at: string;
  valid_until: string;
  archived: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DailyCheck {
  id: string;
  profile_id: string;
  checked_at: string;
  ok: boolean;
  notes: string | null;
}

const num = (v: unknown, d: number) => (typeof v === "number" ? v : typeof v === "string" && v !== "" ? Number(v) : d);
const perEar = (v: unknown): PerEar => {
  const e = emptyPerEar();
  if (v && typeof v === "object") {
    for (const ear of ["right", "left"] as const) {
      const src = (v as Record<string, Record<string, unknown>>)[ear] ?? {};
      for (const [f, x] of Object.entries(src)) if (typeof x === "number") e[ear][Number(f)] = x;
    }
  }
  return e;
};

function normalize(row: Record<string, unknown>): CalibrationProfile {
  return {
    ...(row as unknown as CalibrationProfile),
    reference_dbfs: num(row.reference_dbfs, -20),
    max_dbfs: num(row.max_dbfs, -3),
    retspl: Object.fromEntries(Object.entries((row.retspl as Record<string, number>) ?? {}).map(([k, v]) => [Number(k), Number(v)])),
    measured_spl: perEar(row.measured_spl),
    zero_hl: perEar(row.zero_hl),
    biological: Array.isArray(row.biological)
      ? (row.biological as BiologicalListener[]).map((l) => ({ ...l, thresholds: perEar(l.thresholds) }))
      : [],
  };
}

export async function listProfiles(): Promise<CalibrationProfile[]> {
  const { data, error } = await supabase.from("hearing_calibration_profiles").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalize);
}

export async function saveProfile(p: Omit<CalibrationProfile, "id"> & { id?: string }): Promise<CalibrationProfile> {
  const { id, created_at: _c, updated_at: _u, ...fields } = p;
  const q = id
    ? supabase.from("hearing_calibration_profiles").update(fields).eq("id", id).select("*").single()
    : supabase.from("hearing_calibration_profiles").insert(fields).select("*").single();
  const { data, error } = await q;
  if (error) throw error;
  return normalize(data as Record<string, unknown>);
}

export async function setArchived(id: string, archived: boolean) {
  const { error } = await supabase.from("hearing_calibration_profiles").update({ archived }).eq("id", id);
  if (error) throw error;
}

export async function lastDailyCheck(profileId: string): Promise<DailyCheck | null> {
  const { data, error } = await supabase
    .from("hearing_daily_checks")
    .select("*")
    .eq("profile_id", profileId)
    .order("checked_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as DailyCheck | null) ?? null;
}

export async function recordDailyCheck(profileId: string, ok: boolean, notes: string | null) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("not authenticated");
  const { error } = await supabase.from("hearing_daily_checks").insert({ doctor_id: u.user.id, profile_id: profileId, ok, notes });
  if (error) throw error;
}

/** True if the check was done today (local date) and was correct. */
export function checkedOkToday(c: DailyCheck | null, now = new Date()): boolean {
  if (!c || !c.ok) return false;
  return new Date(c.checked_at).toDateString() === now.toDateString();
}
