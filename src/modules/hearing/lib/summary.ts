// Plain-text summary for the inbox "Copy" button (PTA from AudiometricReport's calculations).
import type { SessionRow } from "./sessions";
import type { Lang } from "./session";
import { fromStoredReport, ptaSummary } from "./report";

/** Counts the threshold values stored in an audiogram JSON (any nesting). */
export function countThresholds(audiogram: unknown): number {
  if (audiogram === null || typeof audiogram !== "object") return 0;
  let n = 0;
  for (const v of Object.values(audiogram as Record<string, unknown>)) {
    if (typeof v === "number" && Number.isFinite(v)) n += 1;
    else if (v && typeof v === "object") n += countThresholds(v);
  }
  return n;
}

export function summaryText(r: SessionRow, lang: Lang): string {
  const es = lang === "es";
  const date = new Date(r.created_at).toLocaleString(es ? "es-ES" : "en-GB");
  const lines = [
    es ? `Audiometría tonal liminal (vía aérea) — ${date}` : `Pure-tone audiometry (air conduction) — ${date}`,
    r.calibrated
      ? es ? "Sistema calibrado (consulta)." : "Calibrated system (clinic)."
      : es ? "NO CALIBRADO — resultado informativo." : "NOT CALIBRATED — informative result.",
  ];
  if (r.label) lines.push(`${es ? "Etiqueta" : "Label"}: ${r.label}`);
  const pta = ptaSummary(r.audiogram, fromStoredReport(r.report).standard);
  lines.push(`${es ? "PTA vía aérea" : "Air-conduction PTA"} (${pta.standard}): ${es ? "OD" : "R"} ${pta.right || "—"} dB · ${es ? "OI" : "L"} ${pta.left || "—"} dB`);
  const plan = fromStoredReport(r.report).info;
  if (plan.juicioClinico) lines.push(`${es ? "Juicio clínico" : "Clinical impression"}: ${plan.juicioClinico}`);
  return lines.join("\n");
}
