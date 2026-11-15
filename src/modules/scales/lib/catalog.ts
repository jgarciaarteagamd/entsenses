// ENT Senses Scales — catalogue shown on /scales: areas (packs) and their scales, active or planned.
// The plan and the references of the planned ones are in docs/scales/PLAN.md.
import type { Text } from "./types";

export interface CatalogScale {
  name: string;
  desc: Text;
}

export interface CatalogArea {
  id: string;
  name: Text;
  /** Route of the assessment form when the pack is active. */
  route?: string;
  scales: CatalogScale[];
}

export const CATALOG: CatalogArea[] = [
  {
    id: "rhinology",
    name: { es: "Rinología", en: "Rhinology" },
    route: "/scales/rinologia",
    scales: [
      { name: "Nasal Polyp Score (NPS)", desc: { es: "Tamaño endoscópico de los pólipos, 0–8", en: "Endoscopic polyp size, 0–8" } },
      {
        name: "Lund-Kennedy",
        desc: { es: "Endoscopia, original (0–20) y modificada (0–12)", en: "Endoscopy, original (0–20) and modified (0–12)" },
      },
      { name: "Lund-Mackay", desc: { es: "Tomografía computarizada, 0–24", en: "Computed tomography, 0–24" } },
      { name: "EPOS 2020", desc: { es: "Control de la rinosinusitis crónica", en: "Control of chronic rhinosinusitis" } },
      {
        name: "EPOS/EUFOREA 2023",
        desc: { es: "Indicación de biológico y respuesta al tratamiento", en: "Indication for biologics and treatment response" },
      },
    ],
  },
  {
    id: "larynx",
    name: { es: "Laringe y deglución", en: "Larynx and swallowing" },
    scales: [
      { name: "Reflux Finding Score", desc: { es: "Hallazgos laríngeos de reflujo, 0–26", en: "Laryngeal reflux findings, 0–26" } },
      { name: "Yonekawa", desc: { es: "Clasificación del edema de Reinke", en: "Reinke’s oedema classification" } },
      { name: "Ni (NBI) · ELS 2016", desc: { es: "Leucoplasia y patrón vascular laríngeo", en: "Laryngeal leukoplakia and vascular pattern" } },
      { name: "Myer-Cotton", desc: { es: "Estenosis subglótica", en: "Subglottic stenosis" } },
      { name: "PAS · Yale · FOIS", desc: { es: "Deglución (FEES)", en: "Swallowing (FEES)" } },
    ],
  },
  {
    id: "otology",
    name: { es: "Otología y base de cráneo", en: "Otology and skull base" },
    scales: [
      { name: "House-Brackmann · Sunnybrook", desc: { es: "Parálisis facial", en: "Facial palsy" } },
      { name: "Sadé · Tos", desc: { es: "Retracciones timpánicas", en: "Tympanic membrane retraction" } },
      { name: "Ménière AAO-HNS 1995", desc: { es: "Estadio desde el audiograma de Hearing", en: "Stage from the Hearing audiogram" } },
      { name: "EAONO/JOS · Koos", desc: { es: "Colesteatoma y schwannoma vestibular", en: "Cholesteatoma and vestibular schwannoma" } },
    ],
  },
  {
    id: "sleep",
    name: { es: "Sueño y orofaringe", en: "Sleep and oropharynx" },
    scales: [
      { name: "Brodsky", desc: { es: "Hipertrofia amigdalar, 0–4", en: "Tonsil hypertrophy, 0–4" } },
      { name: "Friedman · VOTE", desc: { es: "Estadiaje y endoscopia del sueño", en: "Staging and drug-induced sleep endoscopy" } },
    ],
  },
];
