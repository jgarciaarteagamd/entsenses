// ENT Senses module registry: one entry per module. The dashboard, header, inbox tabs and QR
// sheets are built from this list, so adding a module means adding it here.
import { BookOpen, Ear, Mic, Ruler, Waves, type LucideIcon } from "lucide-react";

export type ModuleId = "quest" | "voice" | "hearing" | "scales" | "tinnitus";

export interface ModuleInfo {
  id: ModuleId;
  /** Short name shown after "ENT Senses". */
  name: string;
  icon: LucideIcon;
  status: "active" | "coming";
  /** Main doctor-facing route of the module. */
  home?: string;
  /** Whether patients can take this module's test from the doctor's QR / link. */
  patientLink?: boolean;
  /** Tailwind classes for the module accent. */
  accent: string;
}

export const MODULES: ModuleInfo[] = [
  { id: "quest", name: "Quest", icon: BookOpen, status: "active", home: "/quest", accent: "text-violet-600 bg-violet-50 dark:bg-violet-950/40" },
  { id: "voice", name: "Voice", icon: Mic, status: "coming", accent: "text-rose-600 bg-rose-50 dark:bg-rose-950/40" },
  { id: "hearing", name: "Hearing", icon: Ear, status: "active", home: "/hearing/consulta", patientLink: true, accent: "text-sky-600 bg-sky-50 dark:bg-sky-950/40" },
  { id: "scales", name: "Scales", icon: Ruler, status: "coming", accent: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
  { id: "tinnitus", name: "Tinnitus", icon: Waves, status: "coming", accent: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
];

export const activeModules = () => MODULES.filter((m) => m.status === "active");
export const moduleById = (id: string) => MODULES.find((m) => m.id === id);
