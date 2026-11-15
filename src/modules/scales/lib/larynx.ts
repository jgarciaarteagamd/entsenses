// ENT Senses Scales — Larynx and swallowing pack: definitions and scoring (pure functions, no I/O).
//
// Grade texts and thresholds come from the publications in `LARYNX_REFERENCES`. Classifications that
// are descriptive (Ni, ELS) are stored as the category the clinician chose: the app attaches no
// benign/malignant label to them. If a definition changes, bump LARYNX_VERSION.
import { SIDES, finite, isGrade, type Grade, type Reference, type Side, type Text } from "./types";

export const LARYNX_VERSION = "larynx-1";

// ---------------------------------------------------------------------------------------------
// Reflux Finding Score (Belafsky 2001): 8 findings, 0–26

export const RFS_ITEMS = [
  "subglotticEdema",
  "ventricularObliteration",
  "erythema",
  "vocalFoldEdema",
  "diffuseEdema",
  "posteriorCommissure",
  "granuloma",
  "mucus",
] as const;
export type RfsItem = (typeof RFS_ITEMS)[number];
export type RfsInput = Partial<Record<RfsItem, number | null>>;

export const RFS_NAMES: Record<RfsItem, Text> = {
  subglotticEdema: { es: "Edema subglótico (pseudosulcus)", en: "Subglottic oedema (pseudosulcus)" },
  ventricularObliteration: { es: "Obliteración ventricular", en: "Ventricular obliteration" },
  erythema: { es: "Eritema / hiperemia", en: "Erythema / hyperaemia" },
  vocalFoldEdema: { es: "Edema de cuerdas vocales", en: "Vocal fold oedema" },
  diffuseEdema: { es: "Edema laríngeo difuso", en: "Diffuse laryngeal oedema" },
  posteriorCommissure: { es: "Hipertrofia de la comisura posterior", en: "Posterior commissure hypertrophy" },
  granuloma: { es: "Granuloma / tejido de granulación", en: "Granuloma / granulation tissue" },
  mucus: { es: "Moco endolaríngeo espeso", en: "Thick endolaryngeal mucus" },
};

const absent: Grade = { value: 0, text: { es: "Ausente", en: "Absent" } };
const present: Grade = { value: 2, text: { es: "Presente", en: "Present" } };
const severity4 = (fourth: Text): Grade[] => [
  absent,
  { value: 1, text: { es: "Leve", en: "Mild" } },
  { value: 2, text: { es: "Moderado", en: "Moderate" } },
  { value: 3, text: { es: "Intenso", en: "Severe" } },
  { value: 4, text: fourth },
];

export const RFS_GRADES: Record<RfsItem, Grade[]> = {
  subglotticEdema: [absent, present],
  ventricularObliteration: [
    absent,
    { value: 2, text: { es: "Parcial", en: "Partial" } },
    { value: 4, text: { es: "Completa", en: "Complete" } },
  ],
  erythema: [
    absent,
    { value: 2, text: { es: "Solo aritenoides", en: "Arytenoids only" } },
    { value: 4, text: { es: "Difuso", en: "Diffuse" } },
  ],
  vocalFoldEdema: severity4({ es: "Polipoideo", en: "Polypoid" }),
  diffuseEdema: severity4({ es: "Obstructivo", en: "Obstructing" }),
  posteriorCommissure: severity4({ es: "Obstructiva", en: "Obstructing" }),
  granuloma: [absent, present],
  mucus: [absent, present],
};

/** In the original study an RFS > 7 was associated with laryngopharyngeal reflux (95% certainty). */
export const RFS_THRESHOLD = 7;

export interface RfsScore {
  total: number;
  aboveThreshold: boolean;
}

export function scoreRfs(input: RfsInput | undefined): RfsScore | null {
  if (!input) return null;
  let total = 0;
  for (const k of RFS_ITEMS) {
    const v = input[k];
    if (typeof v !== "number" || !RFS_GRADES[k].some((g) => g.value === v)) return null;
    total += v;
  }
  return { total, aboveThreshold: total > RFS_THRESHOLD };
}

// ---------------------------------------------------------------------------------------------
// Reinke's oedema — clinical grading of Tan et al. 2017 (per vocal fold, by glottic airway occupied)

