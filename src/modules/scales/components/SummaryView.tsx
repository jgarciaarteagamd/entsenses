// Scores of an assessment, as tiles (form, inbox, report): one tile builder per pack.
import { useLang } from "@/modules/scales/i18n";
import type { RhinologySummary, SidedScore } from "@/modules/scales/lib/rhinology";
import type { LarynxSummary } from "@/modules/scales/lib/larynx";
import { roman, type OtologySummary } from "@/modules/scales/lib/otology";
import type { SleepSummary } from "@/modules/scales/lib/sleep";
import type { ScaleAssessmentRow } from "@/modules/scales/lib/assessments";
import { cn } from "@/lib/utils";

interface Tile {
  key: string;
  label: string;
  value: string;
  detail?: string;
  tone?: "good" | "mid" | "bad";
}

const TONE: Record<NonNullable<Tile["tone"]>, string> = {
  good: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  mid: "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  bad: "border-red-300 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200",
};

export function useSummaryTiles(s: RhinologySummary): Tile[] {
  const { t } = useLang();
  const inc = t("form.incomplete");
  const sided = (v: SidedScore | null | undefined, max: number) =>
    v ? { value: `${v.total}/${max}`, detail: `${t("form.right").charAt(0)} ${v.right} · ${t("form.left").charAt(0)} ${v.left}` } : { value: inc };
  const tiles: Tile[] = [];
  if ("nps" in s) tiles.push({ key: "nps", label: "NPS", ...sided(s.nps, 8) });
  if ("mlk" in s) tiles.push({ key: "mlk", label: t("scale.lk.modified"), ...sided(s.mlk, 12) });
  if ("lk" in s && s.lk) tiles.push({ key: "lk", label: t("scale.lk.original"), ...sided(s.lk, 20) });
  if ("lm" in s) tiles.push({ key: "lm", label: "Lund-Mackay", ...sided(s.lm, 24) });
  if ("snot22" in s) tiles.push({ key: "snot22", label: "SNOT-22", value: s.snot22 == null ? inc : `${s.snot22}/110` });
  if ("control" in s) {
    const c = s.control;
    tiles.push({
      key: "control",
      label: "EPOS 2020",
      value: c ? t(`control.level.${c.level}`) : inc,
      detail: c ? t("control.result", c.present) : undefined,
      tone: c ? (c.level === "controlled" ? "good" : c.level === "partly" ? "mid" : "bad") : undefined,
    });
  }
  if ("biologic" in s) {
    const b = s.biologic;
    tiles.push({
      key: "biologic",
      label: t("scale.biologic"),
      value: b ? (b.meets ? t("bio.meets") : t("bio.not_meets")) : inc,
      detail: b ? t("bio.result", b.met, b.required) : undefined,
    });
  }
  if ("response" in s) {
    const r = s.response;
    tiles.push({
      key: "response",
      label: t("scale.response"),
      value: r ? t(`resp.level.${r.level}`) : inc,
      detail: r ? t("resp.result", r.met, r.possible) : undefined,
      tone: r ? (r.level === "good_excellent" ? "good" : r.level === "poor_moderate" ? "mid" : "bad") : undefined,
    });
  }
  return tiles;
}

