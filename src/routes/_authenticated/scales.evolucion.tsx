import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Pencil, Plus, Printer } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLang } from "@/modules/scales/i18n";
import { byLabel, distinctLabels, listSnot22ByLabel, sanitizeLabel } from "@/modules/scales/lib/assessments";
import { formatDay, useAssessments } from "@/modules/scales/components/ScalesInbox";

export const Route = createFileRoute("/_authenticated/scales/evolucion")({
  validateSearch: (s: Record<string, unknown>): { label?: string } => ({
    label: typeof s.label === "string" && s.label.trim() ? s.label.slice(0, 60) : undefined,
  }),
  component: FollowupPage,
});

// Neutral, distinguishable line colours (also legible when printed in greyscale thanks to the dashes).
const SERIES = [
  { key: "nps", name: "NPS (0–8)", color: "#171717", dash: undefined },
  { key: "mlk", name: "Lund-Kennedy mod. (0–12)", color: "#2563eb", dash: "6 3" },
  { key: "lm", name: "Lund-Mackay (0–24)", color: "#b45309", dash: "2 3" },
] as const;

interface Point {
  day: string;
  /** Midday of `day` in ms, so the x axis is proportional to time. */
  t: number;
  nps?: number;
  mlk?: number;
  lm?: number;
  snot?: number;
  snotQuest?: number;
}

