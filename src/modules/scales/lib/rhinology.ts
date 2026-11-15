// ENT Senses Scales — Rhinology pack: definitions and scoring (pure functions, no I/O).
//
// Every grade text and threshold comes from the publication cited in `RHINOLOGY_REFERENCES`.
// Nothing here adds interpretation of its own: the functions add up the grades and apply the
// published rules. If a definition changes, bump RHINOLOGY_VERSION (stored with each row).
import { SIDES, isGrade as isGradeIn, type Grade, type Reference, type Side, type SidedScore, type Text } from "./types";

export { SIDES };
export type { Grade, Reference, Side, SidedScore };

export const RHINOLOGY_VERSION = "rhinology-1";

const isGrade = (v: unknown, max: number): v is number => isGradeIn(v, 0, max);

// ---------------------------------------------------------------------------------------------
// Nasal Polyp Score (0–4 per side)

export type NpsInput = Partial<Record<Side, number | null>>;

export const NPS_GRADES: Grade[] = [
  { value: 0, text: { es: "Sin pólipos", en: "No polyps" } },
  {
    value: 1,
    text: {
      es: "Pólipos pequeños en el meato medio que no sobrepasan el borde inferior del cornete medio",
      en: "Small polyps in the middle meatus not reaching below the inferior border of the middle turbinate",
    },
  },
  {
    value: 2,
    text: {
      es: "Pólipos que sobrepasan el borde inferior del cornete medio",
      en: "Polyps reaching below the lower border of the middle turbinate",
    },
  },
  {
    value: 3,
    text: {
      es: "Pólipos grandes que alcanzan el borde inferior del cornete inferior, o pólipos mediales al cornete medio",
      en: "Large polyps reaching the lower border of the inferior turbinate, or polyps medial to the middle turbinate",
    },
  },
  {
    value: 4,
    text: {
      es: "Pólipos grandes que obstruyen por completo la parte inferior de la fosa nasal",
      en: "Large polyps causing complete obstruction of the inferior nasal cavity",
    },
  },
];

export function scoreNps(input: NpsInput | undefined): SidedScore | null {
  if (!input || !isGrade(input.right, 4) || !isGrade(input.left, 4)) return null;
  return { right: input.right, left: input.left, total: input.right + input.left };
}

// ---------------------------------------------------------------------------------------------
// Lund-Kennedy endoscopic score (original: 5 items; modified: polyps, oedema, discharge)

export const LK_ITEMS = ["polyps", "edema", "discharge", "scarring", "crusting"] as const;
export type LkItem = (typeof LK_ITEMS)[number];
export const MLK_ITEMS: readonly LkItem[] = ["polyps", "edema", "discharge"];

export type LkInput = Partial<Record<Side, Partial<Record<LkItem, number | null>>>>;

export const LK_NAMES: Record<LkItem, Text> = {
  polyps: { es: "Pólipos", en: "Polyps" },
  edema: { es: "Edema", en: "Oedema" },
  discharge: { es: "Secreción", en: "Discharge" },
  scarring: { es: "Cicatrices", en: "Scarring" },
  crusting: { es: "Costras", en: "Crusting" },
};

export const LK_GRADES: Record<LkItem, Grade[]> = {
  polyps: [
    { value: 0, text: { es: "Ausentes", en: "Absent" } },
    { value: 1, text: { es: "Limitados al meato medio", en: "Confined to the middle meatus" } },
    { value: 2, text: { es: "Más allá del meato medio", en: "Beyond the middle meatus" } },
  ],
  edema: [
    { value: 0, text: { es: "Ausente", en: "Absent" } },
    { value: 1, text: { es: "Leve", en: "Mild" } },
    { value: 2, text: { es: "Intenso", en: "Severe" } },
  ],
  discharge: [
    { value: 0, text: { es: "Ausente", en: "None" } },
    { value: 1, text: { es: "Fina y clara", en: "Clear, thin" } },
    { value: 2, text: { es: "Espesa y purulenta", en: "Thick, purulent" } },
  ],
  scarring: [
    { value: 0, text: { es: "Ausentes", en: "Absent" } },
    { value: 1, text: { es: "Leves", en: "Mild" } },
    { value: 2, text: { es: "Intensas", en: "Severe" } },
  ],
  crusting: [
    { value: 0, text: { es: "Ausentes", en: "Absent" } },
    { value: 1, text: { es: "Leves", en: "Mild" } },
    { value: 2, text: { es: "Intensas", en: "Severe" } },
  ],
};