export function useLarynxTiles(s: LarynxSummary): Tile[] {
  const { lang, t } = useLang();
  const inc = t("form.incomplete");
  const n = (v: number, d = 1) => v.toLocaleString(lang === "en" ? "en-GB" : "es-ES", { maximumFractionDigits: d });
  const tiles: Tile[] = [];
  if ("rfs" in s) {
    const r = s.rfs;
    tiles.push({
      key: "rfs",
      label: "RFS",
      value: r ? `${r.total}/26` : inc,
      detail: r ? (r.aboveThreshold ? t("rfs.result.above") : t("rfs.result.below")) : undefined,
      tone: r ? (r.aboveThreshold ? "mid" : undefined) : undefined,
    });
  }
  if ("reinke" in s) {
    const r = s.reinke;
    const side = (v: number | null) => (v === null ? "—" : String(v));
    tiles.push({
      key: "reinke",
      label: "Reinke (Tan)",
      value: r ? `${t("reinke.max")} ${r.max}` : inc,
      detail: r ? `${t("form.right").charAt(0)} ${side(r.right)} · ${t("form.left").charAt(0)} ${side(r.left)}${s.packYears != null ? ` · ${n(s.packYears)} p-a` : ""}` : undefined,
    });
  }
  if ("nbi" in s) {
    const b = s.nbi;
    tiles.push({
      key: "nbi",
      label: "NBI",
      value: b ? [b.ni ? `Ni ${b.ni}` : null, b.els ? `ELS ${t(`nbi.els.${b.els}`)}` : null].filter(Boolean).join(" · ") : inc,
    });
  }
  if ("stenosis" in s) {
    const st = s.stenosis;
    tiles.push({ key: "stenosis", label: "Myer-Cotton", value: st ? ["I", "II", "III", "IV"][st.grade - 1] : inc, detail: st?.pct != null ? `${n(st.pct, 0)} %` : undefined });
  }
  if ("voice" in s) {
    const v = s.voice;
    tiles.push({
      key: "voice",
      label: "Voice",
      value: v ? (v.avqi != null ? `AVQI ${n(v.avqi, 2)}` : v.cpps != null ? `CPPS ${n(v.cpps)}` : "—") : inc,
      detail: v ? [v.cpps != null && v.avqi != null ? `CPPS ${n(v.cpps)} dB` : null, v.f0 != null ? `F0 ${n(v.f0, 0)} Hz` : null, v.grbasG != null ? `G${v.grbasG}` : null].filter(Boolean).join(" · ") : undefined,
    });
  }
  if ("secretions" in s) tiles.push({ key: "secretions", label: "Murray", value: s.secretions == null ? inc : `${s.secretions}/3` });
  if ("fees" in s) {
    const f = s.fees;
    tiles.push({
      key: "fees",
      label: "PAS",
      value: f ? (f.pas != null ? `${f.pas}/8` : "—") : inc,
      detail: f ? [f.pasClass ? t(`fees.class.${f.pasClass}`) : null, f.yaleV != null ? `Yale V${f.yaleV}` : null, f.yaleP != null ? `P${f.yaleP}` : null].filter(Boolean).join(" · ") : undefined,
      tone: f?.pasClass ? (f.pasClass === "aspiration" ? "bad" : f.pasClass === "penetration" ? "mid" : "good") : undefined,
    });
  }
  if ("fois" in s) tiles.push({ key: "fois", label: "FOIS", value: s.fois == null ? inc : `${s.fois}/7` });
  return tiles;
}

export function useOtologyTiles(s: OtologySummary): Tile[] {
  const { lang, t } = useLang();
  const inc = t("form.incomplete");
  const sideTxt = (v: "right" | "left" | null | undefined) => (v ? t(`form.${v}`) : undefined);
  const n = (v: number) => v.toLocaleString(lang === "en" ? "en-GB" : "es-ES", { maximumFractionDigits: 1 });
  const tiles: Tile[] = [];
  if ("houseBrackmann" in s) {
    const h = s.houseBrackmann;
    tiles.push({ key: "hb", label: "House-Brackmann", value: h ? roman(h.grade) : inc, detail: sideTxt(h?.side), tone: h ? (h.grade === 1 ? "good" : h.grade >= 4 ? "bad" : "mid") : undefined });
  }
  if ("sunnybrook" in s) {
    const b = s.sunnybrook;
    tiles.push({ key: "sb", label: "Sunnybrook", value: b ? `${b.composite}/100` : inc, detail: b ? `${b.voluntary} − ${b.resting} − ${b.synkinesis}` : undefined });
  }
  if ("retraction" in s) {
    const r = s.retraction;
    const ear = (e: { sade: number | null; tos: number | null }) => [e.sade !== null ? `Sadé ${e.sade}` : null, e.tos !== null ? `Tos ${e.tos}` : null].filter(Boolean).join(" · ") || "—";
    tiles.push({
      key: "ret",
      label: "Sadé · Tos",
      value: r ? `${t("form.right").charAt(0)}: ${ear(r.right)}` : inc,
      detail: r ? `${t("form.left").charAt(0)}: ${ear(r.left)}` : undefined,
    });
  }
  if ("cholesteatoma" in s) {
    const c = s.cholesteatoma;
    tiles.push({ key: "chole", label: "EAONO/JOS", value: c ? `${t("oto.stage")} ${roman(c.stage)}` : inc, detail: c?.sites.length ? c.sites.join(" ") : undefined, tone: c ? (c.stage >= 3 ? "bad" : undefined) : undefined });
  }
  if ("meniere" in s) {
    const m = s.meniere;
    tiles.push({
      key: "meniere",
      label: "Ménière",
      value: m ? (m.stage ? `${t("oto.stage")} ${m.stage}` : m.barany ? t(`men.result.${m.barany}`) : "—") : inc,
      detail: m ? [m.pta != null ? `${n(m.pta)} dB` : null, m.stage && m.barany ? t(`men.result.${m.barany}`) : null].filter(Boolean).join(" · ") : undefined,
    });
  }
  if ("koos" in s) {
    const k = s.koos;
    tiles.push({ key: "koos", label: "Koos", value: k ? roman(k.grade) : inc, detail: sideTxt(k?.side) });
  }
  return tiles;
}

