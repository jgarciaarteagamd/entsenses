// ENT Senses Scales — Sleep and oropharynx pack: definitions and scoring (pure functions, no I/O).
//
// Grade texts and rules come from the publications in `SLEEP_REFERENCES`. If a definition changes,
// bump SLEEP_VERSION.
import { finite, isGrade, type Grade, type Reference, type Text } from "./types";

export const SLEEP_VERSION = "sleep-1";

// ---------------------------------------------------------------------------------------------
// Awake examination: Brodsky tonsil size, Friedman tongue position, BMI → modified Friedman stage

export const BRODSKY_GRADES: Grade[] = [
  { value: 0, text: { es: "Amígdalas dentro de la fosa amigdalar (o amigdalectomía)", en: "Tonsils within the tonsillar fossa (or tonsillectomy)" } },
  { value: 1, text: { es: "Ocupan menos del 25 % del espacio entre los pilares anteriores", en: "Occupy less than 25% of the space between the anterior pillars" } },
  { value: 2, text: { es: "Ocupan del 25 al 50 % del espacio entre los pilares anteriores", en: "Occupy 25–50% of the space between the anterior pillars" } },
  { value: 3, text: { es: "Ocupan del 50 al 75 % del espacio entre los pilares anteriores", en: "Occupy 50–75% of the space between the anterior pillars" } },
  { value: 4, text: { es: "Ocupan más del 75 % del espacio entre los pilares anteriores", en: "Occupy more than 75% of the space between the anterior pillars" } },
];

export const FTP_GRADES = ["I", "IIa", "IIb", "III", "IV"] as const;
export type FtpGrade = (typeof FTP_GRADES)[number];

export const FTP_TEXT: Record<FtpGrade, Text> = {
  I: { es: "Se ven la úvula, las amígdalas y los pilares por completo", en: "Uvula, tonsils and pillars fully visible" },
  IIa: { es: "Se ve la úvula entera; amígdalas y pilares parcialmente ocultos", en: "Whole uvula visible; tonsils and pillars partly hidden" },
  IIb: { es: "Se ven el paladar blando y la base de la úvula, pero no amígdalas ni pilares", en: "Soft palate and base of the uvula visible, not tonsils or pillars" },
  III: { es: "Se ve parte del paladar blando; no se ven la parte distal ni la base de la úvula", en: "Part of the soft palate visible; distal soft palate and base of the uvula not visible" },
  IV: { es: "Solo se ve el paladar duro", en: "Only the hard palate is visible" },
};

/** Tongue position as used for staging (IIa and IIb count as II). */
export const ftpLevel = (g: FtpGrade): 1 | 2 | 3 | 4 => (g === "I" ? 1 : g === "III" ? 3 : g === "IV" ? 4 : 2);

export interface ExamInput {
  brodsky?: number | null;
  ftp?: FtpGrade | null;
  weightKg?: number | null;
  heightCm?: number | null;
  /** Skeletal deformities such as micrognathia or midface hypoplasia. */
  craniofacial?: boolean | null;
}

export type FriedmanStage = 1 | 2 | 3 | 4;

export interface ExamScore {
  brodsky: number | null;
  ftp: FtpGrade | null;
  bmi: number | null;
  friedman: FriedmanStage | null;
}

/** BMI (kg/m²), rounded to one decimal. */
export function bmiOf(weightKg: unknown, heightCm: unknown): number | null {
  const w = finite(weightKg);
  const h = finite(heightCm);
  if (w === null || h === null || w <= 0 || h <= 0) return null;
  return Math.round((w / (h / 100) ** 2) * 10) / 10;
}

/**
 * Modified Friedman staging: IV if BMI > 40 or skeletal deformity; otherwise
 * I = tongue position 1–2 and tonsils 3–4; III = tongue position 3–4 and tonsils 0–2; II = the rest.
 */
export function friedmanStage(ftp: FtpGrade, tonsils: number, bmi: number, craniofacial: boolean): FriedmanStage {
  if (bmi > 40 || craniofacial) return 4;
  const low = ftpLevel(ftp) <= 2;
  const big = tonsils >= 3;
  if (low && big) return 1;
  if (!low && !big) return 3;
  return 2;
}

export const FRIEDMAN_TEXT: Record<FriedmanStage, Text> = {
  1: { es: "Estadio I: posición lingual I–II y amígdalas 3–4 (IMC < 40)", en: "Stage I: tongue position I–II and tonsils 3–4 (BMI < 40)" },
  2: {
    es: "Estadio II: posición lingual I–II con amígdalas 0–2, o III–IV con amígdalas 3–4 (IMC < 40)",
    en: "Stage II: tongue position I–II with tonsils 0–2, or III–IV with tonsils 3–4 (BMI < 40)",
  },
  3: { es: "Estadio III: posición lingual III–IV y amígdalas 0–2 (IMC < 40)", en: "Stage III: tongue position III–IV and tonsils 0–2 (BMI < 40)" },
  4: { es: "Estadio IV: IMC > 40 o deformidad esquelética (micrognatia, hipoplasia mediofacial)", en: "Stage IV: BMI > 40 or skeletal deformity (micrognathia, midface hypoplasia)" },
};

