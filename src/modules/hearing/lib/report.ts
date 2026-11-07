// Bridges Hearing sessions and the AudiometricReport engine (types, calculations, report).
// Privacy: identifying patient fields (name, surname, ID, date of birth, e-mail, phone) are never
// stored. They live only in this browser tab's memory, to print the report.
import {
  CalculationStandard,
  type AudiogramData,
  type AudiogramEarData,
  type ImpedanceData,
  type ReportInfo,
  type SpeechAudiometryData,
} from "@/modules/hearing/audiometric/types";
import {
  AIR_FREQUENCIES,
  INITIAL_IMPEDANCE_EAR_DATA,
  INITIAL_REPORT_INFO,
  INITIAL_SPEECH_EAR_DATA,
} from "@/modules/hearing/audiometric/constants";
import { calculateAllResults } from "@/modules/hearing/audiometric/utils/calculations";

const CONDUCTIONS = ["air", "bone", "airMasked", "boneMasked", "ucl", "algiacusia"] as const;

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function emptyEar(): AudiogramEarData {
  const values = () => Object.fromEntries(AIR_FREQUENCIES.map((f) => [f, null])) as Record<number, number | null>;
  const flags = () => Object.fromEntries(AIR_FREQUENCIES.map((f) => [f, false])) as Record<number, boolean>;
  return {
    air: values(), bone: values(), airMasked: values(), boneMasked: values(), ucl: values(), algiacusia: values(),
    noResponse: { air: flags(), bone: flags(), airMasked: flags(), boneMasked: flags(), ucl: flags(), algiacusia: flags() },
  };
}

export function emptyAudiogram(): AudiogramData {
  return { right: emptyEar(), left: emptyEar() };
}

/** Accepts any stored audiogram JSON and returns a complete AudiogramData (missing parts empty). */
export function normalizeAudiogram(raw: unknown): AudiogramData {
  const out = emptyAudiogram();
  if (!raw || typeof raw !== "object") return out;
  for (const ear of ["right", "left"] as const) {
    const src = (raw as Record<string, any>)[ear];
    if (!src || typeof src !== "object") continue;
    for (const c of CONDUCTIONS) {
      for (const f of AIR_FREQUENCIES) {
        const v = src[c]?.[f];
        if (typeof v === "number" && Number.isFinite(v)) out[ear][c][f] = v;
        if (src.noResponse?.[c]?.[f] === true) out[ear].noResponse[c][f] = true;
      }
    }
  }
  return out;
}

/** Compact form for storage: only frequencies with a value or a "no response" flag. */
export function compactAudiogram(a: AudiogramData): Record<string, unknown> {
  const out: Record<string, any> = {};
  for (const ear of ["right", "left"] as const) {
    const e: Record<string, any> = {};
    for (const c of CONDUCTIONS) {
      const vals = Object.fromEntries(Object.entries(a[ear][c]).filter(([, v]) => v !== null && v !== undefined));
      if (Object.keys(vals).length) e[c] = vals;
      const nr = Object.fromEntries(Object.entries(a[ear].noResponse[c]).filter(([, v]) => v));
      if (Object.keys(nr).length) (e.noResponse ??= {})[c] = nr;
    }
    out[ear] = e;
  }
  return out;
}

export const emptySpeech = (): SpeechAudiometryData => ({ right: clone(INITIAL_SPEECH_EAR_DATA), left: clone(INITIAL_SPEECH_EAR_DATA) });
export const emptyImpedance = (): ImpedanceData => ({
  right: clone(INITIAL_IMPEDANCE_EAR_DATA) as ImpedanceData["right"],
  left: clone(INITIAL_IMPEDANCE_EAR_DATA) as ImpedanceData["left"],
});

/** Identifying fields: never stored. */
export const IDENTIFYING_FIELDS = ["apellidos", "nombre", "id", "fechaNacimiento", "email", "phone"] as const;
type IdentifyingField = (typeof IDENTIFYING_FIELDS)[number];
export type PatientIdentity = Pick<ReportInfo, IdentifyingField>;

/** Clinical (non-identifying) report fields that are stored with the session. */
export const STORED_INFO_FIELDS = [
  "edad", "motivo", "antecedentes", "antecedentesPersonales", "antecedentesFamiliares", "factoresExternos",
  "exploracionFisica", "complementarias", "lugarAudiometria", "fechaAudiometria", "juicioClinico", "plan",
  "lugarFirma", "fechaFirma",
] as const;

export interface StoredReport {
  version: 1;
  standard: CalculationStandard;
  info: Partial<Pick<ReportInfo, (typeof STORED_INFO_FIELDS)[number]>>;
  speech: SpeechAudiometryData;
  impedance: ImpedanceData;
}

export function toStoredReport(info: ReportInfo, speech: SpeechAudiometryData, impedance: ImpedanceData, standard: CalculationStandard): StoredReport {
  const stored: StoredReport["info"] = {};
  for (const k of STORED_INFO_FIELDS) if (info[k]) stored[k] = info[k];
  return { version: 1, standard, info: stored, speech, impedance };
}

export function fromStoredReport(raw: unknown): { info: ReportInfo; speech: SpeechAudiometryData; impedance: ImpedanceData; standard: CalculationStandard } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<StoredReport>;
  const info: ReportInfo = { ...clone(INITIAL_REPORT_INFO) } as ReportInfo;
  for (const k of STORED_INFO_FIELDS) {
    const v = r.info?.[k];
    if (typeof v === "string") info[k] = v;
  }
  const speech = emptySpeech();
  const impedance = emptyImpedance();
  for (const ear of ["right", "left"] as const) {
    if (r.speech?.[ear]) speech[ear] = { ...speech[ear], ...r.speech[ear] };
    if (r.impedance?.[ear]) {
      impedance[ear] = {
        tymp: { ...impedance[ear].tymp, ...r.impedance[ear].tymp },
        reflex: { ...impedance[ear].reflex, ...r.impedance[ear].reflex },
      };
    }
  }
  const standard = Object.values(CalculationStandard).includes(r.standard as CalculationStandard)
    ? (r.standard as CalculationStandard)
    : CalculationStandard.AMA;
  return { info, speech, impedance, standard };
}

/** In-memory only (lost on reload): identifying data typed for a session, to print the report. */
const identities = new Map<string, PatientIdentity>();
export const rememberIdentity = (sessionId: string, identity: PatientIdentity) => identities.set(sessionId, identity);
export const recallIdentity = (sessionId: string): PatientIdentity | undefined => identities.get(sessionId);

export function pickIdentity(info: ReportInfo): PatientIdentity {
  return Object.fromEntries(IDENTIFYING_FIELDS.map((k) => [k, info[k] ?? ""])) as PatientIdentity;
}

/** Pure-tone averages (air conduction) for the inbox and the copied summary. */
export function ptaSummary(audiogramRaw: unknown, standard: CalculationStandard = CalculationStandard.AMA) {
  const a = normalizeAudiogram(audiogramRaw);
  const v = calculateAllResults(a.right, a.left, standard);
  return { right: v.ptaOdVa, left: v.ptaOiVa, standard };
}

export function hasAnyThreshold(audiogramRaw: unknown): boolean {
  const a = normalizeAudiogram(audiogramRaw);
  return (["right", "left"] as const).some((ear) =>
    CONDUCTIONS.some((c) => Object.values(a[ear][c]).some((v) => v !== null) || Object.values(a[ear].noResponse[c]).some(Boolean)),
  );
}
