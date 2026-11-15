// Printable body of a larynx and swallowing assessment.
import { useLang } from "@/modules/scales/i18n";
import type { RowOf } from "@/modules/scales/lib/assessments";
import {
  CONSISTENCIES,
  CONSISTENCY_TEXT,
  COTTON_TEXT,
  ELS_TEXT,
  FOIS_GRADES,
  LARYNX_REFERENCES,
  LARYNX_SCALES,
  LARYNX_SCALE_REFERENCES,
  MURRAY_GRADES,
  NI_TEXT,
  REINKE_GRADES,
  RFS_GRADES,
  RFS_ITEMS,
  RFS_NAMES,
  SITE_TEXT,
} from "@/modules/scales/lib/larynx";
import { SIDES } from "@/modules/scales/lib/types";
import { LarynxSummaryView } from "./SummaryView";
import { ReportReferences, ReportSection, cell } from "./RhinologyReport";
import { formatDay } from "./ScalesInbox";

export function LarynxReport({ row: r }: { row: RowOf<"larynx"> }) {
  const { lang, t } = useLang();
  const s = r.scales;
  const sum = r.summary;
  const yn = (v: boolean | null | undefined) => (v === true ? t("form.yes") : v === false ? t("form.no") : "—");
  const n = (v: number | null | undefined, d = 1) => (v == null ? "—" : v.toLocaleString(lang === "en" ? "en-GB" : "es-ES", { maximumFractionDigits: d }));
  const refs = [...new Set(LARYNX_SCALES.filter((k) => s[k]).flatMap((k) => LARYNX_SCALE_REFERENCES[k]))].map((k) => LARYNX_REFERENCES[k]);

  return (
    <>
      <LarynxSummaryView summary={sum} />

      {s.rfs && (
        <ReportSection title={t("scale.rfs")}>
          <table className="w-full text-sm">
            <tbody>
              {RFS_ITEMS.map((k) => {
                const v = s.rfs?.[k];
                const g = RFS_GRADES[k].find((x) => x.value === v);
                return (
                  <tr key={k} className="border-t first:border-t-0">
                    <td className="py-1">{RFS_NAMES[k][lang]}</td>
                    <td className="py-1 text-xs text-neutral-600">{g?.text[lang] ?? ""}</td>
                    <td className="w-10 py-1 text-right font-semibold tabular-nums">{cell(v)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-sm font-semibold">
            {sum.rfs ? `RFS ${sum.rfs.total}/26 — ${sum.rfs.aboveThreshold ? t("rfs.result.above") : t("rfs.result.below")}` : t("form.incomplete")}
          </p>
        </ReportSection>
      )}

      {s.reinke && (
        <ReportSection title={t("scale.reinke")}>
          <table className="w-full text-sm">
            <tbody>
              {SIDES.map((side) => {
                const v = s.reinke?.[side];
                return (
                  <tr key={side} className="border-t first:border-t-0">
                    <td className="w-24 py-1 font-medium">{t(`form.${side}`)}</td>
                    <td className="w-10 py-1 font-semibold tabular-nums">{cell(v)}</td>
                    <td className="py-1 text-xs text-neutral-600">{REINKE_GRADES.find((g) => g.value === v)?.text[lang] ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sum.packYears != null && (
            <p className="text-sm">
              {t("reinke.packYears")}: <strong>{n(sum.packYears)}</strong>
              {s.reinke.cigsPerDay != null && s.reinke.yearsSmoked != null && (
                <span className="text-neutral-600"> ({t("reinke.packYears.detail", n(s.reinke.cigsPerDay, 0), n(s.reinke.yearsSmoked, 0))})</span>
              )}
            </p>
          )}
        </ReportSection>
      )}

      {s.nbi && (
        <ReportSection title={t("scale.nbi")}>
          <p className="text-sm">
            {t("nbi.site")}: <strong>{s.nbi.site ? SITE_TEXT[s.nbi.site][lang] : "—"}</strong> · {t("nbi.leukoplakia")}: <strong>{yn(s.nbi.leukoplakia)}</strong>
          </p>
          {s.nbi.ni && (
            <p className="text-sm">
              {t("nbi.ni")}: <strong>{s.nbi.ni}</strong> — <span className="text-neutral-600">{NI_TEXT[s.nbi.ni][lang]}</span>
            </p>
          )}
          {s.nbi.els && (
            <p className="text-sm">
              {t("nbi.els")}: <strong>{ELS_TEXT[s.nbi.els][lang]}</strong>
            </p>
          )}
        </ReportSection>
      )}

      {s.stenosis && (
        <ReportSection title={t("scale.stenosis")}>
          <p className="text-sm">
            {sum.stenosis ? (
              <>
                <strong>{COTTON_TEXT[sum.stenosis.grade][lang]}</strong>
                {sum.stenosis.pct != null && !s.stenosis.noLumen && ` (${n(sum.stenosis.pct, 0)} %)`}
              </>
            ) : (
              t("form.incomplete")
            )}
          </p>
        </ReportSection>
      )}

      {s.voice && (
        <ReportSection title={t("scale.voice")}>
          <p className="text-sm tabular-nums">
            {s.voice.date && <>{formatDay(s.voice.date.slice(0, 10), lang)} · </>}
            AVQI <strong>{n(s.voice.avqi, 2)}</strong> · CPPS <strong>{n(s.voice.cpps)}</strong> dB · {t("voice.f0")} <strong>{n(s.voice.f0, 0)}</strong> · {t("voice.mpt")}{" "}
            <strong>{n(s.voice.mpt)}</strong>
            {s.voice.grbasG != null && (
              <>
                {" "}
                · {s.voice.gSource === "clinician" ? t("voice.g.clinician") : t("voice.g.estimate")} <strong>{s.voice.grbasG}</strong>
              </>
            )}
          </p>
        </ReportSection>
      )}

      {s.secretions && (
        <ReportSection title={t("scale.secretions")}>
          <p className="text-sm">
            <strong className="tabular-nums">{cell(sum.secretions)}</strong>/3{" "}
            <span className="text-neutral-600">{MURRAY_GRADES.find((g) => g.value === sum.secretions)?.text[lang] ?? ""}</span>
          </p>
        </ReportSection>
      )}

      {s.fees && (
        <ReportSection title={t("scale.fees")}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="py-1 font-medium">{t("fees.consistency")}</th>
                <th className="w-16 py-1 font-medium">PAS</th>
                <th className="w-24 py-1 font-medium">{t("fees.yaleV")}</th>
                <th className="w-24 py-1 font-medium">{t("fees.yaleP")}</th>
              </tr>
            </thead>
            <tbody>
              {CONSISTENCIES.filter((c) => s.fees?.[c] && Object.values(s.fees[c]!).some((v) => v != null)).map((c) => (
                <tr key={c} className="border-t">
                  <td className="py-1">{CONSISTENCY_TEXT[c][lang]}</td>
                  <td className="py-1 tabular-nums">{cell(s.fees?.[c]?.pas)}</td>
                  <td className="py-1 tabular-nums">{cell(s.fees?.[c]?.yaleV)}</td>
                  <td className="py-1 tabular-nums">{cell(s.fees?.[c]?.yaleP)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sum.fees?.pas != null && sum.fees.pasClass && (
            <p className="text-sm font-semibold">
              {t("fees.worst", sum.fees.pas, sum.fees.pasConsistency ? CONSISTENCY_TEXT[sum.fees.pasConsistency][lang] : "—")} — {t(`fees.class.${sum.fees.pasClass}`)}
            </p>
          )}
        </ReportSection>
      )}

      {s.fois && (
        <ReportSection title={t("scale.fois")}>
          <p className="text-sm">
            <strong className="tabular-nums">{cell(sum.fois)}</strong>/7{" "}
            <span className="text-neutral-600">{FOIS_GRADES.find((g) => g.value === sum.fois)?.text[lang] ?? ""}</span>
          </p>
        </ReportSection>
      )}

      {refs.length > 0 && <ReportReferences refs={refs} />}
    </>
  );
}
