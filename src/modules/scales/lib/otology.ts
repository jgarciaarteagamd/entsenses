// ENT Senses Scales — Otology and skull base pack: definitions and scoring (pure functions, no I/O).
//
// Grade texts and rules come from the publications in `OTOLOGY_REFERENCES`. If a definition changes,
// bump OTOLOGY_VERSION.
import { SIDES, finite, isGrade, type Grade, type Reference, type Side, type Text } from "./types";

export const OTOLOGY_VERSION = "otology-1";

// ---------------------------------------------------------------------------------------------
// Facial nerve: House-Brackmann 1985 (I–VI)

export interface HouseBrackmannInput {
  side?: Side | null;
  grade?: number | null;
}

export const HB_GRADES: Grade[] = [
  { value: 1, text: { es: "I · Normal: función facial normal en todas las áreas", en: "I · Normal: normal facial function in all areas" } },
  {
    value: 2,
    text: {
      es: "II · Disfunción leve: debilidad leve visible de cerca; reposo simétrico; frente con función moderada a buena; cierre ocular completo con mínimo esfuerzo; leve asimetría de la boca",
      en: "II · Mild dysfunction: slight weakness on close inspection; normal symmetry at rest; forehead moderate to good function; complete eye closure with minimal effort; slight mouth asymmetry",
    },
  },
  {
    value: 3,
    text: {
      es: "III · Disfunción moderada: diferencia evidente pero no desfigurante; sincinesias apreciables no graves; frente con movimiento leve a moderado; cierre ocular completo con esfuerzo; boca algo débil con esfuerzo máximo",
      en: "III · Moderate dysfunction: obvious but not disfiguring difference; noticeable but not severe synkinesis; forehead slight to moderate movement; complete eye closure with effort; mouth slightly weak with maximum effort",
    },
  },
  {
    value: 4,
    text: {
      es: "IV · Disfunción moderadamente grave: debilidad evidente o asimetría desfigurante; reposo simétrico; frente sin movimiento; cierre ocular incompleto; boca asimétrica con esfuerzo máximo",
      en: "IV · Moderately severe dysfunction: obvious weakness or disfiguring asymmetry; normal symmetry at rest; no forehead movement; incomplete eye closure; asymmetric mouth with maximum effort",
    },
  },
  {
    value: 5,
    text: {
      es: "V · Disfunción grave: movimiento apenas perceptible; asimetría en reposo; frente sin movimiento; cierre ocular incompleto; movimiento leve de la boca",
      en: "V · Severe dysfunction: only barely perceptible motion; asymmetry at rest; no forehead movement; incomplete eye closure; slight mouth movement",
    },
  },
  { value: 6, text: { es: "VI · Parálisis total: sin movimiento", en: "VI · Total paralysis: no movement" } },
];

export const ROMAN = ["I", "II", "III", "IV", "V", "VI"] as const;
export const roman = (n: number) => ROMAN[n - 1] ?? String(n);

export function scoreHouseBrackmann(input: HouseBrackmannInput | undefined): { grade: number; side: Side | null } | null {
  if (!input || !isGrade(input.grade, 1, 6)) return null;
  return { grade: input.grade, side: input.side ?? null };
}

// ---------------------------------------------------------------------------------------------
// Facial nerve: Sunnybrook facial grading system (Ross 1996), composite 0–100

export const SB_EXPRESSIONS = ["brow", "eyeClosure", "smile", "snarl", "pucker"] as const;
export type SbExpression = (typeof SB_EXPRESSIONS)[number];

export const SB_EXPRESSION_TEXT: Record<SbExpression, Text> = {
  brow: { es: "Elevar las cejas", en: "Brow lift" },
  eyeClosure: { es: "Cerrar los ojos suavemente", en: "Gentle eye closure" },
  smile: { es: "Sonreír con la boca abierta", en: "Open-mouth smile" },
  snarl: { es: "Arrugar la nariz (gruñido)", en: "Snarl" },
  pucker: { es: "Fruncir los labios", en: "Lip pucker" },
};

