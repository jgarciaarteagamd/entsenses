// ENT Senses Hearing — informative remote check (patient's own device, NOT calibrated).
//
// Nothing is known about the patient's phone, headphones or volume, so levels cannot be true
// dB HL. The patient sets the volume so a 1 kHz reference tone (REF_DBFS, both ears) sounds
// clear and comfortable, like a normal conversation (~60 dB SPL ≈ 55 dB HL). From that
// assumption the app works on an ESTIMATED hearing-level scale:
//
//   dBFS = estimatedHL − (ASSUMED_REF_HL − REF_DBFS) + FREQ_OFFSET[f]
//
// FREQ_OFFSET is a generic headphone correction (RETSPL differences relative to 1 kHz). The
// estimate carries ±15–20 dB of uncertainty. What it shows reasonably well: differences between
// the ears, the shape of the curve (e.g. a high-frequency drop) and inconsistent responses. It
// cannot rule out a symmetrical loss. Patients only see plain categories, never numbers.
import type { AutoResults } from "@/modules/hearing/audio/hughsonWestlake";
import type { EarSide } from "@/modules/hearing/audio/levels";

export const REMOTE_SCALE = "est_hl_v1";
export const REF_DBFS = -25;
export const REF_FREQUENCY = 1000;
export const ASSUMED_REF_HL = 55;
export const REMOTE_MAX_DBFS = -6;
/** Test order per ear (about 4–5 minutes for both ears). */
export const REMOTE_SEQUENCE = [1000, 2000, 4000, 500];
/** Frequencies of the estimated pure-tone average. */
export const PTA_FREQUENCIES = [500, 1000, 2000, 4000];
export const FREQ_OFFSET: Record<number, number> = { 250: 18.5, 500: 4.5, 1000: 0, 2000: 2, 4000: 2.5, 6000: 8.5, 8000: 6 };

const K = ASSUMED_REF_HL - REF_DBFS;

export function estToDbfs(estHl: number, frequency: number): number {
  return estHl - K + (FREQ_OFFSET[frequency] ?? 0);
}

/** Highest estimated level presentable without exceeding REMOTE_MAX_DBFS (5-dB steps). */
export function remoteMaxLevel(frequency: number): number {
  return Math.floor((REMOTE_MAX_DBFS + K - (FREQ_OFFSET[frequency] ?? 0)) / 5) * 5;
}

// ---------------------------------------------------------------------------------------------
// Questionnaire

export type ScaleAnswer = 0 | 1 | 2 | 3 | 4;
export interface RemoteAnswers {
  /** Self-rated hearing: 0 very good … 4 a lot of difficulty. */
  selfRating?: ScaleAnswer;
  /** Frequency scales: 0 never … 4 always. */
  quiet?: ScaleAnswer;
  noise?: ScaleAnswer;
  phone?: ScaleAnswer;
  tv?: ScaleAnswer;
  worseEar?: "none" | "right" | "left";
  tinnitus?: "no" | "sometimes" | "constant";
}

export const SCALE_QUESTIONS = ["selfRating", "quiet", "noise", "phone", "tv"] as const;
export const RED_FLAGS = ["sudden", "pain_discharge", "vertigo", "pulsatile", "trauma"] as const;
export type RedFlag = (typeof RED_FLAGS)[number];

/** 0–20: higher = more everyday difficulty. */
export function questionnaireScore(a: RemoteAnswers): number {
  return SCALE_QUESTIONS.reduce((s, k) => s + (a[k] ?? 0), 0);
}
export const QUESTIONNAIRE_REVIEW_SCORE = 8;

// ---------------------------------------------------------------------------------------------
// Results

export type EstThreshold = number | "nr" | undefined;
export type EstThresholds = Record<EarSide, Partial<Record<number, EstThreshold>>>;

export function thresholdsFromRun(results: AutoResults): EstThresholds {
  const out: EstThresholds = { right: {}, left: {} };
  for (const ear of ["right", "left"] as const) {
    for (const [f, t] of Object.entries(results.thresholds[ear])) {
      if (!t) continue;
      out[ear][Number(f)] = "level" in t ? t.level : "nr";
    }
  }
  return out;
}