function sumItems(input: LkInput | undefined, items: readonly LkItem[]): SidedScore | null {
  if (!input) return null;
  const side = (s: Side) => {
    const v = input[s];
    if (!v) return null;
    let sum = 0;
    for (const k of items) {
      const g = v[k];
      if (!isGrade(g, 2)) return null;
      sum += g;
    }
    return sum;
  };
  const right = side("right");
  const left = side("left");
  return right === null || left === null ? null : { right, left, total: right + left };
}

/** Original Lund-Kennedy (0–10 per side): needs all five items on both sides. */
export const scoreLundKennedy = (input: LkInput | undefined) => sumItems(input, LK_ITEMS);
/** Modified Lund-Kennedy (0–6 per side): polyps, oedema and discharge only. */
export const scoreModifiedLundKennedy = (input: LkInput | undefined) => sumItems(input, MLK_ITEMS);

// ---------------------------------------------------------------------------------------------
// Lund-Mackay CT score (5 sinuses 0/1/2 + ostiomeatal complex 0/2, per side)

export const LM_SINUSES = ["maxillary", "anteriorEthmoid", "posteriorEthmoid", "sphenoid", "frontal"] as const;
export type LmSinus = (typeof LM_SINUSES)[number];
export type LmItem = LmSinus | "omc";
export const LM_ITEMS: readonly LmItem[] = [...LM_SINUSES, "omc"];

export type LmInput = Partial<Record<Side, Partial<Record<LmItem, number | null>>>>;

export const LM_NAMES: Record<LmItem, Text> = {
  maxillary: { es: "Maxilar", en: "Maxillary" },
  anteriorEthmoid: { es: "Etmoides anterior", en: "Anterior ethmoid" },
  posteriorEthmoid: { es: "Etmoides posterior", en: "Posterior ethmoid" },
  sphenoid: { es: "Esfenoides", en: "Sphenoid" },
  frontal: { es: "Frontal", en: "Frontal" },
  omc: { es: "Complejo ostiomeatal", en: "Ostiomeatal complex" },
};

export const LM_SINUS_GRADES: Grade[] = [
  { value: 0, text: { es: "Sin alteraciones", en: "No abnormality" } },
  { value: 1, text: { es: "Opacificación parcial", en: "Partial opacification" } },
  { value: 2, text: { es: "Opacificación total", en: "Total opacification" } },
];

export const LM_OMC_GRADES: Grade[] = [
  { value: 0, text: { es: "No ocluido", en: "Not occluded" } },
  { value: 2, text: { es: "Ocluido", en: "Occluded" } },
];

export const lmGrades = (item: LmItem) => (item === "omc" ? LM_OMC_GRADES : LM_SINUS_GRADES);

export function scoreLundMackay(input: LmInput | undefined): SidedScore | null {
  if (!input) return null;
  const side = (s: Side) => {
    const v = input[s];
    if (!v) return null;
    let sum = 0;
    for (const k of LM_ITEMS) {
      const g = v[k];
      if (k === "omc" ? !(g === 0 || g === 2) : !isGrade(g, 2)) return null;
      sum += g as number;
    }
    return sum;
  };
  const right = side("right");
  const left = side("left");
  return right === null || left === null ? null : { right, left, total: right + left };
}

// ---------------------------------------------------------------------------------------------
// EPOS 2020 — current clinical control of CRS

export const CONTROL_ITEMS = ["blockage", "discharge", "facialPain", "smell", "sleep", "endoscopy", "rescue"] as const;
export type ControlItem = (typeof CONTROL_ITEMS)[number];
export type ControlInput = Partial<Record<ControlItem, boolean | null>>;
export type ControlLevel = "controlled" | "partly" | "uncontrolled";

export const CONTROL_TEXT: Record<ControlItem, Text> = {
  blockage: {
    es: "Obstrucción nasal la mayoría de los días de la semana",
    en: "Nasal blockage on most days of the week",
  },
  discharge: {
    es: "Rinorrea o goteo posnasal mucopurulento la mayoría de los días",
    en: "Mucopurulent rhinorrhoea or postnasal drip on most days",
  },
  facialPain: {
    es: "Dolor o presión facial la mayoría de los días",
    en: "Facial pain or pressure on most days",
  },
  smell: { es: "Olfato alterado", en: "Impaired smell" },
  sleep: { es: "Alteración del sueño o cansancio", en: "Sleep disturbance or fatigue" },
  endoscopy: {
    es: "Mucosa enferma en la endoscopia (pólipos, secreción mucopurulenta o mucosa inflamada)",
    en: "Diseased mucosa on endoscopy (nasal polyps, mucopurulent secretions or inflamed mucosa)",
  },
  rescue: {
    es: "Tratamiento de rescate en los últimos 6 meses (ciclo de corticoide sistémico o de antibiótico)",
    en: "Rescue treatment in the last 6 months (course of systemic corticosteroids or antibiotics)",
  },
};