export type ReinkeInput = Partial<Record<Side, number | null>> & {
  /** Smoking history in pack-years (optional context). */
  packYears?: number | null;
};

/** 0 = no oedema on that fold (not a Tan grade); 1–4 = Tan grades. */
export const REINKE_GRADES: Grade[] = [
  { value: 0, text: { es: "Sin edema en esta cuerda", en: "No oedema on this fold" } },
  {
    value: 1,
    text: { es: "Degeneración polipoidea mínima, hasta el 25 % de la luz glótica", en: "Minimal polypoid degeneration, up to 25% of the glottic airway" },
  },
  { value: 2, text: { es: "Lesión polipoidea que ocupa del 25 al 50 % de la luz glótica", en: "Polypoid lesion occupying 25–50% of the glottic airway" } },
  { value: 3, text: { es: "Lesión polipoidea que ocupa del 50 al 75 % de la luz glótica", en: "Polypoid lesion occupying 50–75% of the glottic airway" } },
  {
    value: 4,
    text: {
      es: "Lesión obstructiva que ocupa más del 75 % de la luz glótica (la cuerda contralateral no se gradúa)",
      en: "Obstructive lesion occupying more than 75% of the glottic airway (the contralateral fold is not graded)",
    },
  },
];

export interface ReinkeScore {
  right: number | null;
  left: number | null;
  /** Highest grade of the two folds. */
  max: number;
}

export function scoreReinke(input: ReinkeInput | undefined): ReinkeScore | null {
  if (!input) return null;
  const r = isGrade(input.right, 0, 4) ? input.right : null;
  const l = isGrade(input.left, 0, 4) ? input.left : null;
  if (r === 4 || l === 4) return { right: r === 4 ? 4 : null, left: l === 4 ? 4 : null, max: 4 };
  if (r === null || l === null) return null;
  return { right: r, left: l, max: Math.max(r, l) };
}

// ---------------------------------------------------------------------------------------------
// Narrow band imaging: Ni 2011 (IPCL types) and ELS 2016 (vascular changes) — descriptive

export const NI_TYPES = ["I", "II", "III", "IV", "Va", "Vb", "Vc"] as const;
export type NiType = (typeof NI_TYPES)[number];
export const ELS_PATTERNS = ["none", "longitudinal", "perpendicular"] as const;
export type ElsPattern = (typeof ELS_PATTERNS)[number];
export const LARYNX_SITES = ["rightFold", "leftFold", "anteriorCommissure", "supraglottis", "subglottis"] as const;
export type LarynxSite = (typeof LARYNX_SITES)[number];

export interface NbiInput {
  site?: LarynxSite | null;
  leukoplakia?: boolean | null;
  ni?: NiType | null;
  els?: ElsPattern | null;
}

export const NI_TEXT: Record<NiType, Text> = {
  I: {
    es: "Vasos oblicuos y arborescentes de pequeño calibre; asas capilares intraepiteliales (IPCL) casi invisibles",
    en: "Oblique and arborescent vessels of small diameter; intraepithelial papillary capillary loops (IPCL) almost invisible",
  },
  II: { es: "Vasos oblicuos y arborescentes de mayor calibre; IPCL casi invisibles", en: "Oblique and arborescent vessels of larger diameter; IPCL almost invisible" },
  III: { es: "Mucosa blanca (leucoplasia) que oculta las IPCL", en: "White mucosa (leukoplakia) obscuring the IPCL" },
  IV: {
    es: "IPCL visibles como pequeños puntos pardos dispersos, de distribución relativamente regular y baja densidad",
    en: "IPCL visible as small scattered brown dots, relatively regular and of low density",
  },
  Va: { es: "IPCL como puntos pardos sólidos o huecos bien definidos", en: "IPCL as well-defined solid or hollow brown speckles" },
  Vb: {
    es: "IPCL irregulares y tortuosas, con forma de línea (serpiente, lombriz, renacuajo o rama)",
    en: "Irregular, tortuous, line-like IPCL (snake, earthworm, tadpole or branch shapes)",
  },
  Vc: {
    es: "Puntos pardos o líneas tortuosas de distribución irregular sobre la superficie de la lesión",
    en: "Brown speckles or tortuous lines irregularly distributed over the lesion surface",
  },
};

