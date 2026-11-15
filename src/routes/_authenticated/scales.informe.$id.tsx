import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLang } from "@/modules/scales/i18n";
import { getAssessment } from "@/modules/scales/lib/assessments";
import {
  BIOLOGIC_CRITERIA,
  BIOLOGIC_TEXT,
  CONTROL_ITEMS,
  CONTROL_TEXT,
  LK_ITEMS,
  LK_NAMES,
  LM_ITEMS,
  LM_NAMES,
  NPS_GRADES,
  RESPONSE_CRITERIA,
  RESPONSE_TEXT,
  RHINOLOGY_REFERENCES,
  RHINOLOGY_SCALES,
  SCALE_REFERENCES,
  SIDES,
  type SidedScore,
} from "@/modules/scales/lib/rhinology";
import { RhinologySummaryView } from "@/modules/scales/components/RhinologySummaryView";
import { formatDay } from "@/modules/scales/components/ScalesInbox";

export const Route = createFileRoute("/_authenticated/scales/informe/$id")({
  component: ReportPage,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid space-y-2">
      <h2 className="border-b pb-1 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const cell = (v: number | null | undefined) => (v === null || v === undefined ? "—" : String(v));

function ReportPage() {
  const { id } = Route.useParams();
  const { lang, t } = useLang();
  const { data: r, isLoading } = useQuery({ queryKey: ["scale-assessment", id], queryFn: () => getAssessment(id) });
  const yn = (v: boolean | null | undefined) => (v === true ? t("form.yes") : v === false ? t("form.no") : "—");

  function SidedRows<K extends string>({
    items,
    names,
    value,
    totals,
  }: {
    items: readonly K[];
    names: Record<K, { es: string; en: string }>;
    value: Partial<Record<"right" | "left", Partial<Record<K, number | null>>>> | undefined;
    totals: { label: string; score: SidedScore | null | undefined }[];
  }) {
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-neutral-500">
            <th className="py-1 font-medium">{t("report.item")}</th>
            {SIDES.map((s) => (
              <th key={s} className="w-24 py-1 font-medium">
                {t(`form.${s}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((k) => (
            <tr key={k} className="border-t">
              <td className="py-1">{names[k][lang]}</td>
              {SIDES.map((s) => (
                <td key={s} className="py-1 tabular-nums">
                  {cell(value?.[s]?.[k])}
                </td>
              ))}
            </tr>
          ))}
          {totals.map((x) => (
            <tr key={x.label} className="border-t font-semibold">
              <td className="py-1">{x.label}</td>
              {SIDES.map((s) => (
                <td key={s} className="py-1 tabular-nums">
                  {x.score ? x.score[s] : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  const s = r?.scales;
  const sum = r?.summary;
  const refs = s ? [...new Set(RHINOLOGY_SCALES.filter((k) => s[k]).flatMap((k) => SCALE_REFERENCES[k]))] : [];

  return (
    <div className="min-h-screen bg-muted/30 print:bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/bandeja" search={{ m: "scales" }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("report.back")}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button size="sm" onClick={() => window.print()} disabled={!r}>
            <Printer className="mr-2 h-4 w-4" />
            {t("report.print")}
          </Button>
        </div>
      </div>
      <main className="mx-auto max-w-3xl space-y-5 bg-white px-6 pb-12 pt-6 text-neutral-900 shadow-sm print:max-w-none print:px-0 print:shadow-none">
        {isLoading && <p className="text-sm text-neutral-500">{t("list.loading")}</p>}
        {!isLoading && !r && <p className="text-sm text-neutral-500">{t("report.not_available")}</p>}
        {r && s && sum && (
          <>
            <header className="border-b pb-4">
              <p className="text-xs uppercase tracking-wide text-neutral-500">ENT Senses Scales</p>
              <h1 className="text-2xl font-bold">{t("report.title")}</h1>
              <p className="mt-1 text-sm text-neutral-600">
                {t("report.date")}: {formatDay(r.assessed_on, lang)}
                {r.label && (
                  <>
                    {" · "}
                    {t("report.label")}: <strong>{r.label}</strong>
                  </>
                )}
              </p>
            </header>

            <RhinologySummaryView summary={sum} />

            {s.nps && (
              <Section title={t("scale.nps")}>
                <table className="w-full text-sm">
                  <tbody>
                    {SIDES.map((side) => {
                      const g = NPS_GRADES.find((x) => x.value === s.nps?.[side]);
                      return (
                        <tr key={side} className="border-t first:border-t-0">
                          <td className="w-24 py-1 font-medium">{t(`form.${side}`)}</td>
                          <td className="w-10 py-1 font-semibold tabular-nums">{cell(s.nps?.[side])}</td>
                          <td className="py-1 text-xs text-neutral-600">{g?.text[lang] ?? ""}</td>
                        </tr>
                      );
                    })}
                    <tr className="border-t font-semibold">
                      <td className="py-1">{t("form.total")}</td>
                      <td className="py-1 tabular-nums" colSpan={2}>
                        {sum.nps ? `${sum.nps.total}/8` : t("form.incomplete")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Section>
            )}

            {s.lundKennedy && (
              <Section title={t("scale.lundKennedy")}>
                <SidedRows
                  items={LK_ITEMS}
                  names={LK_NAMES}
                  value={s.lundKennedy}
                  totals={[
                    { label: `${t("scale.lk.modified")} (0–12)`, score: sum.mlk },
                    { label: `${t("scale.lk.original")} (0–20)`, score: sum.lk },
                  ]}
                />
              </Section>
            )}

            {s.lundMackay && (
              <Section title={t("scale.lundMackay")}>
                <SidedRows items={LM_ITEMS} names={LM_NAMES} value={s.lundMackay} totals={[{ label: `${t("form.total")} (0–24)`, score: sum.lm }]} />
              </Section>
            )}

            {s.snot22 && (
              <Section title={t("scale.snot22")}>
                <p className="text-sm">
                  <strong className="tabular-nums">{sum.snot22 ?? "—"}</strong>/110
                  {s.snot22.date && <span className="text-neutral-600"> · {t("snot.taken", formatDay(s.snot22.date.slice(0, 10), lang))}</span>}
                </p>
              </Section>
            )}

            {s.control && (
              <Section title={t("scale.control")}>
                <table className="w-full text-sm">
                  <tbody>
                    {CONTROL_ITEMS.map((k) => (
                      <tr key={k} className="border-t first:border-t-0">
                        <td className="py-1">{CONTROL_TEXT[k][lang]}</td>
                        <td className="w-12 py-1 text-right font-medium">{yn(s.control?.[k])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-sm font-semibold">
                  {sum.control ? `${t(`control.level.${sum.control.level}`)} (${t("control.result", sum.control.present)})` : t("form.incomplete")}
                </p>
              </Section>
            )}

            {s.biologic && (
              <Section title={t("scale.biologic")}>
                <p className="text-sm">
                  {t("bio.bilateral")}: <strong>{yn(s.biologic.bilateralPolyps)}</strong> · {t("bio.surgery")}:{" "}
                  <strong>{yn(s.biologic.priorSurgery)}</strong>
                </p>
                <p className="text-xs text-neutral-600">
                  {[
                    s.biologic.tissueEos != null && `${t("bio.tissueEos")}: ${s.biologic.tissueEos}`,
                    s.biologic.bloodEos != null && `${t("bio.bloodEos")}: ${s.biologic.bloodEos}`,
                    s.biologic.totalIge != null && `${t("bio.ige")}: ${s.biologic.totalIge}`,
                    s.biologic.steroidCourses != null && `${t("bio.courses")}: ${s.biologic.steroidCourses}`,
                    s.biologic.steroidLongTerm && t("bio.longterm"),
                    s.biologic.steroidContraindicated && `${t("bio.steroids")}: ${t("bio.contraindicated").toLowerCase()}`,
                    s.biologic.smellTest && `${t("bio.smellTest")}: ${t(`bio.smellTest.${s.biologic.smellTest}`)}${s.biologic.smellScore != null ? ` (${s.biologic.smellScore})` : ""}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {sum.biologic && (
                  <>
                    <ul className="space-y-0.5 text-sm">
                      {BIOLOGIC_CRITERIA.map((k) => (
                        <li key={k}>
                          <span className="inline-block w-5 font-bold">{sum.biologic!.criteria[k] ? "✓" : "–"}</span>
                          {BIOLOGIC_TEXT[k][lang]}
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm font-semibold">
                      {t("bio.result", sum.biologic.met, sum.biologic.required)} — {sum.biologic.meets ? t("bio.meets") : t("bio.not_meets")}
                    </p>
                  </>
                )}
              </Section>
            )}

            {s.response && (
              <Section title={t("scale.response")}>
                <p className="text-sm">
                  {s.response.timepoint && `${t("resp.timepoint")}: ${t(`resp.timepoint.${s.response.timepoint}`)}`}
                  {s.response.biologic && ` · ${t("resp.biologic")}: ${t(`resp.biologic.${s.response.biologic}`)}`}
                </p>
                <table className="w-full text-sm">
                  <tbody>
                    {RESPONSE_CRITERIA.map((k) => (
                      <tr key={k} className="border-t first:border-t-0">
                        <td className="py-1">{RESPONSE_TEXT[k][lang]}</td>
                        <td className="w-20 py-1 text-right font-medium">
                          {k === "comorbidities"
                            ? s.response?.comorbidities
                              ? t(`resp.comorb.${s.response.comorbidities}`)
                              : "—"
                            : yn(s.response?.[k])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-sm font-semibold">
                  {sum.response ? `${t("resp.result", sum.response.met, sum.response.possible)} — ${t(`resp.level.${sum.response.level}`)}` : t("form.incomplete")}
                </p>
              </Section>
            )}

            <section className="break-inside-avoid space-y-1 border-t pt-3 text-[11px] text-neutral-600">
              <p className="font-medium">{t("form.references")}</p>
              {refs.map((k) => {
                const ref = RHINOLOGY_REFERENCES[k];
                return (
                  <p key={k}>
                    {ref.citation} {ref.doi ? `doi:${ref.doi}` : ref.pmid ? `PMID ${ref.pmid}` : ""}
                  </p>
                );
              })}
              <p className="pt-2">{t("report.footer")}</p>
            </section>
          </>
        )}
      </main>
      <style>{`@media print { @page { size: A4; margin: 12mm; } }`}</style>
    </div>
  );
}