export type SbEye = "normal" | "narrow" | "wide" | "surgery";
export type SbCheek = "normal" | "absent" | "less" | "more";
export type SbMouth = "normal" | "drooped" | "pulled";

export const SB_EYE: { value: SbEye; points: number; text: Text }[] = [
  { value: "normal", points: 0, text: { es: "Normal", en: "Normal" } },
  { value: "narrow", points: 1, text: { es: "Estrecho", en: "Narrow" } },
  { value: "wide", points: 1, text: { es: "Ancho", en: "Wide" } },
  { value: "surgery", points: 1, text: { es: "Cirugía palpebral", en: "Eyelid surgery" } },
];
export const SB_CHEEK: { value: SbCheek; points: number; text: Text }[] = [
  { value: "normal", points: 0, text: { es: "Normal", en: "Normal" } },
  { value: "absent", points: 2, text: { es: "Ausente", en: "Absent" } },
  { value: "less", points: 1, text: { es: "Menos marcado", en: "Less pronounced" } },
  { value: "more", points: 1, text: { es: "Más marcado", en: "More pronounced" } },
];
export const SB_MOUTH: { value: SbMouth; points: number; text: Text }[] = [
  { value: "normal", points: 0, text: { es: "Normal", en: "Normal" } },
  { value: "drooped", points: 1, text: { es: "Comisura caída", en: "Corner drooped" } },
  { value: "pulled", points: 1, text: { es: "Comisura desplazada hacia arriba o afuera", en: "Corner pulled up or out" } },
];

export const SB_VOLUNTARY: Grade[] = [
  { value: 1, text: { es: "No inicia el movimiento", en: "Unable to initiate movement" } },
  { value: 2, text: { es: "Inicia un movimiento leve", en: "Initiates slight movement" } },
  { value: 3, text: { es: "Inicia el movimiento con excursión leve", en: "Initiated movement with mild excursion" } },
  { value: 4, text: { es: "Movimiento casi completo", en: "Movement almost complete" } },
  { value: 5, text: { es: "Movimiento completo", en: "Movement complete" } },
];
export const SB_SYNKINESIS: Grade[] = [
  { value: 0, text: { es: "Ninguna", en: "None" } },
  { value: 1, text: { es: "Leve", en: "Mild" } },
  { value: 2, text: { es: "Moderada", en: "Moderate" } },
  { value: 3, text: { es: "Grave", en: "Severe" } },
];

export interface SunnybrookInput {
  side?: Side | null;
  eye?: SbEye | null;
  cheek?: SbCheek | null;
  mouth?: SbMouth | null;
  voluntary?: Partial<Record<SbExpression, number | null>>;
  synkinesis?: Partial<Record<SbExpression, number | null>>;
}

export interface SunnybrookScore {
  /** Resting symmetry score (raw total × 5). */
  resting: number;
  /** Voluntary movement score (raw total × 4). */
  voluntary: number;
  /** Synkinesis score (raw total). */
  synkinesis: number;
  /** voluntary − resting − synkinesis (0–100). */
  composite: number;
}

const pointsOf = <T extends string>(list: { value: T; points: number }[], v: T | null | undefined) => list.find((x) => x.value === v)?.points;

export function scoreSunnybrook(input: SunnybrookInput | undefined): SunnybrookScore | null {
  if (!input) return null;
  const eye = pointsOf(SB_EYE, input.eye);
  const cheek = pointsOf(SB_CHEEK, input.cheek);
  const mouth = pointsOf(SB_MOUTH, input.mouth);
  if (eye === undefined || cheek === undefined || mouth === undefined) return null;
  let vol = 0;
  let syn = 0;
  for (const e of SB_EXPRESSIONS) {
    const v = input.voluntary?.[e];
    const s = input.synkinesis?.[e];
    if (!isGrade(v, 1, 5) || !isGrade(s, 0, 3)) return null;
    vol += v;
    syn += s;
  }
  const resting = (eye + cheek + mouth) * 5;
  const voluntary = vol * 4;
  return { resting, voluntary, synkinesis: syn, composite: voluntary - resting - syn };
}