export const ELS_TEXT: Record<ElsPattern, Text> = {
  none: { es: "Sin cambios vasculares", en: "No vascular changes" },
  longitudinal: { es: "Longitudinales (ectasia, meandros, cambios de dirección)", en: "Longitudinal (ectasia, meander, change of direction)" },
  perpendicular: { es: "Perpendiculares (asas vasculares)", en: "Perpendicular (vascular loops)" },
};

export const SITE_TEXT: Record<LarynxSite, Text> = {
  rightFold: { es: "Cuerda vocal derecha", en: "Right vocal fold" },
  leftFold: { es: "Cuerda vocal izquierda", en: "Left vocal fold" },
  anteriorCommissure: { es: "Comisura anterior", en: "Anterior commissure" },
  supraglottis: { es: "Supraglotis", en: "Supraglottis" },
  subglottis: { es: "Subglotis", en: "Subglottis" },
};

export interface NbiScore {
  ni: NiType | null;
  els: ElsPattern | null;
}

/** Complete when at least one of the two classifications has been chosen. */
export function scoreNbi(input: NbiInput | undefined): NbiScore | null {
  if (!input) return null;
  const ni = input.ni && NI_TYPES.includes(input.ni) ? input.ni : null;
  const els = input.els && ELS_PATTERNS.includes(input.els) ? input.els : null;
  return ni || els ? { ni, els } : null;
}

// ---------------------------------------------------------------------------------------------
// Subglottic stenosis — Myer-Cotton 1994 (% obstruction)

export interface StenosisInput {
  /** Maximum percentage of airway obstruction (0–100). */
  obstructionPct?: number | null;
  /** No detectable lumen (grade IV). */
  noLumen?: boolean | null;
}

export const COTTON_TEXT: Record<1 | 2 | 3 | 4, Text> = {
  1: { es: "Grado I: obstrucción de hasta el 50 %", en: "Grade I: up to 50% obstruction" },
  2: { es: "Grado II: obstrucción del 51 al 70 %", en: "Grade II: 51–70% obstruction" },
  3: { es: "Grado III: obstrucción de más del 70 % con luz detectable", en: "Grade III: more than 70% obstruction with any detectable lumen" },
  4: { es: "Grado IV: sin luz detectable", en: "Grade IV: no detectable lumen" },
};

export interface StenosisScore {
  grade: 1 | 2 | 3 | 4;
  pct: number | null;
}

export function scoreStenosis(input: StenosisInput | undefined): StenosisScore | null {
  if (!input) return null;
  if (input.noLumen === true) return { grade: 4, pct: 100 };
  const pct = finite(input.obstructionPct);
  if (pct === null || pct < 0 || pct > 100) return null;
  const grade = pct >= 100 ? 4 : pct <= 50 ? 1 : pct <= 70 ? 2 : 3;
  return { grade, pct };
}

// ---------------------------------------------------------------------------------------------
// Swallowing (FEES): Murray secretion scale, Penetration-Aspiration Scale and Yale residue by
// consistency, Functional Oral Intake Scale

export const MURRAY_GRADES: Grade[] = [
  {
    value: 0,
    text: {
      es: "Sin secreciones visibles, o secreciones transitorias en valléculas y senos piriformes sin acúmulo bilateral",
      en: "No visible secretions, or transient secretions in the valleculae and pyriform sinuses not bilaterally pooled",
    },
  },
  {
    value: 1,
    text: {
      es: "Secreciones acumuladas (bilaterales o profundas) en los canales que rodean el vestíbulo laríngeo, valléculas o senos piriformes",
      en: "Secretions bilaterally or deeply pooled in the channels around the laryngeal vestibule, valleculae or pyriform sinuses",
    },
  },
  {
    value: 2,
    text: { es: "Secreciones que pasan del nivel 1 al nivel 3 durante la observación", en: "Secretions that change from level 1 to level 3 during the observation" },
  },
  {
    value: 3,
    text: { es: "Secreciones dentro del vestíbulo laríngeo", en: "Secretions within the laryngeal vestibule" },
  },
];

