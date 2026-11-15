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
  { id: "quest", name: "Quest", icon: BookOpen, status: "active", home: "/quest", accent: "text-foreground bg-muted" },
  { id: "voice", name: "Voice", icon: Mic, status: "active", home: "/voice/evaluar", patientLink: true, accent: "text-foreground bg-muted" },
  { id: "hearing", name: "Hearing", icon: Ear, status: "active", home: "/hearing/consulta", patientLink: true, accent: "text-foreground bg-muted" },
  { id: "scales", name: "Scales", icon: Ruler, status: "active", home: "/scales", accent: "text-foreground bg-muted" },
  { id: "tinnitus", name: "Tinnitus", icon: Waves, status: "coming", accent: "text-muted-foreground bg-muted" },
];

export const activeModules = () => MODULES.filter((m) => m.status === "active");
export const moduleById = (id: string) => MODULES.find((m) => m.id === id);
