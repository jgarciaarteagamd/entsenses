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
    route: "/scales/laringe",
    scales: [
      { name: "Reflux Finding Score", desc: { es: "Hallazgos laríngeos de reflujo, 0–26", en: "Laryngeal reflux findings, 0–26" } },
      { name: "Tan 2017", desc: { es: "Grado del edema de Reinke, con la voz de Voice", en: "Reinke’s oedema grade, with the Voice analysis" } },
      { name: "Ni 2011 · ELS 2016", desc: { es: "Patrón vascular con imagen de banda estrecha", en: "Vascular pattern on narrow band imaging" } },
      { name: "Myer-Cotton", desc: { es: "Estenosis subglótica", en: "Subglottic stenosis" } },
      { name: "Murray · PAS · Yale · FOIS", desc: { es: "Deglución (FEES)", en: "Swallowing (FEES)" } },
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
