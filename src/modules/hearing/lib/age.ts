import type { AgeGroup } from "./session";

/** "45 años" → "40-59". Only the age group is stored with the session. */
export function ageGroupFromText(text: string | undefined): AgeGroup {
  const n = parseInt(String(text ?? "").replace(/\D+/g, " ").trim().split(" ")[0] ?? "", 10);
  if (!Number.isFinite(n)) return "unspecified";
  if (n < 18) return "<18";
  if (n < 40) return "18-39";
  if (n < 60) return "40-59";
  return "60+";
}
