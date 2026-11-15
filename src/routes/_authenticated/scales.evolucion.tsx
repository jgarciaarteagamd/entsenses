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
import { PACKS, byLabel, distinctLabels, listSnot22ByLabel, sanitizeLabel, type Pack, type RowOf } from "@/modules/scales/lib/assessments";
import { formatDay, useAssessments } from "@/modules/scales/components/ScalesInbox";
import { Segmented } from "@/modules/scales/components/controls";
import { PackLink } from "@/modules/scales/components/PackLink";
import { roman } from "@/modules/scales/lib/otology";

export const Route = createFileRoute("/_authenticated/scales/evolucion")({
  validateSearch: (s: Record<string, unknown>): { label?: string; pack?: Pack } => ({
    label: typeof s.label === "string" && s.label.trim() ? s.label.slice(0, 60) : undefined,
    pack: PACKS.includes(s.pack as Pack) ? (s.pack as Pack) : undefined,
  }),
  component: FollowupPage,
});

// Neutral, distinguishable line colours (also legible in greyscale thanks to the dashes).
const COLORS = ["#171717", "#2563eb", "#b45309"] as const;
const DASHES = [undefined, "6 3", "2 3"] as const;

type Point = { day: string; t: number } & Record<string, number | string | undefined>;
interface Series {
  key: string;
  name: string;
}

function pointsFrom(entries: { day: string; values: Record<string, number | null | undefined> }[]): Point[] {
  const map = new Map<string, Point>();
  for (const e of entries) {
    let p = map.get(e.day);
    if (!p) map.set(e.day, (p = { day: e.day, t: new Date(`${e.day}T12:00:00`).getTime() }));
    for (const [k, v] of Object.entries(e.values)) if (v != null) p[k] = v;
  }
  return [...map.values()].sort((a, b) => a.day.localeCompare(b.day));
}