// ---------------------------------------------------------------------------------------------
// Tympanic membrane retraction: Sadé (pars tensa) and Tos (pars flaccida), per ear

export const SADE_GRADES: Grade[] = [
  { value: 0, text: { es: "Sin retracción", en: "No retraction" } },
  { value: 1, text: { es: "Retracción leve de la membrana timpánica", en: "Slight retraction of the tympanic membrane" } },
  { value: 2, text: { es: "Retracción que contacta con el yunque o el estribo", en: "Retraction touching the incus or stapes" } },
  { value: 3, text: { es: "Retracción que contacta con el promontorio (atelectasia), no adherida", en: "Retraction touching the promontory (atelectasis), not adherent" } },
  { value: 4, text: { es: "Otitis adhesiva: membrana adherida al promontorio", en: "Adhesive otitis: membrane adherent to the promontory" } },
];

export const TOS_GRADES: Grade[] = [
  { value: 0, text: { es: "Sin retracción", en: "No retraction" } },
  { value: 1, text: { es: "Pars flaccida retraída sin contactar con el cuello del martillo", en: "Retracted pars flaccida not touching the malleus neck" } },
  { value: 2, text: { es: "Pars flaccida retraída que contacta con el cuello del martillo", en: "Retracted pars flaccida touching the malleus neck" } },
  { value: 3, text: { es: "Erosión limitada de la pared externa del ático", en: "Limited erosion of the outer attic wall" } },
  { value: 4, text: { es: "Erosión importante de la pared externa del ático", en: "Severe erosion of the outer attic wall" } },
];

export type RetractionInput = Partial<Record<Side, { sade?: number | null; tos?: number | null }>>;

export interface RetractionScore {
  right: { sade: number | null; tos: number | null };
  left: { sade: number | null; tos: number | null };
}

/** Complete when at least one grade has been chosen on either ear. */
export function scoreRetraction(input: RetractionInput | undefined): RetractionScore | null {
  if (!input) return null;
  const ear = (s: Side) => ({
    sade: isGrade(input[s]?.sade, 0, 4) ? (input[s]!.sade as number) : null,
    tos: isGrade(input[s]?.tos, 0, 4) ? (input[s]!.tos as number) : null,
  });
  const out = { right: ear("right"), left: ear("left") };
  return SIDES.some((s) => out[s].sade !== null || out[s].tos !== null) ? out : null;
}

// ---------------------------------------------------------------------------------------------
// Ménière's disease: AAO-HNS 1995 stage (4-tone average) and Bárány 2015 diagnostic criteria

export const PTA_FREQUENCIES = [500, 1000, 2000, 3000] as const;
export type PtaFrequency = (typeof PTA_FREQUENCIES)[number];

export interface MeniereInput {
  ear?: Side | null;
  /** Air-conduction thresholds (dB HL) of the affected ear at 0.5, 1, 2 and 3 kHz. */
  thresholds?: Partial<Record<PtaFrequency, number | null>>;
  /** When imported from ENT Senses Hearing: session date and whether it was calibrated. */
  source?: { sessionId?: string | null; date?: string | null; calibrated?: boolean | null } | null;
  // Bárány 2015
  episodes?: boolean | null;
  symptom?: "vertigo" | "dizziness" | null;
  duration?: "20m-12h" | "12h-24h" | "other" | null;
  snhl?: boolean | null;
  fluctuating?: boolean | null;
  notBetterAccounted?: boolean | null;
}

export type BaranyResult = "definite" | "probable" | "not_met";

export interface MeniereScore {
  pta: number | null;
  stage: 1 | 2 | 3 | 4 | null;
  barany: BaranyResult | null;
}

/** Mean of the four thresholds, rounded to one decimal; null if any is missing. */
export function pta4(thresholds: MeniereInput["thresholds"]): number | null {
  if (!thresholds) return null;
  let sum = 0;
  for (const f of PTA_FREQUENCIES) {
    const v = finite(thresholds[f]);
    if (v === null) return null;
    sum += v;
  }
  return Math.round((sum / 4) * 10) / 10;
}