export interface ControlScore {
  present: number;
  level: ControlLevel;
}

/** Controlled: none present · partly controlled: 1–2 · uncontrolled: ≥3. Needs all 7 answered. */
export function scoreControl(input: ControlInput | undefined): ControlScore | null {
  if (!input) return null;
  let present = 0;
  for (const k of CONTROL_ITEMS) {
    const v = input[k];
    if (typeof v !== "boolean") return null;
    if (v) present++;
  }
  return { present, level: present === 0 ? "controlled" : present >= 3 ? "uncontrolled" : "partly" };
}

// ---------------------------------------------------------------------------------------------
// EPOS/EUFOREA 2023 — indication for biologics in CRSwNP

export const BIOLOGIC_THRESHOLDS = {
  tissueEos: 10, // eosinophils per high-power field
  bloodEos: 150, // cells/µL (≥250 in EPOS 2020)
  totalIge: 100, // IU/mL (kU/L)
  steroidCourses: 2, // systemic courses in the last year
  snot22: 40,
  requiredWithSurgery: 3,
  requiredWithoutSurgery: 4,
} as const;

export const BIOLOGIC_CRITERIA = ["type2", "steroids", "snot22", "smell", "asthma"] as const;
export type BiologicCriterion = (typeof BIOLOGIC_CRITERIA)[number];

export const SMELL_TESTS = ["sniffin", "bast24", "upsit", "other"] as const;
export type SmellTest = (typeof SMELL_TESTS)[number];

export interface BiologicInput {
  bilateralPolyps?: boolean | null;
  priorSurgery?: boolean | null;
  tissueEos?: number | null;
  bloodEos?: number | null;
  totalIge?: number | null;
  steroidCourses?: number | null;
  steroidLongTerm?: boolean | null;
  steroidContraindicated?: boolean | null;
  /** Filled in from the pack's SNOT-22 section by summarizeRhinology. */
  snot22?: number | null;
  anosmia?: boolean | null;
  smellTest?: SmellTest | null;
  smellScore?: number | null;
  asthma?: boolean | null;
}

export const BIOLOGIC_TEXT: Record<BiologicCriterion, Text> = {
  type2: {
    es: "Inflamación tipo 2: eosinófilos en tejido ≥10/CGA, eosinófilos en sangre ≥150/µL o IgE total ≥100 UI/mL",
    en: "Type 2 inflammation: tissue eosinophils ≥10/HPF, blood eosinophils ≥150/µL or total IgE ≥100 IU/mL",
  },
  steroids: {
    es: "Necesidad de corticoides sistémicos (≥2 ciclos al año o tratamiento prolongado >3 meses) o contraindicación",
    en: "Need for systemic corticosteroids (≥2 courses per year or long-term >3 months) or contraindication",
  },
  snot22: { es: "Calidad de vida muy afectada: SNOT-22 ≥40", en: "Significantly impaired quality of life: SNOT-22 ≥40" },
  smell: { es: "Pérdida de olfato importante: anosmia en una prueba olfatoria", en: "Significant loss of smell: anosmic on a smell test" },
  asthma: {
    es: "Asma comórbida que necesita corticoide inhalado de forma regular",
    en: "Comorbid asthma needing regular inhaled corticosteroids",
  },
};

