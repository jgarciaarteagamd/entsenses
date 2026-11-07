// ENT Senses Hearing — data access for audiometry sessions (Supabase, protected by RLS).
import { supabase, supabaseAnon } from "@/lib/supabase";
import { isUuid, sanitizeLabel } from "@/lib/ids";
import { APP_VERSION, type AgeGroup, type DeviceInfo, type JsonObject, type Lang, type QualityInfo, type SessionInfo, type Sex } from "./session";

export interface SessionRow {
  id: string;
  doctor_id: string;
  source: "patient" | "doctor";
  created_at: string;
  seen: boolean;
  label: string | null;
  sex: Sex;
  age_group: AgeGroup;
  language: Lang;
  app_version: string;
  calibrated: boolean;
  device: DeviceInfo;
  questionnaire: JsonObject;
  audiogram: JsonObject;
  quality: QualityInfo;
  report: JsonObject | null;
}

export interface SessionPayload {
  info: SessionInfo;
  device: DeviceInfo;
  questionnaire?: JsonObject;
  audiogram: JsonObject;
  quality?: QualityInfo;
}


const TABLE = "audiometry_sessions";

function base(p: SessionPayload) {
  return {
    sex: p.info.sex,
    age_group: p.info.ageGroup,
    language: p.info.lang,
    app_version: APP_VERSION,
    device: p.device,
    questionnaire: p.questionnaire ?? {},
    audiogram: p.audiogram,
    quality: p.quality ?? {},
  };
}

/** PUBLIC — anonymous patient submission (informative, never calibrated). */
export async function submitPatientSession(doctorId: string, p: SessionPayload) {
  if (!isUuid(doctorId)) throw new Error("invalid doctor id");
  const { error } = await supabaseAnon.from(TABLE).insert({
    ...base(p),
    doctor_id: doctorId,
    source: "patient",
    calibrated: false,
    seen: false,
    label: null,
    report: null,
  });
  if (error) throw error;
}

/** AUTH — doctor saves an in-clinic session. */
export async function submitDoctorSession(p: SessionPayload, opts: { calibrated: boolean; label: string | null; report?: JsonObject | null }) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("not authenticated");
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      ...base(p),
      doctor_id: u.user.id,
      source: "doctor",
      calibrated: opts.calibrated,
      seen: true,
      label: sanitizeLabel(opts.label),
      report: opts.report ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data?.id as string;
}

export async function listMySessions(): Promise<SessionRow[]> {
  const { data, error } = await supabase.from(TABLE).select("*").order("created_at", { ascending: false }).limit(300);
  if (error) throw error;
  return (data ?? []) as SessionRow[];
}

export async function getSession(id: string): Promise<SessionRow | null> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as SessionRow | null;
}

export async function markSeen(id: string, seen: boolean) {
  const { error } = await supabase.from(TABLE).update({ seen }).eq("id", id);
  if (error) throw error;
}

export async function updateLabel(id: string, label: string | null) {
  const { error } = await supabase.from(TABLE).update({ label: sanitizeLabel(label) }).eq("id", id);
  if (error) throw error;
}

export async function updateReport(id: string, report: JsonObject | null) {
  const { error } = await supabase.from(TABLE).update({ report }).eq("id", id);
  if (error) throw error;
}

/** Typed in by hand from another audiometer: the only kind whose audiogram can be corrected. */
export const isManualEntry = (r: SessionRow) => r.source === "doctor" && !r.calibrated && r.device?.entry === "manual";

/** Only allowed by the database for manually typed sessions. */
export async function updateAudiogram(id: string, audiogram: JsonObject) {
  const { error } = await supabase.from(TABLE).update({ audiogram }).eq("id", id);
  if (error) throw error;
}

export async function deleteSession(id: string) {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

/** Deletes every session of the logged-in doctor (used from Settings). */
export async function deleteAllMySessions(doctorId: string) {
  const { error } = await supabase.from(TABLE).delete().eq("doctor_id", doctorId);
  if (error) throw error;
}

