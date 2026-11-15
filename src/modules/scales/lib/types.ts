// Types shared by every Scales pack.
export type Text = { es: string; en: string };

export const SIDES = ["right", "left"] as const;
export type Side = (typeof SIDES)[number];

export interface Grade<V extends number = number> {
  value: V;
  text: Text;
}

export interface SidedScore {
  right: number;
  left: number;
  total: number;
}

export interface Reference {
  citation: string;
  doi?: string;
  pmid?: string;
}

export const isGrade = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

export const finite = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