/** AAO-HNS 1995: stage 1 ≤25 dB, 2 26–40, 3 41–70, 4 >70. */
export function meniereStage(pta: number): 1 | 2 | 3 | 4 {
  return pta <= 25 ? 1 : pta <= 40 ? 2 : pta <= 70 ? 3 : 4;
}

export const MENIERE_STAGE_TEXT: Record<1 | 2 | 3 | 4, Text> = {
  1: { es: "Estadio 1: ≤ 25 dB", en: "Stage 1: ≤ 25 dB" },
  2: { es: "Estadio 2: 26–40 dB", en: "Stage 2: 26–40 dB" },
  3: { es: "Estadio 3: 41–70 dB", en: "Stage 3: 41–70 dB" },
  4: { es: "Estadio 4: > 70 dB", en: "Stage 4: > 70 dB" },
};

export function scoreBarany(i: MeniereInput): BaranyResult | null {
  const answers = [i.episodes, i.fluctuating, i.notBetterAccounted, i.snhl];
  if (answers.some((a) => typeof a !== "boolean") || !i.symptom || !i.duration) return null;
  const common = i.episodes === true && i.fluctuating === true && i.notBetterAccounted === true;
  if (common && i.symptom === "vertigo" && i.duration === "20m-12h" && i.snhl === true) return "definite";
  if (common && (i.duration === "20m-12h" || i.duration === "12h-24h")) return "probable";
  return "not_met";
}

/** Complete when the stage or the Bárány criteria can be computed. */
export function scoreMeniere(input: MeniereInput | undefined): MeniereScore | null {
  if (!input) return null;
  const pta = pta4(input.thresholds);
  const barany = scoreBarany(input);
  if (pta === null && barany === null) return null;
  return { pta, stage: pta === null ? null : meniereStage(pta), barany };
}

/**
 * Air-conduction thresholds at 0.5–1–2–3 kHz of one ear from an ENT Senses Hearing audiogram
 * (stored shape: { right|left: { air, airMasked, noResponse: { air, airMasked } } }). The masked
 * threshold is used when present. Frequencies without a value, or marked "no response", are listed.
 */
export function thresholdsFromAudiogram(
  raw: unknown,
  ear: Side,
): { thresholds: Partial<Record<PtaFrequency, number>>; missing: PtaFrequency[]; noResponse: PtaFrequency[] } {
  const e = (raw && typeof raw === "object" ? (raw as Record<string, unknown>)[ear] : null) as
    | { air?: Record<string, unknown>; airMasked?: Record<string, unknown>; noResponse?: { air?: Record<string, unknown>; airMasked?: Record<string, unknown> } }
    | null;
  const thresholds: Partial<Record<PtaFrequency, number>> = {};
  const missing: PtaFrequency[] = [];
  const noResponse: PtaFrequency[] = [];
  for (const f of PTA_FREQUENCIES) {
    const masked = finite(e?.airMasked?.[f]);
    const air = finite(e?.air?.[f]);
    const nr = e?.noResponse?.airMasked?.[f] === true || (masked === null && e?.noResponse?.air?.[f] === true);
    if (nr) noResponse.push(f);
    else if (masked !== null) thresholds[f] = masked;
    else if (air !== null) thresholds[f] = air;
    else missing.push(f);
  }
  return { thresholds, missing, noResponse };
}

// ---------------------------------------------------------------------------------------------
// Vestibular schwannoma: Koos 1998

export interface KoosInput {
  side?: Side | null;
  grade?: number | null;
}

export const KOOS_GRADES: Grade[] = [
  { value: 1, text: { es: "I · Intracanalicular", en: "I · Intracanalicular" } },
  {
    value: 2,
    text: { es: "II · Protruye al ángulo pontocerebeloso sin contactar con el tronco del encéfalo", en: "II · Protrudes into the cerebellopontine angle without contacting the brainstem" },
  },
  {
    value: 3,
    text: { es: "III · Ocupa la cisterna pontocerebelosa y contacta con el tronco sin desplazarlo", en: "III · Occupies the cerebellopontine cistern and contacts the brainstem without displacing it" },
  },
  { value: 4, text: { es: "IV · Grande, desplaza el tronco del encéfalo y los pares craneales", en: "IV · Large, displacing the brainstem and cranial nerves" } },
];