export const PAS_GRADES: Grade[] = [
  { value: 1, text: { es: "El material no entra en la vía aérea", en: "Material does not enter the airway" } },
  {
    value: 2,
    text: { es: "Entra en la vía aérea, queda por encima de las cuerdas vocales y se expulsa", en: "Enters the airway, remains above the vocal folds and is ejected" },
  },
  {
    value: 3,
    text: { es: "Entra en la vía aérea, queda por encima de las cuerdas vocales y no se expulsa", en: "Enters the airway, remains above the vocal folds and is not ejected" },
  },
  { value: 4, text: { es: "Contacta con las cuerdas vocales y se expulsa", en: "Contacts the vocal folds and is ejected" } },
  { value: 5, text: { es: "Contacta con las cuerdas vocales y no se expulsa", en: "Contacts the vocal folds and is not ejected" } },
  {
    value: 6,
    text: {
      es: "Pasa por debajo de las cuerdas vocales y se expulsa a la laringe o fuera de la vía aérea",
      en: "Passes below the vocal folds and is ejected into the larynx or out of the airway",
    },
  },
  {
    value: 7,
    text: { es: "Pasa por debajo de las cuerdas vocales y no se expulsa de la tráquea pese al esfuerzo", en: "Passes below the vocal folds and is not ejected from the trachea despite effort" },
  },
  { value: 8, text: { es: "Pasa por debajo de las cuerdas vocales sin ningún esfuerzo por expulsarlo", en: "Passes below the vocal folds and no effort is made to eject" } },
];

export const YALE_VALLECULA: Grade[] = [
  { value: 1, text: { es: "Ninguno", en: "None" } },
  { value: 2, text: { es: "Trazas: capa fina sobre la mucosa", en: "Trace: trace coating of the mucosa" } },
  { value: 3, text: { es: "Leve: el ligamento glosoepiglótico medio sigue visible", en: "Mild: epiglottic ligament visible" } },
  { value: 4, text: { es: "Moderado: el ligamento glosoepiglótico medio queda cubierto", en: "Moderate: epiglottic ligament covered" } },
  { value: 5, text: { es: "Grave: llena la vallécula hasta el borde de la epiglotis", en: "Severe: filled to the epiglottic rim" } },
];

export const YALE_PYRIFORM: Grade[] = [
  { value: 1, text: { es: "Ninguno", en: "None" } },
  { value: 2, text: { es: "Trazas: capa fina sobre la mucosa", en: "Trace: trace coating of the mucosa" } },
  { value: 3, text: { es: "Leve: sube por la pared, hasta una cuarta parte del seno", en: "Mild: up the wall, up to a quarter full" } },
  { value: 4, text: { es: "Moderado: sube por la pared, hasta la mitad del seno", en: "Moderate: up the wall, up to half full" } },
  { value: 5, text: { es: "Grave: llena el seno hasta el pliegue aritenoepiglótico", en: "Severe: filled to the aryepiglottic fold" } },
];

export const FOIS_GRADES: Grade[] = [
  { value: 1, text: { es: "Nada por boca", en: "Nothing by mouth" } },
  { value: 2, text: { es: "Dependiente de sonda, con intentos mínimos de comida o líquido", en: "Tube dependent with minimal attempts of food or liquid" } },
  { value: 3, text: { es: "Dependiente de sonda, con ingesta oral constante de comida o líquido", en: "Tube dependent with consistent oral intake of food or liquid" } },
  { value: 4, text: { es: "Dieta oral total de una sola consistencia", en: "Total oral diet of a single consistency" } },
  {
    value: 5,
    text: {
      es: "Dieta oral total de varias consistencias, con preparación especial o compensaciones",
      en: "Total oral diet with multiple consistencies requiring special preparation or compensations",
    },
  },
  {
    value: 6,
    text: {
      es: "Dieta oral total de varias consistencias sin preparación especial, con limitaciones de alimentos concretos",
      en: "Total oral diet with multiple consistencies without special preparation, but with specific food limitations",
    },
  },
  { value: 7, text: { es: "Dieta oral total sin restricciones", en: "Total oral diet with no restrictions" } },
];

export const CONSISTENCIES = ["thin", "thick", "puree", "solid"] as const;
export type Consistency = (typeof CONSISTENCIES)[number];