/** Complete when at least the tonsil grade is set; the stage needs tongue position, BMI and the craniofacial question. */
export function scoreExam(input: ExamInput | undefined): ExamScore | null {
  if (!input) return null;
  const brodsky = isGrade(input.brodsky, 0, 4) ? input.brodsky : null;
  const ftp = input.ftp && FTP_GRADES.includes(input.ftp) ? input.ftp : null;
  const bmi = bmiOf(input.weightKg, input.heightCm);
  if (brodsky === null && ftp === null) return null;
  const canStage = brodsky !== null && ftp !== null && typeof input.craniofacial === "boolean" && (bmi !== null || input.craniofacial === true);
  const friedman = canStage ? friedmanStage(ftp!, brodsky!, bmi ?? 0, input.craniofacial === true) : null;
  return { brodsky, ftp, bmi, friedman };
}

// ---------------------------------------------------------------------------------------------
// Adenoids: Parikh 2006 endoscopic grading

export const PARIKH_GRADES: Grade[] = [
  { value: 1, text: { es: "No contacta con estructuras vecinas", en: "Not in contact with adjacent structures" } },
  { value: 2, text: { es: "Contacta con el torus tubárico", en: "In contact with the torus tubarius" } },
  { value: 3, text: { es: "Contacta con el vómer", en: "In contact with the vomer" } },
  { value: 4, text: { es: "Contacta con el paladar blando en reposo", en: "In contact with the soft palate at rest" } },
];

// ---------------------------------------------------------------------------------------------
// Drug-induced sleep endoscopy: VOTE (Kezirian 2011)

export const VOTE_LEVELS = ["velum", "oropharynx", "tongue", "epiglottis"] as const;
export type VoteLevel = (typeof VOTE_LEVELS)[number];
export const VOTE_CONFIGS = ["ap", "lateral", "concentric"] as const;
export type VoteConfig = (typeof VOTE_CONFIGS)[number];
export type VoteDegree = 0 | 1 | 2 | "X";

/** Configurations that can be recorded at each level. */
export const VOTE_ALLOWED: Record<VoteLevel, readonly VoteConfig[]> = {
  velum: ["ap", "lateral", "concentric"],
  oropharynx: ["lateral"],
  tongue: ["ap"],
  epiglottis: ["ap", "lateral"],
};

export const VOTE_LEVEL_TEXT: Record<VoteLevel, Text> = {
  velum: { es: "V · Velo del paladar", en: "V · Velum" },
  oropharynx: { es: "O · Orofaringe (paredes laterales y amígdalas)", en: "O · Oropharynx (lateral walls, tonsils)" },
  tongue: { es: "T · Base de lengua", en: "T · Tongue base" },
  epiglottis: { es: "E · Epiglotis", en: "E · Epiglottis" },
};

export const VOTE_DEGREE_TEXT: Record<"0" | "1" | "2" | "X", Text> = {
  "0": { es: "0 · Sin obstrucción", en: "0 · No obstruction" },
  "1": { es: "1 · Parcial (vibración)", en: "1 · Partial (vibration)" },
  "2": { es: "2 · Completa (colapso)", en: "2 · Complete (collapse)" },
  X: { es: "X · No visualizado", en: "X · Not visualised" },
};

export const VOTE_CONFIG_TEXT: Record<VoteConfig, Text> = {
  ap: { es: "Anteroposterior", en: "Anteroposterior" },
  lateral: { es: "Lateral", en: "Lateral" },
  concentric: { es: "Concéntrica", en: "Concentric" },
};

export type VoteInput = Partial<Record<VoteLevel, { degree?: VoteDegree | null; config?: VoteConfig | null }>>;

export interface VoteScore {
  levels: Record<VoteLevel, { degree: VoteDegree; config: VoteConfig | null }>;
  /** Levels with partial or complete obstruction. */
  obstructed: number;
  /** Compact notation, e.g. "V2c O1 T2 E0". */
  notation: string;
}

const CONFIG_ABBR: Record<VoteConfig, string> = { ap: "ap", lateral: "l", concentric: "c" };
const LEVEL_ABBR: Record<VoteLevel, string> = { velum: "V", oropharynx: "O", tongue: "T", epiglottis: "E" };

/** Complete when the degree of every level is recorded (X allowed). */
export function scoreVote(input: VoteInput | undefined): VoteScore | null {
  if (!input) return null;
  const levels = {} as VoteScore["levels"];
  for (const l of VOTE_LEVELS) {
    const d = input[l]?.degree;
    if (!(d === 0 || d === 1 || d === 2 || d === "X")) return null;
    const c = input[l]?.config;
    levels[l] = { degree: d, config: d === 1 || d === 2 ? (c && VOTE_ALLOWED[l].includes(c) ? c : null) : null };
  }
  const obstructed = VOTE_LEVELS.filter((l) => levels[l].degree === 1 || levels[l].degree === 2).length;
  const notation = VOTE_LEVELS.map((l) => `${LEVEL_ABBR[l]}${levels[l].degree}${levels[l].config ? CONFIG_ABBR[levels[l].config!] : ""}`).join(" ");
  return { levels, obstructed, notation };
}

