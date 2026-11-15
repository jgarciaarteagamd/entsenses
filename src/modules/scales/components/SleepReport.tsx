// Printable body of a sleep and oropharynx assessment.
import { useLang } from "@/modules/scales/i18n";
import type { RowOf } from "@/modules/scales/lib/assessments";
import {
  BRODSKY_GRADES,
  FRIEDMAN_TEXT,
  FTP_TEXT,
  PARIKH_GRADES,
  SLEEP_REFERENCES,
  SLEEP_SCALES,
  SLEEP_SCALE_REFERENCES,
  VOTE_CONFIG_TEXT,
  VOTE_DEGREE_TEXT,
  VOTE_LEVELS,
  VOTE_LEVEL_TEXT,
} from "@/modules/scales/lib/sleep";
import { SleepSummaryView } from "./SummaryView";
import { ReportReferences, ReportSection } from "./RhinologyReport";

export function SleepReport({ row: r }: { row: RowOf<"sleep"> }) {
  const { lang, t } = useLang();
  const s = r.scales;
  const sum = r.summary;
  const yn = (v: boolean | null | undefined) => (v === true ? t("form.yes") : v === false ? t("form.no") : "—");
  const n = (v: number | null | undefined) => (v == null ? "—" : v.toLocaleString(lang === "en" ? "en-GB" : "es-ES", { maximumFractionDigits: 1 }));
  const refs = [...new Set(SLEEP_SCALES.filter((k) => s[k]).flatMap((k) => SLEEP_SCALE_REFERENCES[k]))].map((k) => SLEEP_REFERENCES[k]);

  return (
    <>
      <SleepSummaryView summary={sum} />

      {s.exam && (
        <ReportSection title={t("scale.exam")}>
          {sum.exam?.brodsky != null && (
            <p className="text-sm">
              {t("exam.brodsky")}: <strong>{sum.exam.brodsky}</strong> — <span className="text-neutral-600">{BRODSKY_GRADES.find((g) => g.value === sum.exam?.brodsky)?.text[lang]}</span>
            </p>
          )}
          {sum.exam?.ftp && (
            <p className="text-sm">
              {t("exam.ftp")}: <strong>{sum.exam.ftp}</strong> — <span className="text-neutral-600">{FTP_TEXT[sum.exam.ftp][lang]}</span>
            </p>
          )}
          <p className="text-sm">
            {t("exam.bmi")}: <strong>{n(sum.exam?.bmi)}</strong> kg/m² · {t("exam.craniofacial")}: <strong>{yn(s.exam.craniofacial)}</strong>
          </p>
          {sum.exam?.friedman && <p className="text-sm font-semibold">{FRIEDMAN_TEXT[sum.exam.friedman][lang]}</p>}
        </ReportSection>
      )}

      {s.adenoid && (
        <ReportSection title={t("scale.adenoid")}>
          <p className="text-sm">
            <strong>{sum.adenoid ?? "—"}</strong>/4 <span className="text-neutral-600">{PARIKH_GRADES.find((g) => g.value === sum.adenoid)?.text[lang] ?? ""}</span>
          </p>
        </ReportSection>
      )}

      {s.vote && (
        <ReportSection title={t("scale.vote")}>
          <table className="w-full text-sm">
            <tbody>
              {VOTE_LEVELS.map((l) => {
                const lv = sum.vote?.levels[l];
                return (
                  <tr key={l} className="border-t first:border-t-0">
                    <td className="py-1">{VOTE_LEVEL_TEXT[l][lang]}</td>
                    <td className="w-48 py-1">{lv ? VOTE_DEGREE_TEXT[String(lv.degree) as "0"][lang] : "—"}</td>
                    <td className="w-36 py-1 text-neutral-600">{lv?.config ? VOTE_CONFIG_TEXT[lv.config][lang] : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sum.vote && (
            <p className="text-sm font-semibold">
              {sum.vote.notation} — {t("vote.obstructed", sum.vote.obstructed)}
            </p>
          )}
        </ReportSection>
      )}

      {s.study && (
        <ReportSection title={t("scale.study")}>
          <p className="text-sm">
            {s.study.type && (
              <>
                {t(`study.type.${s.study.type}`)} ·{" "}
              </>
            )}
            {t("study.ahi")}: <strong>{n(sum.study?.ahi)}</strong> · {t("study.odi")}: <strong>{n(s.study.odi)}</strong> · {t("study.nadir")}: <strong>{n(s.study.nadirSpo2)}</strong> ·{" "}
            CT90: <strong>{n(s.study.ct90)}</strong>
          </p>
          {sum.study && <p className="text-sm font-semibold">{t(`study.severity.${sum.study.severity}`)} ({t("study.adults")})</p>}
        </ReportSection>
      )}

      {refs.length > 0 && <ReportReferences refs={refs} />}
    </>
  );
}