function TimeChart({ title, points, series, domain, ticks, height = "h-64" }: { title: string; points: Point[]; series: Series[]; domain: [number, number]; ticks: number[]; height?: string }) {
  const { lang } = useLang();
  const shown = series.filter((s) => points.some((p) => p[s.key] != null));
  if (!shown.length) return null;
  const tick = (ms: number) => new Date(ms).toLocaleDateString(lang === "en" ? "en-GB" : "es-ES", { day: "2-digit", month: "short", year: "numeric" });
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className={`${height} pt-4`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} padding={{ left: 16, right: 16 }} tickFormatter={tick} fontSize={11} />
            <YAxis domain={domain} ticks={ticks} fontSize={11} />
            <Tooltip labelFormatter={(ms) => tick(Number(ms))} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {shown.map((s) => {
              const i = series.indexOf(s);
              return (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  name={s.name}
                  stroke={COLORS[i % 3]}
                  strokeDasharray={DASHES[i % 3]}
                  strokeWidth={2}
                  dot={{ r: 3, strokeDasharray: "" }}
                  connectNulls
                  isAnimationActive={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function RowActions({ id, pack }: { id: string; pack: Pack }) {
  const { t } = useLang();
  return (
    <td className="whitespace-nowrap py-2 pl-2 text-right">
      <Button size="icon" variant="ghost" className="h-7 w-7" asChild aria-label={t("list.edit")}>
        <PackLink pack={pack} id={id}>
          <Pencil className="h-3.5 w-3.5" />
        </PackLink>
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" asChild aria-label={t("list.print")}>
        <Link to="/scales/informe/$id" params={{ id }}>
          <Printer className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </td>
  );
}

const th = "px-2 py-1.5 font-medium";
const td = "px-2 py-2 tabular-nums";

function RhinologyFollowup({ rows, label }: { rows: RowOf<"rhinology">[]; label: string }) {
  const { lang, t } = useLang();
  const { data: snots } = useQuery({ queryKey: ["scales-snot22", label], queryFn: () => listSnot22ByLabel(label) });
  const points = useMemo(
    () =>
      pointsFrom([
        ...rows.map((r) => ({
          day: r.assessed_on,
          values: { nps: r.summary.nps?.total, mlk: r.summary.mlk?.total, lm: r.summary.lm?.total, snot: r.summary.snot22 },
        })),
        ...(snots ?? []).map((s) => ({ day: s.created_at.slice(0, 10), values: { snotQuest: s.total_score } })),
      ]),
    [rows, snots],
  );
  const v = (x: { total: number } | null | undefined) => (x ? x.total : "—");
  return (
    <>
      <TimeChart
        title={t("follow.chart")}
        points={points}
        domain={[0, 24]}
        ticks={[0, 4, 8, 12, 16, 20, 24]}
        series={[
          { key: "nps", name: "NPS (0–8)" },
          { key: "mlk", name: "Lund-Kennedy mod. (0–12)" },
          { key: "lm", name: "Lund-Mackay (0–24)" },
        ]}
      />
      <TimeChart
        title="SNOT-22 (0–110)"
        height="h-56"
        points={points}
        domain={[0, 110]}
        ticks={[0, 20, 40, 60, 80, 100]}
        series={[
          { key: "snot", name: t("scale.snot22") },
          { key: "snotQuest", name: t("follow.snot_quest") },
        ]}
      />
      {rows.length > 0 && (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">{t("follow.table")}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-4">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1.5 pr-2 font-medium">{t("follow.date")}</th>
                  <th className={th}>NPS</th>
                  <th className={th}>mLK</th>
                  <th className={th}>LM</th>
                  <th className={th}>SNOT-22</th>
                  <th className={th}>EPOS</th>
                  <th className={th}>{t("resp.biologic")}</th>
                  <th className="py-1.5 pl-2" />
                </tr>
              </thead>
              <tbody>
                {[...rows].reverse().map((r) => {
                  const s = r.summary;
                  return (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="whitespace-nowrap py-2 pr-2">{formatDay(r.assessed_on, lang)}</td>
                      <td className={td}>{v(s.nps)}</td>
                      <td className={td}>{v(s.mlk)}</td>
                      <td className={td}>{v(s.lm)}</td>
                      <td className={td}>{s.snot22 ?? "—"}</td>
                      <td className="px-2 py-2 text-xs">{s.control ? t(`control.level.${s.control.level}`) : "—"}</td>
                      <td className="px-2 py-2 text-xs">
                        {s.response
                          ? t(`resp.level.${s.response.level}`)
                          : s.biologic
                            ? `${s.biologic.met}/5 · ${s.biologic.meets ? t("bio.meets") : t("bio.not_meets")}`
                            : "—"}
                      </td>
                      <RowActions id={r.id} pack="rhinology" />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function LarynxFollowup({ rows }: { rows: RowOf<"larynx">[] }) {
  const { lang, t } = useLang();
  const points = useMemo(
    () =>
      pointsFrom(
        rows.map((r) => ({
          day: r.assessed_on,
          values: {
            rfs: r.summary.rfs?.total,
            avqi: r.summary.voice?.avqi,
            reinke: r.summary.reinke?.max,
            pas: r.summary.fees?.pas,
            fois: r.summary.fois,
            murray: r.summary.secretions,
          },
        })),
      ),
    [rows],
  );
  const n = (x: number | null | undefined, d = 1) => (x == null ? "—" : x.toLocaleString(lang === "en" ? "en-GB" : "es-ES", { maximumFractionDigits: d }));
  return (
    <>
      <TimeChart
        title={t("follow.chart.larynx")}
        points={points}
        domain={[0, 26]}
        ticks={[0, 5, 10, 15, 20, 25]}
        series={[
          { key: "rfs", name: "RFS (0–26)" },
          { key: "avqi", name: "AVQI" },
          { key: "reinke", name: "Reinke (1–4)" },
        ]}
      />
      <TimeChart
        title={t("follow.chart.swallow")}
        height="h-56"
        points={points}
        domain={[0, 8]}
        ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8]}
        series={[
          { key: "pas", name: "PAS (1–8)" },
          { key: "fois", name: "FOIS (1–7)" },
          { key: "murray", name: "Murray (0–3)" },
        ]}
      />
      {rows.length > 0 && (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">{t("follow.table")}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-4">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1.5 pr-2 font-medium">{t("follow.date")}</th>
                  <th className={th}>RFS</th>
                  <th className={th}>Reinke</th>
                  <th className={th}>NBI</th>
                  <th className={th}>Cotton</th>
                  <th className={th}>AVQI</th>
                  <th className={th}>PAS</th>
                  <th className={th}>FOIS</th>
                  <th className="py-1.5 pl-2" />
                </tr>
              </thead>
              <tbody>
                {[...rows].reverse().map((r) => {
                  const s = r.summary;
                  return (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="whitespace-nowrap py-2 pr-2">{formatDay(r.assessed_on, lang)}</td>
                      <td className={td}>{s.rfs?.total ?? "—"}</td>
                      <td className={td}>{s.reinke?.max ?? "—"}</td>
                      <td className="px-2 py-2 text-xs">{s.nbi ? [s.nbi.ni && `Ni ${s.nbi.ni}`, s.nbi.els && t(`nbi.els.${s.nbi.els}`)].filter(Boolean).join(" · ") : "—"}</td>
                      <td className={td}>{s.stenosis ? ["I", "II", "III", "IV"][s.stenosis.grade - 1] : "—"}</td>
                      <td className={td}>{n(s.voice?.avqi, 2)}</td>
                      <td className={td}>{s.fees?.pas ?? "—"}</td>
                      <td className={td}>{s.fois ?? "—"}</td>
                      <RowActions id={r.id} pack="larynx" />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function OtologyFollowup({ rows }: { rows: RowOf<"otology">[] }) {
  const { lang, t } = useLang();
  const points = useMemo(
    () =>
      pointsFrom(
        rows.map((r) => ({
          day: r.assessed_on,
          values: { sb: r.summary.sunnybrook?.composite, hb: r.summary.houseBrackmann?.grade, pta: r.summary.meniere?.pta },
        })),
      ),
    [rows],
  );
  const n = (x: number | null | undefined) => (x == null ? "—" : x.toLocaleString(lang === "en" ? "en-GB" : "es-ES", { maximumFractionDigits: 1 }));
  return (
    <>
      <TimeChart title={`${t("follow.chart.facial")} · Sunnybrook (0–100)`} points={points} domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} series={[{ key: "sb", name: "Sunnybrook" }]} />
      <TimeChart
        title={`${t("follow.chart.facial")} · House-Brackmann (I–VI)`}
        height="h-56"
        points={points}
        domain={[1, 6]}
        ticks={[1, 2, 3, 4, 5, 6]}
        series={[{ key: "hb", name: "House-Brackmann" }]}
      />
      <TimeChart
        title={`${t("follow.chart.hearing")} · dB HL`}
        height="h-56"
        points={points}
        domain={[0, 120]}
        ticks={[0, 25, 40, 70, 100, 120]}
        series={[{ key: "pta", name: `${t("men.pta")} (dB)` }]}
      />
      {rows.length > 0 && (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">{t("follow.table")}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-4">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1.5 pr-2 font-medium">{t("follow.date")}</th>
                  <th className={th}>H-B</th>
                  <th className={th}>Sunnybrook</th>
                  <th className={th}>EAONO/JOS</th>
                  <th className={th}>Ménière</th>
                  <th className={th}>Koos</th>
                  <th className="py-1.5 pl-2" />
                </tr>
              </thead>
              <tbody>
                {[...rows].reverse().map((r) => {
                  const s = r.summary;
                  return (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="whitespace-nowrap py-2 pr-2">{formatDay(r.assessed_on, lang)}</td>
                      <td className={td}>{s.houseBrackmann ? roman(s.houseBrackmann.grade) : "—"}</td>
                      <td className={td}>{s.sunnybrook?.composite ?? "—"}</td>
                      <td className={td}>{s.cholesteatoma ? roman(s.cholesteatoma.stage) : "—"}</td>
                      <td className="px-2 py-2 text-xs tabular-nums">
                        {s.meniere ? [s.meniere.pta != null ? `${n(s.meniere.pta)} dB · ${t("oto.stage")} ${s.meniere.stage}` : null, s.meniere.barany ? t(`men.result.${s.meniere.barany}`) : null].filter(Boolean).join(" · ") : "—"}
                      </td>
                      <td className={td}>{s.koos ? roman(s.koos.grade) : "—"}</td>
                      <RowActions id={r.id} pack="otology" />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function SleepFollowup({ rows }: { rows: RowOf<"sleep">[] }) {
  const { lang, t } = useLang();
  const points = useMemo(
    () =>
      pointsFrom(
        rows.map((r) => ({
          day: r.assessed_on,
          values: { ahi: r.summary.study?.ahi, odi: r.summary.study?.odi, nadir: r.summary.study?.nadirSpo2, brodsky: r.summary.exam?.brodsky, friedman: r.summary.exam?.friedman },
        })),
      ),
    [rows],
  );
  const n = (x: number | null | undefined) => (x == null ? "—" : x.toLocaleString(lang === "en" ? "en-GB" : "es-ES", { maximumFractionDigits: 1 }));
  const maxAhi = Math.max(60, ...points.map((p) => Math.max(Number(p.ahi ?? 0), Number(p.odi ?? 0))));
  const top = Math.ceil(maxAhi / 10) * 10;
  return (
    <>
      <TimeChart
        title={t("follow.chart.ahi")}
        points={points}
        domain={[0, top]}
        ticks={[0, 5, 15, 30, ...(top > 30 ? [top] : [])]}
        series={[
          { key: "ahi", name: t("study.ahi") },
          { key: "odi", name: t("study.odi") },
        ]}
      />
      <TimeChart title={t("study.nadir")} height="h-56" points={points} domain={[50, 100]} ticks={[50, 60, 70, 80, 90, 100]} series={[{ key: "nadir", name: t("study.nadir") }]} />
      <TimeChart
        title={t("follow.chart.exam")}
        height="h-56"
        points={points}
        domain={[0, 4]}
        ticks={[0, 1, 2, 3, 4]}
        series={[
          { key: "brodsky", name: "Brodsky (0–4)" },
          { key: "friedman", name: "Friedman (I–IV)" },
        ]}
      />
      {rows.length > 0 && (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">{t("follow.table")}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-4">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1.5 pr-2 font-medium">{t("follow.date")}</th>
                  <th className={th}>Brodsky</th>
                  <th className={th}>FTP</th>
                  <th className={th}>Friedman</th>
                  <th className={th}>VOTE</th>
                  <th className={th}>IAH</th>
                  <th className={th}>SpO2</th>
                  <th className="py-1.5 pl-2" />
                </tr>
              </thead>
              <tbody>
                {[...rows].reverse().map((r) => {
                  const s = r.summary;
                  return (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="whitespace-nowrap py-2 pr-2">{formatDay(r.assessed_on, lang)}</td>
                      <td className={td}>{s.exam?.brodsky ?? "—"}</td>
                      <td className={td}>{s.exam?.ftp ?? "—"}</td>
                      <td className={td}>{s.exam?.friedman ? roman(s.exam.friedman) : "—"}</td>
                      <td className="px-2 py-2 text-xs tabular-nums">{s.vote?.notation ?? "—"}</td>
                      <td className="px-2 py-2 text-xs tabular-nums">{s.study ? `${n(s.study.ahi)} · ${t(`study.severity.${s.study.severity}`)}` : "—"}</td>
                      <td className={td}>{n(s.study?.nadirSpo2)}</td>
                      <RowActions id={r.id} pack="sleep" />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function FollowupPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { label, pack: packParam } = Route.useSearch();
  const clean = sanitizeLabel(label);
  const { data: rows, isLoading } = useAssessments();
  const [input, setInput] = useState(label ?? "");

  const all = rows ?? [];
  // Default pack: the one of the patient's most recent assessment.
  const latest = clean ? all.find((r) => r.label === clean) : undefined;
  const pack: Pack = packParam ?? latest?.pack ?? "rhinology";
  const rhino = useMemo(() => (clean ? byLabel(all, clean, "rhinology") : []), [all, clean]);
  const larynx = useMemo(() => (clean ? byLabel(all, clean, "larynx") : []), [all, clean]);
  const otology = useMemo(() => (clean ? byLabel(all, clean, "otology") : []), [all, clean]);
  const sleep = useMemo(() => (clean ? byLabel(all, clean, "sleep") : []), [all, clean]);
  const counts: Record<Pack, number> = { rhinology: rhino.length, larynx: larynx.length, otology: otology.length, sleep: sleep.length };
  const count = counts[pack];

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
            {distinctLabels(all).map((l) => (
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
                <p className="text-sm text-muted-foreground">{t(pack === "rhinology" ? "follow.subtitle" : `follow.subtitle.${pack}`, clean)}</p>
              </div>
              <Button asChild>
                <PackLink pack={pack} label={clean}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t("scales.new")}
                </PackLink>
              </Button>
            </div>

            <Segmented<Pack>
              ariaLabel={t("follow.pack")}
              options={PACKS.map((p) => ({ value: p, label: `${t(`pack.${p}`)} (${counts[p]})` }))}
              value={pack}
              onChange={(p) => p && navigate({ to: "/scales/evolucion", search: { label: clean, pack: p } })}
            />

            {isLoading && <p className="text-sm text-muted-foreground">{t("list.loading")}</p>}
            {!isLoading && count === 0 && (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">{t("follow.empty")}</CardContent>
              </Card>
            )}

            {pack === "larynx" ? (
              <LarynxFollowup rows={larynx} />
            ) : pack === "otology" ? (
              <OtologyFollowup rows={otology} />
            ) : pack === "sleep" ? (
              <SleepFollowup rows={sleep} />
            ) : (
              <RhinologyFollowup rows={rhino} label={clean} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
