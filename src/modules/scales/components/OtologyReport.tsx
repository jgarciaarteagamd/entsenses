// Printable body of an otology assessment.
import { useLang } from "@/modules/scales/i18n";
import type { RowOf } from "@/modules/scales/lib/assessments";
import {
  CHOLE_STAGE_TEXT,
  CHOLE_TYPE_TEXT,
  HB_GRADES,
  KOOS_GRADES,
  MENIERE_STAGE_TEXT,
  OTOLOGY_REFERENCES,
  OTOLOGY_SCALES,
  OTOLOGY_SCALE_REFERENCES,
  PTA_FREQUENCIES,
  SADE_GRADES,
  SB_EXPRESSIONS,
  SB_EXPRESSION_TEXT,
  STAM_TEXT,
  TOS_GRADES,
} from "@/modules/scales/lib/otology";
import { SIDES } from "@/modules/scales/lib/types";
import { OtologySummaryView } from "./SummaryView";
import { ReportReferences, ReportSection, cell } from "./RhinologyReport";
import { formatDay } from "./ScalesInbox";

export function OtologyReport({ row: r }: { row: RowOf<"otology"> }) {
  const { lang, t } = useLang();
  const s = r.scales;
  const sum = r.summary;
  const yn = (v: boolean | null | undefined) => (v === true ? t("form.yes") : v === false ? t("form.no") : "—");
  const side = (v: "right" | "left" | null | undefined) => (v ? t(`form.${v}`) : "—");
  const n = (v: number | null | undefined) => (v == null ? "—" : v.toLocaleString(lang === "en" ? "en-GB" : "es-ES", { maximumFractionDigits: 1 }));
  const refs = [...new Set(OTOLOGY_SCALES.filter((k) => s[k]).flatMap((k) => OTOLOGY_SCALE_REFERENCES[k]))].map((k) => OTOLOGY_REFERENCES[k]);

  return (
    <>
      <OtologySummaryView summary={sum} />

      {s.houseBrackmann && (
        <ReportSection title={t("scale.houseBrackmann")}>
          <p className="text-sm">
            {t("oto.side")}: <strong>{side(s.houseBrackmann.side)}</strong>
          </p>
          <p className="text-sm">{HB_GRADES.find((g) => g.value === sum.houseBrackmann?.grade)?.text[lang] ?? t("form.incomplete")}</p>
        </ReportSection>
      )}

      {s.sunnybrook && (
        <ReportSection title={t("scale.sunnybrook")}>
          <p className="text-sm">
            {t("oto.side")}: <strong>{side(s.sunnybrook.side)}</strong>
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="py-1 font-medium">{t("sb.expression")}</th>
                <th className="w-40 py-1 font-medium">{t("sb.voluntary")}</th>
                <th className="w-32 py-1 font-medium">{t("sb.synkinesis")}</th>
              </tr>
            </thead>
            <tbody>
              {SB_EXPRESSIONS.map((e) => (
                <tr key={e} className="border-t">
                  <td className="py-1">{SB_EXPRESSION_TEXT[e][lang]}</td>
                  <td className="py-1 tabular-nums">{cell(s.sunnybrook?.voluntary?.[e])}</td>
                  <td className="py-1 tabular-nums">{cell(s.sunnybrook?.synkinesis?.[e])}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm font-semibold tabular-nums">
            {sum.sunnybrook ? t("sb.result", sum.sunnybrook.voluntary, sum.sunnybrook.resting, sum.sunnybrook.synkinesis, sum.sunnybrook.composite) : t("form.incomplete")}
          </p>
        </ReportSection>
      )}

      {s.retraction && (
        <ReportSection title={t("scale.retraction")}>
          <table className="w-full text-sm">
            <tbody>
              {SIDES.map((ear) => (
                <tr key={ear} className="border-t first:border-t-0 align-top">
                  <td className="w-24 py-1 font-medium">{t(`form.${ear}`)}</td>
                  <td className="py-1 text-xs">
                    {s.retraction?.[ear]?.sade != null && (
                      <p>
                        {t("ret.sade")}: <strong>{s.retraction[ear]!.sade}</strong> — {SADE_GRADES.find((g) => g.value === s.retraction?.[ear]?.sade)?.text[lang]}
                      </p>
                    )}
                    {s.retraction?.[ear]?.tos != null && (
                      <p>
                        {t("ret.tos")}: <strong>{s.retraction[ear]!.tos}</strong> — {TOS_GRADES.find((g) => g.value === s.retraction?.[ear]?.tos)?.text[lang]}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReportSection>
      )}

      {s.cholesteatoma && (
        <ReportSection title={t("scale.cholesteatoma")}>
          <p className="text-sm">
            {t("oto.ear")}: <strong>{side(s.cholesteatoma.ear)}</strong>
            {s.cholesteatoma.type && (
              <>
                {" "}
                · {t("chole.type")}: <strong>{CHOLE_TYPE_TEXT[s.cholesteatoma.type][lang]}</strong>
              </>
            )}
          </p>
          {sum.cholesteatoma?.sites.length ? (
            <p className="text-sm">
              {t("chole.sites")}: {sum.cholesteatoma.sites.map((x) => STAM_TEXT[x][lang]).join("; ")}
            </p>
          ) : null}
          <p className="text-sm">
            {t("chole.extracranial")}: <strong>{yn(s.cholesteatoma.extracranial)}</strong> · {t("chole.intracranial")}: <strong>{yn(s.cholesteatoma.intracranial)}</strong>
          </p>
          <p className="text-sm font-semibold">{sum.cholesteatoma ? CHOLE_STAGE_TEXT[sum.cholesteatoma.stage][lang] : t("form.incomplete")}</p>
        </ReportSection>
      )}

      {s.meniere && (
        <ReportSection title={t("scale.meniere")}>
          <p className="text-sm">
            {t("oto.ear")}: <strong>{side(s.meniere.ear)}</strong>
          </p>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                {PTA_FREQUENCIES.map((f) => (
                  <td key={f} className="py-1">
                    <span className="text-xs text-neutral-500">{f >= 1000 ? `${f / 1000} kHz` : `${f} Hz`}</span>{" "}
                    <strong className="tabular-nums">{cell(s.meniere?.thresholds?.[f])}</strong>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          {s.meniere.source?.date && (
            <p className="text-xs text-neutral-600">
              {t(s.meniere.source.calibrated === false ? "men.taken.uncalibrated" : "men.taken", formatDay(s.meniere.source.date.slice(0, 10), lang))}
            </p>
          )}
          <p className="text-sm font-semibold">
            {sum.meniere?.pta != null && sum.meniere.stage ? `${t("men.pta")}: ${n(sum.meniere.pta)} dB — ${MENIERE_STAGE_TEXT[sum.meniere.stage][lang]}` : `${t("men.pta")}: —`}
          </p>
          <p className="text-sm">
            {t("men.barany")}: <strong>{sum.meniere?.barany ? t(`men.result.${sum.meniere.barany}`) : "—"}</strong>
          </p>
        </ReportSection>
      )}

      {s.koos && (
        <ReportSection title={t("scale.koos")}>
          <p className="text-sm">
            {t("oto.side")}: <strong>{side(s.koos.side)}</strong>
          </p>
          <p className="text-sm">{KOOS_GRADES.find((g) => g.value === sum.koos?.grade)?.text[lang] ?? t("form.incomplete")}</p>
        </ReportSection>
      )}

      {refs.length > 0 && <ReportReferences refs={refs} />}
    </>
  );
}
