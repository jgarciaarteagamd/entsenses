// Printable body of a rhinology assessment.
import type { ReactNode } from "react";
import { useLang } from "@/modules/scales/i18n";
import type { RowOf } from "@/modules/scales/lib/assessments";
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
import { RhinologySummaryView } from "./SummaryView";
import { formatDay } from "./ScalesInbox";

export function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid space-y-2">
      <h2 className="border-b pb-1 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export const cell = (v: number | null | undefined) => (v === null || v === undefined ? "—" : String(v));

export function ReportReferences({ refs }: { refs: { citation: string; doi?: string; pmid?: string }[] }) {
  const { t } = useLang();
  return (
    <section className="break-inside-avoid space-y-1 border-t pt-3 text-[11px] text-neutral-600">
      <p className="font-medium">{t("form.references")}</p>
      {refs.map((ref) => (
        <p key={ref.citation}>
          {ref.citation} {ref.doi ? `doi:${ref.doi}` : ref.pmid ? `PMID ${ref.pmid}` : ""}
        </p>
      ))}
      <p className="pt-2">{t("report.footer")}</p>
    </section>
  );
}

export function RhinologyReport({ row: r }: { row: RowOf<"rhinology"> }) {
  const { lang, t } = useLang();
  const yn = (v: boolean | null | undefined) => (v === true ? t("form.yes") : v === false ? t("form.no") : "—");
  const s = r.scales;
  const sum = r.summary;
  const refs = [...new Set(RHINOLOGY_SCALES.filter((k) => s[k]).flatMap((k) => SCALE_REFERENCES[k]))];

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

  return (
    <>
      <RhinologySummaryView summary={sum} />

      {s.nps && (
        <ReportSection title={t("scale.nps")}>
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
        </ReportSection>
      )}

      {s.lundKennedy && (
        <ReportSection title={t("scale.lundKennedy")}>
          <SidedRows
            items={LK_ITEMS}
            names={LK_NAMES}
            value={s.lundKennedy}
            totals={[
              { label: `${t("scale.lk.modified")} (0–12)`, score: sum.mlk },
              { label: `${t("scale.lk.original")} (0–20)`, score: sum.lk },
            ]}
          />
        </ReportSection>
      )}

      {s.lundMackay && (
        <ReportSection title={t("scale.lundMackay")}>
          <SidedRows items={LM_ITEMS} names={LM_NAMES} value={s.lundMackay} totals={[{ label: `${t("form.total")} (0–24)`, score: sum.lm }]} />
        </ReportSection>
      )}

      {s.snot22 && (
        <ReportSection title={t("scale.snot22")}>
          <p className="text-sm">
            <strong className="tabular-nums">{sum.snot22 ?? "—"}</strong>/110
            {s.snot22.date && <span className="text-neutral-600"> · {t("snot.taken", formatDay(s.snot22.date.slice(0, 10), lang))}</span>}
          </p>
        </ReportSection>
      )}

      {s.control && (
        <ReportSection title={t("scale.control")}>
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
        </ReportSection>
      )}

      {s.biologic && (
        <ReportSection title={t("scale.biologic")}>
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
        </ReportSection>
      )}

      {s.response && (
        <ReportSection title={t("scale.response")}>
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
        </ReportSection>
      )}

      <ReportReferences refs={refs.map((k) => RHINOLOGY_REFERENCES[k])} />
    </>
  );
}