export function scoreKoos(input: KoosInput | undefined): { grade: number; side: Side | null } | null {
  if (!input || !isGrade(input.grade, 1, 4)) return null;
  return { grade: input.grade, side: input.side ?? null };
}

// ---------------------------------------------------------------------------------------------
// Middle ear cholesteatoma: EAONO/JOS 2017 staging (STAM sites)

export const CHOLE_TYPES = ["parsFlaccida", "parsTensa", "congenital", "secondary", "unclassifiable"] as const;
export type CholeType = (typeof CHOLE_TYPES)[number];
export const STAM_SITES = ["S1", "S2", "T", "A", "M"] as const;
export type StamSite = (typeof STAM_SITES)[number];

export const CHOLE_TYPE_TEXT: Record<CholeType, Text> = {
  parsFlaccida: { es: "Retracción de la pars flaccida", en: "Pars flaccida retraction" },
  parsTensa: { es: "Retracción de la pars tensa", en: "Pars tensa retraction" },
  congenital: { es: "Congénito", en: "Congenital" },
  secondary: { es: "Secundario (por perforación)", en: "Secondary (perforation)" },
  unclassifiable: { es: "No clasificable", en: "Unclassifiable" },
};

export const STAM_TEXT: Record<StamSite, Text> = {
  S1: { es: "S1 · Receso supratubárico (epitímpano anterior / protímpano)", en: "S1 · Supratubal recess (anterior epitympanum / protympanum)" },
  S2: { es: "S2 · Seno timpánico", en: "S2 · Sinus tympani" },
  T: { es: "T · Caja timpánica", en: "T · Tympanic cavity" },
  A: { es: "A · Ático", en: "A · Attic" },
  M: { es: "M · Mastoides (antro y celdas)", en: "M · Mastoid (antrum and cells)" },
};

export interface CholesteatomaInput {
  ear?: Side | null;
  type?: CholeType | null;
  sites?: Partial<Record<StamSite, boolean>>;
  /** Extracranial complications or intratemporal pathological conditions. */
  extracranial?: boolean | null;
  intracranial?: boolean | null;
}

export const CHOLE_STAGE_TEXT: Record<1 | 2 | 3 | 4, Text> = {
  1: { es: "Estadio I: limitado al sitio primario", en: "Stage I: localised in the primary site" },
  2: { es: "Estadio II: dos o más sitios", en: "Stage II: two or more sites" },
  3: { es: "Estadio III: complicaciones extracraneales o alteraciones intratemporales", en: "Stage III: extracranial complications or intratemporal pathological conditions" },
  4: { es: "Estadio IV: complicaciones intracraneales", en: "Stage IV: intracranial complications" },
};

export interface CholesteatomaScore {
  stage: 1 | 2 | 3 | 4;
  sites: StamSite[];
}

export function scoreCholesteatoma(input: CholesteatomaInput | undefined): CholesteatomaScore | null {
  if (!input) return null;
  const sites = STAM_SITES.filter((s) => input.sites?.[s] === true);
  if (typeof input.extracranial !== "boolean" || typeof input.intracranial !== "boolean") return null;
  if (input.intracranial) return { stage: 4, sites };
  if (input.extracranial) return { stage: 3, sites };
  if (!sites.length) return null;
  return { stage: sites.length >= 2 ? 2 : 1, sites };
}

// ---------------------------------------------------------------------------------------------
// The whole pack

export const OTOLOGY_SCALES = ["houseBrackmann", "sunnybrook", "retraction", "cholesteatoma", "meniere", "koos"] as const;
export type OtologyScaleId = (typeof OTOLOGY_SCALES)[number];

export interface OtologyScales {
  houseBrackmann?: HouseBrackmannInput;
  sunnybrook?: SunnybrookInput;
  retraction?: RetractionInput;
  cholesteatoma?: CholesteatomaInput;
  meniere?: MeniereInput;
  koos?: KoosInput;
}