/** Estimated average over PTA_FREQUENCIES ("no response" counts as max + 5). Null if < 3 values. */
export function estimatedPta(th: Partial<Record<number, EstThreshold>>): number | null {
  const vals: number[] = [];
  for (const f of PTA_FREQUENCIES) {
    const v = th[f];
    if (typeof v === "number") vals.push(v);
    else if (v === "nr") vals.push(remoteMaxLevel(f) + 5);
  }
  if (vals.length < 3) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export type EarCategory = "good" | "possible_loss" | "probable_loss" | "incomplete";
export const GOOD_MAX = 30;
export const POSSIBLE_MAX = 50;

export function earCategory(pta: number | null): EarCategory {
  if (pta === null) return "incomplete";
  if (pta <= GOOD_MAX) return "good";
  if (pta <= POSSIBLE_MAX) return "possible_loss";
  return "probable_loss";
}

export const ASYMMETRY_PTA_DB = 15;
export const ASYMMETRY_SINGLE_DB = 25;

export function isAsymmetric(th: EstThresholds, ptaR: number | null, ptaL: number | null): boolean {
  if (ptaR !== null && ptaL !== null && Math.abs(ptaR - ptaL) >= ASYMMETRY_PTA_DB) return true;
  for (const f of PTA_FREQUENCIES) {
    const r = th.right[f];
    const l = th.left[f];
    const rv = r === "nr" ? remoteMaxLevel(f) + 5 : r;
    const lv = l === "nr" ? remoteMaxLevel(f) + 5 : l;
    if (typeof rv === "number" && typeof lv === "number" && Math.abs(rv - lv) >= ASYMMETRY_SINGLE_DB) return true;
  }
  return false;
}

export type Recommendation = "urgent" | "review" | "repeat" | "ok";

export interface RemoteAssessment {
  pta: Record<EarSide, number | null>;
  category: Record<EarSide, EarCategory>;
  asymmetric: boolean;
  /** Ear with the worse estimate when asymmetric. */
  worseEar: EarSide | null;
  unreliable: boolean;
  score: number;
  recommendation: Recommendation;
  reasons: string[];
}

export function assess(input: {
  thresholds: EstThresholds;
  answers: RemoteAnswers;
  redFlags: RedFlag[];
  falsePositiveRate: number;
  warnings: string[];
}): RemoteAssessment {
  const { thresholds, answers, redFlags } = input;
  const pta = { right: estimatedPta(thresholds.right), left: estimatedPta(thresholds.left) };
  const category = { right: earCategory(pta.right), left: earCategory(pta.left) };
  const asymmetric = isAsymmetric(thresholds, pta.right, pta.left);
  const worseEar = asymmetric && pta.right !== null && pta.left !== null && pta.right !== pta.left ? (pta.right > pta.left ? "right" : "left") : null;
  const unreliable =
    input.falsePositiveRate > 0.3 ||
    input.warnings.some((w) => w.startsWith("unreliable_")) ||
    category.right === "incomplete" ||
    category.left === "incomplete";
  const score = questionnaireScore(answers);

  const reasons: string[] = [];
  if (redFlags.length) reasons.push("red_flags");
  if (category.right === "possible_loss" || category.left === "possible_loss") reasons.push("possible_loss");
  if (category.right === "probable_loss" || category.left === "probable_loss") reasons.push("probable_loss");
  if (asymmetric) reasons.push("asymmetry");
  if (score >= QUESTIONNAIRE_REVIEW_SCORE) reasons.push("complaints");
  if (answers.worseEar && answers.worseEar !== "none") reasons.push("reported_worse_ear");
  if (answers.tinnitus === "constant") reasons.push("constant_tinnitus");
  if (unreliable) reasons.push("unreliable");

  let recommendation: Recommendation = "ok";
  if (redFlags.length) recommendation = "urgent";
  else if (reasons.some((r) => r !== "unreliable")) recommendation = "review";
  else if (unreliable) recommendation = "repeat";

  return { pta, category, asymmetric, worseEar, unreliable, score, recommendation, reasons };
}

/** Storage form for audiometry_sessions.audiogram (kept apart from calibrated `air` values). */
export function remoteAudiogramJson(th: EstThresholds) {
  const estimated: Record<string, Record<string, number>> = { right: {}, left: {} };
  const noResponse: Record<string, Record<string, true>> = { right: {}, left: {} };
  for (const ear of ["right", "left"] as const) {
    for (const [f, v] of Object.entries(th[ear])) {
      if (typeof v === "number") estimated[ear][f] = v;
      else if (v === "nr") noResponse[ear][f] = true;
    }
  }
  return { scale: REMOTE_SCALE, refDbfs: REF_DBFS, estimated, noResponse };
}

/** Reads a stored remote audiogram back (null if the session is not a remote check). */
export function readRemoteAudiogram(raw: unknown): EstThresholds | null {
  if (!raw || typeof raw !== "object" || (raw as { scale?: unknown }).scale !== REMOTE_SCALE) return null;
  const r = raw as { estimated?: Record<string, Record<string, unknown>>; noResponse?: Record<string, Record<string, unknown>> };
  const out: EstThresholds = { right: {}, left: {} };
  for (const ear of ["right", "left"] as const) {
    for (const [f, v] of Object.entries(r.estimated?.[ear] ?? {})) if (typeof v === "number" && Number.isFinite(v)) out[ear][Number(f)] = v;
    for (const [f, v] of Object.entries(r.noResponse?.[ear] ?? {})) if (v === true) out[ear][Number(f)] = "nr";
  }
  return out;
}