export interface BiologicScore {
  criteria: Record<BiologicCriterion, boolean>;
  met: number;
  required: number;
  /** Bilateral polyps and enough criteria. */
  meets: boolean;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function scoreBiologic(input: BiologicInput | undefined): BiologicScore | null {
  if (!input || typeof input.bilateralPolyps !== "boolean" || typeof input.priorSurgery !== "boolean") return null;
  const t = BIOLOGIC_THRESHOLDS;
  const tissue = num(input.tissueEos);
  const blood = num(input.bloodEos);
  const ige = num(input.totalIge);
  const courses = num(input.steroidCourses);
  const snot = num(input.snot22);
  const criteria: Record<BiologicCriterion, boolean> = {
    type2: (tissue !== null && tissue >= t.tissueEos) || (blood !== null && blood >= t.bloodEos) || (ige !== null && ige >= t.totalIge),
    steroids: (courses !== null && courses >= t.steroidCourses) || input.steroidLongTerm === true || input.steroidContraindicated === true,
    snot22: snot !== null && snot >= t.snot22,
    smell: input.anosmia === true,
    asthma: input.asthma === true,
  };
  const met = BIOLOGIC_CRITERIA.filter((k) => criteria[k]).length;
  const required = input.priorSurgery ? t.requiredWithSurgery : t.requiredWithoutSurgery;
  return { criteria, met, required, meets: input.bilateralPolyps && met >= required };
}

// ---------------------------------------------------------------------------------------------
// EPOS/EUFOREA 2023 — response to biologics

export const RESPONSE_CRITERIA = ["polyps", "rescue", "qol", "smell", "comorbidities"] as const;
export type ResponseCriterion = (typeof RESPONSE_CRITERIA)[number];
export const TIMEPOINTS = ["6m", "12m", "annual"] as const;
export type Timepoint = (typeof TIMEPOINTS)[number];
export const BIOLOGICS = ["dupilumab", "omalizumab", "mepolizumab", "other"] as const;
export type Biologic = (typeof BIOLOGICS)[number];
export type ResponseLevel = "none" | "poor_moderate" | "good_excellent";

/** Minimal clinically important difference of the SNOT-22 (Hopkins 2009). Reference only. */
export const SNOT22_MCID = 8.9;

export interface ResponseInput {
  timepoint?: Timepoint | null;
  biologic?: Biologic | null;
  /** Earlier assessment (same label) used as the baseline for the deltas shown on screen. */
  baselineId?: string | null;
  polyps?: boolean | null;
  rescue?: boolean | null;
  qol?: boolean | null;
  smell?: boolean | null;
  /** null = not answered; "none" = the patient has no comorbidities (criterion not applicable). */
  comorbidities?: "improved" | "not_improved" | "none" | null;
}

export const RESPONSE_TEXT: Record<ResponseCriterion, Text> = {
  polyps: { es: "Menor tamaño de los pólipos", en: "Reduced nasal polyp size" },
  rescue: {
    es: "Menor necesidad de corticoides sistémicos (o de cirugía)",
    en: "Reduced need for systemic corticosteroids (or surgery)",
  },
  qol: { es: "Mejor calidad de vida", en: "Improved quality of life" },
  smell: { es: "Mejor olfato", en: "Improved sense of smell" },
  comorbidities: { es: "Menor impacto de las comorbilidades", en: "Reduced impact of comorbidities" },
};

export interface ResponseScore {
  met: number;
  /** 5, or 4 when the patient has no comorbidities. */
  possible: number;
  level: ResponseLevel;
}

/** No response: 0 criteria · poor–moderate: 1–3 · good–excellent: 4–5. Needs all answered. */
export function scoreResponse(input: ResponseInput | undefined): ResponseScore | null {
  if (!input) return null;
  const flags = [input.polyps, input.rescue, input.qol, input.smell];
  if (flags.some((f) => typeof f !== "boolean") || !input.comorbidities) return null;
  let met = flags.filter(Boolean).length;
  if (input.comorbidities === "improved") met++;
  const possible = input.comorbidities === "none" ? 4 : 5;
  return { met, possible, level: met === 0 ? "none" : met >= 4 ? "good_excellent" : "poor_moderate" };
}

// ---------------------------------------------------------------------------------------------
// The whole pack

export const RHINOLOGY_SCALES = ["nps", "lundKennedy", "lundMackay", "snot22", "control", "biologic", "response"] as const;
export type RhinologyScaleId = (typeof RHINOLOGY_SCALES)[number];

/** SNOT-22 total (0–110), typed in or brought from a Quest response with the same label. */
export interface Snot22Input {
  value?: number | null;
  /** Date of the Quest response it was taken from (ISO), if any. */
  date?: string | null;
}

export function validSnot22(v: unknown): number | null {
  const n = num(v);
  return n !== null && Number.isInteger(n) && n >= 0 && n <= 110 ? n : null;
}

export interface RhinologyScales {
  nps?: NpsInput;
  snot22?: Snot22Input;
  lundKennedy?: LkInput;
  lundMackay?: LmInput;
  control?: ControlInput;
  biologic?: BiologicInput;
  response?: ResponseInput;
}

export interface RhinologySummary {
  nps?: SidedScore | null;
  lk?: SidedScore | null;
  mlk?: SidedScore | null;
  lm?: SidedScore | null;
  control?: ControlScore | null;
  biologic?: BiologicScore | null;
  response?: ResponseScore | null;
  snot22?: number | null;
}

/** Scores of the scales included in the assessment (null = included but incomplete). */
export function summarizeRhinology(s: RhinologyScales): RhinologySummary {
  const out: RhinologySummary = {};
  if (s.nps) out.nps = scoreNps(s.nps);
  if (s.lundKennedy) {
    out.lk = scoreLundKennedy(s.lundKennedy);
    out.mlk = scoreModifiedLundKennedy(s.lundKennedy);
  }
  if (s.lundMackay) out.lm = scoreLundMackay(s.lundMackay);
  const snot = s.snot22 ? validSnot22(s.snot22.value) : null;
  if (s.snot22) out.snot22 = snot;
  if (s.control) out.control = scoreControl(s.control);
  if (s.biologic) out.biologic = scoreBiologic({ ...s.biologic, snot22: snot });
  if (s.response) out.response = scoreResponse(s.response);
  return out;
}

/** Scales included but not fully rated (the doctor is warned before saving). */
export function incompleteScales(s: RhinologyScales): RhinologyScaleId[] {
  const sum = summarizeRhinology(s);
  const out: RhinologyScaleId[] = [];
  if (s.nps && !sum.nps) out.push("nps");
  if (s.lundKennedy && !sum.mlk) out.push("lundKennedy");
  if (s.lundMackay && !sum.lm) out.push("lundMackay");
  if (s.snot22 && sum.snot22 === null) out.push("snot22");
  if (s.control && !sum.control) out.push("control");
  if (s.biologic && !sum.biologic) out.push("biologic");
  if (s.response && !sum.response) out.push("response");
  return out;
}

// ---------------------------------------------------------------------------------------------
// References

export const RHINOLOGY_REFERENCES: Record<"nps" | "lk" | "mlk" | "lm" | "epos2020" | "biologics2023" | "snot22", Reference> = {
  nps: {
    citation:
      "Gevaert P, Calus L, Van Zele T, et al. Omalizumab is effective in allergic and nonallergic patients with nasal polyps and asthma. J Allergy Clin Immunol. 2013;131(1):110-6.",
    doi: "10.1016/j.jaci.2012.07.047",
  },
  lk: {
    citation: "Lund VJ, Kennedy DW. Staging for rhinosinusitis. Otolaryngol Head Neck Surg. 1997;117(3 Pt 2):S35-40.",
    doi: "10.1016/S0194-59989770005-6",
  },
  mlk: {
    citation:
      "Psaltis AJ, Li G, Vaezeafshar R, Cho KS, Hwang PH. Modification of the Lund-Kennedy endoscopic scoring system improves its reliability and correlation with patient-reported outcome measures. Laryngoscope. 2014;124(10):2216-23.",
    doi: "10.1002/lary.24654",
  },
  lm: { citation: "Lund VJ, Mackay IS. Staging in rhinosinusitis. Rhinology. 1993;31(4):183-4.", pmid: "8140385" },
  epos2020: {
    citation:
      "Fokkens WJ, Lund VJ, Hopkins C, et al. European Position Paper on Rhinosinusitis and Nasal Polyps 2020. Rhinology. 2020;58(Suppl S29):1-464.",
    doi: "10.4193/Rhin20.600",
  },
  biologics2023: {
    citation:
      "Fokkens WJ, Viskens AS, Backer V, et al. EPOS/EUFOREA update on indication and evaluation of Biologics in Chronic Rhinosinusitis with Nasal Polyps 2023. Rhinology. 2023;61(3):194-202.",
    doi: "10.4193/Rhin22.489",
  },
  snot22: {
    citation:
      "Hopkins C, Gillett S, Slack R, Lund VJ, Browne JP. Psychometric validity of the 22-item Sinonasal Outcome Test. Clin Otolaryngol. 2009;34(5):447-54.",
    doi: "10.1111/j.1749-4486.2009.01995.x",
  },
};

/** References printed for each scale. */
export const SCALE_REFERENCES: Record<RhinologyScaleId, (keyof typeof RHINOLOGY_REFERENCES)[]> = {
  nps: ["nps"],
  lundKennedy: ["lk", "mlk"],
  lundMackay: ["lm"],
  snot22: ["snot22"],
  control: ["epos2020"],
  biologic: ["biologics2023"],
  response: ["biologics2023", "snot22"],
};
