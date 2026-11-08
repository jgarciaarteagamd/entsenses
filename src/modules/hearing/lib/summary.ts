// Plain-text summary for the inbox "Copy" button (PTA from AudiometricReport's calculations).
import type { SessionRow } from "./sessions";
import type { Lang } from "./session";
import { fromStoredReport, ptaSummary } from "./report";
import { estimatedPta, isAsymmetric, readRemoteAudiogram, PTA_FREQUENCIES } from "./remoteCheck";

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
  const remote = readRemoteAudiogram(r.audiogram);
  if (remote) {
    const pr = estimatedPta(remote.right);
    const pl = estimatedPta(remote.left);
    const fmt = (ear: "right" | "left") =>
      PTA_FREQUENCIES.map((f) => {
        const v = remote[ear][f];
        return `${f}:${v === "nr" ? "NR" : v ?? "—"}`;
      }).join(" ");
    lines.push(es ? "Prueba informativa en el dispositivo del paciente (niveles estimados, ±15–20 dB)." : "Informative check on the patient's own device (estimated levels, ±15–20 dB).");
    lines.push(`${es ? "OD" : "R"} ${fmt("right")} (PTA≈${pr ?? "—"}) · ${es ? "OI" : "L"} ${fmt("left")} (PTA≈${pl ?? "—"})`);
    lines.push(`${es ? "Asimetría" : "Asymmetry"}: ${isAsymmetric(remote, pr, pl) ? (es ? "sí" : "yes") : "no"}`);
    const q = r.questionnaire as { score?: number; redFlags?: string[] };
    lines.push(`${es ? "Cuestionario" : "Questionnaire"}: ${q.score ?? 0}/20 · ${es ? "Signos de alarma" : "Red flags"}: ${q.redFlags?.length ? q.redFlags.join(", ") : es ? "ninguno" : "none"}`);
    return lines.join("\n");
  }
  const pta = ptaSummary(r.audiogram, fromStoredReport(r.report).standard);
  lines.push(`${es ? "PTA vía aérea" : "Air-conduction PTA"} (${pta.standard}): ${es ? "OD" : "R"} ${pta.right || "—"} dB · ${es ? "OI" : "L"} ${pta.left || "—"} dB`);
  const plan = fromStoredReport(r.report).info;
  if (plan.juicioClinico) lines.push(`${es ? "Juicio clínico" : "Clinical impression"}: ${plan.juicioClinico}`);
  return lines.join("\n");
}