export const CONSISTENCY_TEXT: Record<Consistency, Text> = {
  thin: { es: "Líquido fino (IDDSI 0)", en: "Thin liquid (IDDSI 0)" },
  thick: { es: "Líquido espesado (IDDSI 2–3)", en: "Thickened liquid (IDDSI 2–3)" },
  puree: { es: "Puré (IDDSI 4)", en: "Purée (IDDSI 4)" },
  solid: { es: "Sólido (IDDSI 7)", en: "Solid (IDDSI 7)" },
};

export interface BolusInput {
  pas?: number | null;
  yaleV?: number | null;
  yaleP?: number | null;
}
export type FeesInput = Partial<Record<Consistency, BolusInput>>;

export type PasClass = "none" | "penetration" | "aspiration";

export interface FeesScore {
  /** Worst (highest) score among the consistencies tested. */
  pas: number | null;
  pasClass: PasClass | null;
  /** Consistency with the worst PAS. */
  pasConsistency: Consistency | null;
  yaleV: number | null;
  yaleP: number | null;
}

export const pasClass = (pas: number): PasClass => (pas <= 1 ? "none" : pas <= 5 ? "penetration" : "aspiration");

/** Complete when at least one consistency has a PAS or a Yale score. */
export function scoreFees(input: FeesInput | undefined): FeesScore | null {
  if (!input) return null;
  let pas: number | null = null;
  let pasConsistency: Consistency | null = null;
  let yaleV: number | null = null;
  let yaleP: number | null = null;
  for (const c of CONSISTENCIES) {
    const b = input[c];
    if (!b) continue;
    if (isGrade(b.pas, 1, 8) && (pas === null || b.pas > pas)) {
      pas = b.pas;
      pasConsistency = c;
    }
    if (isGrade(b.yaleV, 1, 5)) yaleV = Math.max(yaleV ?? 0, b.yaleV);
    if (isGrade(b.yaleP, 1, 5)) yaleP = Math.max(yaleP ?? 0, b.yaleP);
  }
  if (pas === null && yaleV === null && yaleP === null) return null;
  return { pas, pasClass: pas === null ? null : pasClass(pas), pasConsistency, yaleV, yaleP };
}

// ---------------------------------------------------------------------------------------------
// Voice (snapshot of an ENT Senses Voice result with the same label)

export interface VoiceSnapshot {
  resultId?: string | null;
  /** ISO date of the Voice result. */
  date?: string | null;
  avqi?: number | null;
  cpps?: number | null;
  f0?: number | null;
  mpt?: number | null;
  grbasG?: number | null;
  /** Whether G comes from the clinician's rating or from the acoustic estimate. */
  gSource?: "clinician" | "estimate" | null;
}

// ---------------------------------------------------------------------------------------------
// The whole pack

export const LARYNX_SCALES = ["rfs", "reinke", "nbi", "stenosis", "voice", "secretions", "fees", "fois"] as const;
export type LarynxScaleId = (typeof LARYNX_SCALES)[number];

export interface LarynxScales {
  rfs?: RfsInput;
  reinke?: ReinkeInput;
  nbi?: NbiInput;
  stenosis?: StenosisInput;
  voice?: VoiceSnapshot;
  secretions?: { value?: number | null };
  fees?: FeesInput;
  fois?: { value?: number | null };
}

export interface LarynxSummary {
  rfs?: RfsScore | null;
  reinke?: ReinkeScore | null;
  packYears?: number | null;
  nbi?: NbiScore | null;
  stenosis?: StenosisScore | null;
  voice?: { avqi: number | null; cpps: number | null; f0: number | null; grbasG: number | null; date: string | null } | null;
  secretions?: number | null;
  fees?: FeesScore | null;
  fois?: number | null;
}

export function summarizeLarynx(s: LarynxScales): LarynxSummary {
  const out: LarynxSummary = {};
  if (s.rfs) out.rfs = scoreRfs(s.rfs);
  if (s.reinke) {
    out.reinke = scoreReinke(s.reinke);
    const py = finite(s.reinke.packYears);
    if (py !== null) out.packYears = py;
  }
  if (s.nbi) out.nbi = scoreNbi(s.nbi);
  if (s.stenosis) out.stenosis = scoreStenosis(s.stenosis);
  if (s.voice) {
    const v = s.voice;
    const has = [v.avqi, v.cpps, v.f0, v.grbasG].some((x) => finite(x) !== null);
    out.voice = has ? { avqi: finite(v.avqi), cpps: finite(v.cpps), f0: finite(v.f0), grbasG: finite(v.grbasG), date: v.date ?? null } : null;
  }
  if (s.secretions) out.secretions = isGrade(s.secretions.value, 0, 3) ? s.secretions.value : null;
  if (s.fees) out.fees = scoreFees(s.fees);
  if (s.fois) out.fois = isGrade(s.fois.value, 1, 7) ? s.fois.value : null;
  return out;
}

