// Scores of a rhinology assessment, as tiles (form, inbox, report).
import { useLang } from "@/modules/scales/i18n";
import type { RhinologySummary, SidedScore } from "@/modules/scales/lib/rhinology";
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

export function RhinologySummaryView({ summary, compact = false }: { summary: RhinologySummary; compact?: boolean }) {
  const tiles = useSummaryTiles(summary);
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