// ---------------------------------------------------------------------------------------------
// Sleep study: apnoea-hypopnoea index severity (AASM 1999)

export interface SleepStudyInput {
  type?: "psg" | "hsat" | null;
  ahi?: number | null;
  odi?: number | null;
  nadirSpo2?: number | null;
  /** % of recording time with SpO2 < 90 %. */
  ct90?: number | null;
}

export type AhiSeverity = "normal" | "mild" | "moderate" | "severe";

/** Adults: < 5 normal · 5–<15 mild · 15–<30 moderate · ≥ 30 severe (events/h). */
export function ahiSeverity(ahi: number): AhiSeverity {
  return ahi < 5 ? "normal" : ahi < 15 ? "mild" : ahi < 30 ? "moderate" : "severe";
}

export interface SleepStudyScore {
  ahi: number;
  severity: AhiSeverity;
  odi: number | null;
  nadirSpo2: number | null;
  ct90: number | null;
}

export function scoreSleepStudy(input: SleepStudyInput | undefined): SleepStudyScore | null {
  const ahi = finite(input?.ahi);
  if (!input || ahi === null || ahi < 0) return null;
  return { ahi, severity: ahiSeverity(ahi), odi: finite(input.odi), nadirSpo2: finite(input.nadirSpo2), ct90: finite(input.ct90) };
}

// ---------------------------------------------------------------------------------------------
// The whole pack

export const SLEEP_SCALES = ["exam", "adenoid", "vote", "study"] as const;
export type SleepScaleId = (typeof SLEEP_SCALES)[number];

export interface SleepScales {
  exam?: ExamInput;
  adenoid?: { value?: number | null };
  vote?: VoteInput;
  study?: SleepStudyInput;
}

export interface SleepSummary {
  exam?: ExamScore | null;
  adenoid?: number | null;
  vote?: VoteScore | null;
  study?: SleepStudyScore | null;
}

export function summarizeSleep(s: SleepScales): SleepSummary {
  const out: SleepSummary = {};
  if (s.exam) out.exam = scoreExam(s.exam);
  if (s.adenoid) out.adenoid = isGrade(s.adenoid.value, 1, 4) ? s.adenoid.value : null;
  if (s.vote) out.vote = scoreVote(s.vote);
  if (s.study) out.study = scoreSleepStudy(s.study);
  return out;
}

export function incompleteSleepScales(s: SleepScales): SleepScaleId[] {
  const sum = summarizeSleep(s);
  return SLEEP_SCALES.filter((k) => s[k] && (sum[k] === null || sum[k] === undefined));
}

// ---------------------------------------------------------------------------------------------
// References

export const SLEEP_REFERENCES: Record<"brodsky" | "friedman1999" | "friedman2002" | "friedman2004" | "parikh" | "vote" | "aasm", Reference> = {
  brodsky: { citation: "Brodsky L. Modern assessment of tonsils and adenoids. Pediatr Clin North Am. 1989;36(6):1551-69.", doi: "10.1016/s0031-3955(16)36806-7" },
  friedman1999: {
    citation: "Friedman M, Tanyeri H, La Rosa M, et al. Clinical predictors of obstructive sleep apnea. Laryngoscope. 1999;109(12):1901-7.",
    doi: "10.1097/00005537-199912000-00002",
  },
  friedman2002: { citation: "Friedman M, Ibrahim H, Bass L. Clinical staging for sleep-disordered breathing. Otolaryngol Head Neck Surg. 2002;127(1):13-21.", doi: "10.1067/mhn.2002.126477" },
  friedman2004: {
    citation: "Friedman M, Ibrahim H, Joseph NJ. Staging of obstructive sleep apnea/hypopnea syndrome: a guide to appropriate treatment. Laryngoscope. 2004;114(3):454-9.",
    doi: "10.1097/00005537-200403000-00013",
  },
  parikh: {
    citation: "Parikh SR, Coronel M, Lee JJ, Brown SM. Validation of a new grading system for endoscopic examination of adenoid hypertrophy. Otolaryngol Head Neck Surg. 2006;135(5):684-7.",
    doi: "10.1016/j.otohns.2006.05.003",
  },
  vote: { citation: "Kezirian EJ, Hohenhorst W, de Vries N. Drug-induced sleep endoscopy: the VOTE classification. Eur Arch Otorhinolaryngol. 2011;268(8):1233-6.", doi: "10.1007/s00405-011-1633-8" },
  aasm: {
    citation:
      "Sleep-related breathing disorders in adults: recommendations for syndrome definition and measurement techniques in clinical research. The Report of an American Academy of Sleep Medicine Task Force. Sleep. 1999;22(5):667-89.",
    pmid: "10450601",
  },
};

export const SLEEP_SCALE_REFERENCES: Record<SleepScaleId, (keyof typeof SLEEP_REFERENCES)[]> = {
  exam: ["brodsky", "friedman1999", "friedman2002", "friedman2004"],
  adenoid: ["parikh"],
  vote: ["vote"],
  study: ["aasm"],
};