function FollowupPage() {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const { label } = Route.useSearch();
  const clean = sanitizeLabel(label);
  const { data: rows, isLoading } = useAssessments();
  const { data: snots } = useQuery({ queryKey: ["scales-snot22", clean], queryFn: () => listSnot22ByLabel(clean), enabled: !!clean });
  const [input, setInput] = useState(label ?? "");

  const mine = useMemo(() => (clean ? byLabel(rows ?? [], clean) : []), [rows, clean]);

  const points = useMemo(() => {
    const map = new Map<string, Point>();
    const at = (day: string) => {
      let p = map.get(day);
      if (!p) map.set(day, (p = { day, t: new Date(`${day}T12:00:00`).getTime() }));
      return p;
    };
    for (const r of mine) {
      const p = at(r.assessed_on);
      if (r.summary.nps) p.nps = r.summary.nps.total;
      if (r.summary.mlk) p.mlk = r.summary.mlk.total;
      if (r.summary.lm) p.lm = r.summary.lm.total;
      if (r.summary.snot22 != null) p.snot = r.summary.snot22;
    }
    for (const s of snots ?? []) {
      const p = at(s.created_at.slice(0, 10));
      p.snotQuest = s.total_score;
    }
    return [...map.values()].sort((a, b) => a.day.localeCompare(b.day));
  }, [mine, snots]);

  const hasEndo = points.some((p) => p.nps != null || p.mlk != null || p.lm != null);
  const hasSnot = points.some((p) => p.snot != null || p.snotQuest != null);
  const tick = (ms: number) =>
    new Date(ms).toLocaleDateString(lang === "en" ? "en-GB" : "es-ES", { day: "2-digit", month: "short", year: "numeric" });
  const xAxis = <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} padding={{ left: 16, right: 16 }} tickFormatter={tick} fontSize={11} />;

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/scales">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("scales.title")}
          </Link>
        </Button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) navigate({ to: "/scales/evolucion", search: { label: input.trim() } });
          }}
          className="flex flex-wrap gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 60))}
            placeholder={t("scales.followup.placeholder")}
            list="followup-labels"
            className="max-w-xs"
          />
          <datalist id="followup-labels">
            {distinctLabels(rows ?? []).map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
          <Button type="submit" variant="outline" disabled={!input.trim()}>
            {t("scales.followup.open")}
          </Button>
        </form>

        {!clean ? (
          <p className="text-sm text-muted-foreground">{t("follow.choose")}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">
                  {t("follow.title")} · {clean}
                </h1>
                <p className="text-sm text-muted-foreground">{t("follow.subtitle", clean)}</p>
              </div>
              <Button asChild>
                <Link to="/scales/rinologia" search={{ label: clean }}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t("scales.new")}
                </Link>
              </Button>
            </div>

            {isLoading && <p className="text-sm text-muted-foreground">{t("list.loading")}</p>}
            {!isLoading && points.length === 0 && (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">{t("follow.empty")}</CardContent>
              </Card>
            )}

            {hasEndo && (
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-base">{t("follow.chart")}</CardTitle>
                </CardHeader>
                <CardContent className="h-72 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      {xAxis}
                      <YAxis domain={[0, 24]} ticks={[0, 4, 8, 12, 16, 20, 24]} fontSize={11} />
                      <Tooltip labelFormatter={(ms) => tick(Number(ms))} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {SERIES.map((s) => (
                        <Line
                          key={s.key}
                          dataKey={s.key}
                          name={s.name}
                          stroke={s.color}
                          strokeDasharray={s.dash}
                          strokeWidth={2}
                          dot={{ r: 3, strokeDasharray: "" }}
                          connectNulls
                          isAnimationActive={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {hasSnot && (
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-base">SNOT-22 (0–110)</CardTitle>
                </CardHeader>
                <CardContent className="h-56 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      {xAxis}
                      <YAxis domain={[0, 110]} ticks={[0, 20, 40, 60, 80, 100]} fontSize={11} />
                      <Tooltip labelFormatter={(ms) => tick(Number(ms))} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line dataKey="snot" name={t("scale.snot22")} stroke="#171717" strokeWidth={2} dot={{ r: 3, strokeDasharray: "" }} connectNulls isAnimationActive={false} />
                      <Line
                        dataKey="snotQuest"
                        name={t("follow.snot_quest")}
                        stroke="#2563eb"
                        strokeDasharray="6 3"
                        strokeWidth={2}
                        dot={{ r: 3, strokeDasharray: "" }}
                        connectNulls
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {mine.length > 0 && (
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-base">{t("follow.table")}</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto pt-4">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="py-1.5 pr-2 font-medium">{t("follow.date")}</th>
                        <th className="px-2 py-1.5 font-medium">NPS</th>
                        <th className="px-2 py-1.5 font-medium">mLK</th>
                        <th className="px-2 py-1.5 font-medium">LM</th>
                        <th className="px-2 py-1.5 font-medium">SNOT-22</th>
                        <th className="px-2 py-1.5 font-medium">EPOS</th>
                        <th className="px-2 py-1.5 font-medium">{t("resp.biologic")}</th>
                        <th className="py-1.5 pl-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {[...mine].reverse().map((r) => {
                        const s = r.summary;
                        const v = (x: { total: number } | null | undefined) => (x ? x.total : "—");
                        return (
                          <tr key={r.id} className="border-b last:border-b-0">
                            <td className="whitespace-nowrap py-2 pr-2">{formatDay(r.assessed_on, lang)}</td>
                            <td className="px-2 py-2 tabular-nums">{v(s.nps)}</td>
                            <td className="px-2 py-2 tabular-nums">{v(s.mlk)}</td>
                            <td className="px-2 py-2 tabular-nums">{v(s.lm)}</td>
                            <td className="px-2 py-2 tabular-nums">{s.snot22 ?? "—"}</td>
                            <td className="px-2 py-2 text-xs">{s.control ? t(`control.level.${s.control.level}`) : "—"}</td>
                            <td className="px-2 py-2 text-xs">
                              {s.response
                                ? t(`resp.level.${s.response.level}`)
                                : s.biologic
                                  ? `${s.biologic.met}/5 · ${s.biologic.meets ? t("bio.meets") : t("bio.not_meets")}`
                                  : "—"}
                            </td>
                            <td className="whitespace-nowrap py-2 pl-2 text-right">
                              <Button size="icon" variant="ghost" className="h-7 w-7" asChild aria-label={t("list.edit")}>
                                <Link to="/scales/rinologia" search={{ id: r.id }}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" asChild aria-label={t("list.print")}>
                                <Link to="/scales/informe/$id" params={{ id: r.id }}>
                                  <Printer className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