export interface OtologySummary {
  houseBrackmann?: { grade: number; side: Side | null } | null;
  sunnybrook?: SunnybrookScore | null;
  retraction?: RetractionScore | null;
  cholesteatoma?: CholesteatomaScore | null;
  meniere?: MeniereScore | null;
  koos?: { grade: number; side: Side | null } | null;
}

export function summarizeOtology(s: OtologyScales): OtologySummary {
  const out: OtologySummary = {};
  if (s.houseBrackmann) out.houseBrackmann = scoreHouseBrackmann(s.houseBrackmann);
  if (s.sunnybrook) out.sunnybrook = scoreSunnybrook(s.sunnybrook);
  if (s.retraction) out.retraction = scoreRetraction(s.retraction);
  if (s.cholesteatoma) out.cholesteatoma = scoreCholesteatoma(s.cholesteatoma);
  if (s.meniere) out.meniere = scoreMeniere(s.meniere);
  if (s.koos) out.koos = scoreKoos(s.koos);
  return out;
}

export function incompleteOtologyScales(s: OtologyScales): OtologyScaleId[] {
  const sum = summarizeOtology(s);
  return OTOLOGY_SCALES.filter((k) => s[k] && !sum[k]);
}

// ---------------------------------------------------------------------------------------------
// References

export const OTOLOGY_REFERENCES: Record<"hb" | "sb" | "sade" | "tos" | "eaono" | "aao" | "barany" | "koos", Reference> = {
  hb: { citation: "House JW, Brackmann DE. Facial nerve grading system. Otolaryngol Head Neck Surg. 1985;93(2):146-7.", doi: "10.1177/019459988509300202" },
  sb: {
    citation: "Ross BG, Fradet G, Nedzelski JM. Development of a sensitive clinical facial grading system. Otolaryngol Head Neck Surg. 1996;114(3):380-6.",
    doi: "10.1016/S0194-59989670206-1",
  },
  sade: { citation: "Sadé J, Berco E. Atelectasis and secretory otitis media. Ann Otol Rhinol Laryngol. 1976;85(2 Suppl 25 Pt 2):66-72.", doi: "10.1177/00034894760850S214" },
  tos: { citation: "Tos M, Poulsen G. Attic retractions following secretory otitis. Acta Otolaryngol. 1980;89(5-6):479-86.", doi: "10.3109/00016488009127165" },
  eaono: {
    citation:
      "Yung M, Tono T, Olszewska E, et al. EAONO/JOS Joint Consensus Statements on the Definitions, Classification and Staging of Middle Ear Cholesteatoma. J Int Adv Otol. 2017;13(1):1-8.",
    doi: "10.5152/iao.2017.3363",
  },
  aao: {
    citation:
      "Committee on Hearing and Equilibrium guidelines for the diagnosis and evaluation of therapy in Menière's disease. American Academy of Otolaryngology-Head and Neck Foundation. Otolaryngol Head Neck Surg. 1995;113(3):181-5.",
    doi: "10.1016/S0194-5998(95)70102-8",
  },
  barany: { citation: "Lopez-Escamez JA, Carey J, Chung WH, et al. Diagnostic criteria for Menière's disease. J Vestib Res. 2015;25(1):1-7.", doi: "10.3233/VES-150549" },
  koos: {
    citation: "Koos WT, Day JD, Matula C, Levy DI. Neurotopographic considerations in the microsurgical treatment of small acoustic neurinomas. J Neurosurg. 1998;88(3):506-12.",
    doi: "10.3171/jns.1998.88.3.0506",
  },
};

export const OTOLOGY_SCALE_REFERENCES: Record<OtologyScaleId, (keyof typeof OTOLOGY_REFERENCES)[]> = {
  houseBrackmann: ["hb"],
  sunnybrook: ["sb"],
  retraction: ["sade", "tos"],
  cholesteatoma: ["eaono"],
  meniere: ["aao", "barany"],
  koos: ["koos"],
};

export { SIDES };