export function incompleteLarynxScales(s: LarynxScales): LarynxScaleId[] {
  const sum = summarizeLarynx(s);
  return LARYNX_SCALES.filter((k) => s[k] && (sum[k] === null || sum[k] === undefined));
}

// ---------------------------------------------------------------------------------------------
// References

export const LARYNX_REFERENCES: Record<
  "rfs" | "tan" | "ni" | "niIV" | "els" | "cotton" | "murray" | "pas" | "yale" | "fois",
  Reference
> = {
  rfs: {
    citation: "Belafsky PC, Postma GN, Koufman JA. The validity and reliability of the reflux finding score (RFS). Laryngoscope. 2001;111(8):1313-7.",
    doi: "10.1097/00005537-200108000-00001",
  },
  tan: {
    citation: "Tan M, Bryson PC, Pitts C, Woo P, Benninger MS. Clinical grading of Reinke's edema. Laryngoscope. 2017;127(10):2310-2313.",
    doi: "10.1002/lary.26647",
  },
  ni: {
    citation:
      "Ni XG, He S, Xu ZG, et al. Endoscopic diagnosis of laryngeal cancer and precancerous lesions by narrow band imaging. J Laryngol Otol. 2011;125(3):288-96.",
    doi: "10.1017/S0022215110002033",
  },
  niIV: {
    citation:
      "Staníková L, Kántor P, Fedorová K, Zeleník K, Komínek P. Clinical significance of type IV vascularization of laryngeal lesions according to the Ni classification. Front Oncol. 2024;14:1222827.",
    doi: "10.3389/fonc.2024.1222827",
  },
  els: {
    citation:
      "Arens C, Piazza C, Andrea M, et al. Proposal for a descriptive guideline of vascular changes in lesions of the vocal folds by the committee on endoscopic laryngeal imaging of the European Laryngological Society. Eur Arch Otorhinolaryngol. 2016;273(5):1207-14.",
    doi: "10.1007/s00405-015-3851-y",
  },
  cotton: {
    citation: "Myer CM 3rd, O'Connor DM, Cotton RT. Proposed grading system for subglottic stenosis based on endotracheal tube sizes. Ann Otol Rhinol Laryngol. 1994;103(4 Pt 1):319-23.",
    doi: "10.1177/000348949410300410",
  },
  murray: {
    citation:
      "Murray J, Langmore SE, Ginsberg S, Dostie A. The significance of accumulated oropharyngeal secretions and swallowing frequency in predicting aspiration. Dysphagia. 1996;11(2):99-103.",
    doi: "10.1007/BF00417898",
  },
  pas: {
    citation: "Rosenbek JC, Robbins JA, Roecker EB, Coyle JL, Wood JL. A penetration-aspiration scale. Dysphagia. 1996;11(2):93-8.",
    doi: "10.1007/BF00417897",
  },
  yale: {
    citation:
      "Neubauer PD, Rademaker AW, Leder SB. The Yale Pharyngeal Residue Severity Rating Scale: an anatomically defined and image-based tool. Dysphagia. 2015;30(5):521-8.",
    doi: "10.1007/s00455-015-9631-4",
  },
  fois: {
    citation:
      "Crary MA, Mann GD, Groher ME. Initial psychometric assessment of a functional oral intake scale for dysphagia in stroke patients. Arch Phys Med Rehabil. 2005;86(8):1516-20.",
    doi: "10.1016/j.apmr.2004.11.049",
  },
};

export const LARYNX_SCALE_REFERENCES: Record<LarynxScaleId, (keyof typeof LARYNX_REFERENCES)[]> = {
  rfs: ["rfs"],
  reinke: ["tan"],
  nbi: ["ni", "niIV", "els"],
  stenosis: ["cotton"],
  voice: [],
  secretions: ["murray"],
  fees: ["pas", "yale"],
  fois: ["fois"],
};

export { SIDES };