export function useSleepTiles(s: SleepSummary): Tile[] {
  const { lang, t } = useLang();
  const inc = t("form.incomplete");
  const n = (v: number) => v.toLocaleString(lang === "en" ? "en-GB" : "es-ES", { maximumFractionDigits: 1 });
  const tiles: Tile[] = [];
  if ("exam" in s) {
    const e = s.exam;
    tiles.push({ key: "brodsky", label: "Brodsky", value: e?.brodsky != null ? String(e.brodsky) : inc, detail: e?.ftp ? `FTP ${e.ftp}` : undefined });
    if (e?.friedman) tiles.push({ key: "friedman", label: "Friedman", value: `${t("oto.stage")} ${roman(e.friedman)}`, detail: e.bmi != null ? `${t("exam.bmi")} ${n(e.bmi)}` : undefined });
  }
  if ("adenoid" in s) tiles.push({ key: "adenoid", label: "Parikh", value: s.adenoid == null ? inc : `${s.adenoid}/4` });
  if ("vote" in s) {
    const v = s.vote;
    tiles.push({ key: "vote", label: "VOTE", value: v ? v.notation : inc, detail: v ? t("vote.obstructed", v.obstructed) : undefined });
  }
  if ("study" in s) {
    const st = s.study;
    tiles.push({
      key: "study",
      label: t("study.ahi"),
      value: st ? n(st.ahi) : inc,
      detail: st ? [t(`study.severity.${st.severity}`), st.nadirSpo2 != null ? `SpO2 ${n(st.nadirSpo2)} %` : null].filter(Boolean).join(" · ") : undefined,
      tone: st ? (st.severity === "normal" ? "good" : st.severity === "severe" ? "bad" : "mid") : undefined,
    });
  }
  return tiles;
}

export function TileGrid({ tiles, compact = false }: { tiles: Tile[]; compact?: boolean }) {
  if (!tiles.length) return null;
  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3")}>
      {tiles.map((x) => (
        <div key={x.key} className={cn("rounded-md border p-2", x.tone ? TONE[x.tone] : "bg-muted/60")}>
          <p className="truncate text-[11px] opacity-80" title={x.label}>
            {x.label}
          </p>
          <p className={cn("font-bold tabular-nums leading-tight", compact ? "text-base" : "text-lg")}>{x.value}</p>
          {x.detail && <p className="text-[11px] opacity-80">{x.detail}</p>}
        </div>
      ))}
    </div>
  );
}

export function RhinologySummaryView({ summary, compact = false }: { summary: RhinologySummary; compact?: boolean }) {
  return <TileGrid tiles={useSummaryTiles(summary)} compact={compact} />;
}

export function LarynxSummaryView({ summary, compact = false }: { summary: LarynxSummary; compact?: boolean }) {
  return <TileGrid tiles={useLarynxTiles(summary)} compact={compact} />;
}

export function OtologySummaryView({ summary, compact = false }: { summary: OtologySummary; compact?: boolean }) {
  return <TileGrid tiles={useOtologyTiles(summary)} compact={compact} />;
}

/** Summary tiles of any saved assessment. */
export function AssessmentSummary({ row, compact = false }: { row: ScaleAssessmentRow; compact?: boolean }) {
  if (row.pack === "larynx") return <LarynxSummaryView summary={row.summary} compact={compact} />;
  if (row.pack === "otology") return <OtologySummaryView summary={row.summary} compact={compact} />;
  if (row.pack === "sleep") return <SleepSummaryView summary={row.summary} compact={compact} />;
  return <RhinologySummaryView summary={row.summary} compact={compact} />;
}

export function SleepSummaryView({ summary, compact = false }: { summary: SleepSummary; compact?: boolean }) {
  return <TileGrid tiles={useSleepTiles(summary)} compact={compact} />;
}
