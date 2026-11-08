// Doctor's view of a patient's informative remote check: estimated (uncalibrated) levels,
// questionnaire, red flags, headphones and response reliability.
import { AlertTriangle } from "lucide-react";
import { useLang } from "@/modules/hearing/i18n";
import AudiogramChart from "@/modules/hearing/audiometric/components/AudiogramChart";
import { Ear } from "@/modules/hearing/audiometric/types";
import { normalizeAudiogram } from "@/modules/hearing/lib/report";
import type { SessionRow } from "@/modules/hearing/lib/sessions";
import { SCALE_QUESTIONS, estimatedPta, isAsymmetric, readRemoteAudiogram, type EstThresholds, type RemoteAnswers } from "@/modules/hearing/lib/remoteCheck";

/** Estimated thresholds as an AudiogramData for the chart (display only, never stored as `air`). */
export function remoteChartData(th: EstThresholds) {
  const raw: Record<string, { air: Record<number, number>; noResponse: { air: Record<number, boolean> } }> = {};
  for (const ear of ["right", "left"] as const) {
    raw[ear] = { air: {}, noResponse: { air: {} } };
    for (const [f, v] of Object.entries(th[ear])) {
      if (typeof v === "number") raw[ear].air[Number(f)] = v;
      else if (v === "nr") raw[ear].noResponse.air[Number(f)] = true;
    }
  }
  return normalizeAudiogram(raw);
}

export function RemoteCheckDetails({ r }: { r: SessionRow }) {
  const { t } = useLang();
  const th = readRemoteAudiogram(r.audiogram);
  if (!th) return null;
  const data = remoteChartData(th);
  const q = r.questionnaire as { answers?: RemoteAnswers; redFlags?: string[]; score?: number };
  const answers = q.answers ?? {};
  const flags = q.redFlags ?? [];
  const quality = r.quality ?? {};
  const assessment = (quality.assessment ?? {}) as { recommendation?: string; category?: Record<string, string> };
  const pta = { right: estimatedPta(th.right), left: estimatedPta(th.left) };
  const asym = isAsymmetric(th, pta.right, pta.left);

  const answerText = (k: keyof RemoteAnswers) => {
    const v = answers[k];
    if (v === undefined) return "—";
    if (k === "selfRating") return t(`pc.opt.rating.${v}`);
    if (k === "worseEar") return t(`pc.opt.worseEar.${v}`);
    if (k === "tinnitus") return t(`pc.opt.tinnitus.${v}`);
    return t(`pc.opt.freq.${v}`);
  };

  return (
    <div className="space-y-4">
      <p className="flex gap-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          <strong>{t("pc.doc.title")}.</strong> {t("pc.doc.banner")}
        </span>
      </p>
      {flags.length > 0 && (
        <div className="rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          <p className="font-semibold">{t("pc.doc.redflags")}</p>
          <ul className="list-disc pl-5">
            {flags.map((f) => (
              <li key={f}>{t(`pc.flag.${f}`)}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-4 text-slate-900 md:grid-cols-2">
        <div className="aspect-[4/3] overflow-hidden rounded-xl border border-red-200 bg-white sm:aspect-auto sm:h-[300px]">
          <AudiogramChart ear={Ear.Right} data={data.right} />
        </div>
        <div className="aspect-[4/3] overflow-hidden rounded-xl border border-blue-200 bg-white sm:aspect-auto sm:h-[300px]">
          <AudiogramChart ear={Ear.Left} data={data.left} />
        </div>
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="space-y-1 rounded border p-3">
          {(["right", "left"] as const).map((ear) => (
            <p key={ear}>
              <span className={ear === "right" ? "font-semibold text-red-600" : "font-semibold text-blue-600"}>{t(ear === "right" ? "pc.res.right" : "pc.res.left")}</span>
              {": "}
              {t("pc.doc.est_pta")} {pta[ear] !== null ? `≈ ${pta[ear]} dB` : "—"}
              {assessment.category?.[ear] && ` · ${t(`pc.cat.${assessment.category[ear]}`)}`}
            </p>
          ))}
          <p>
            {t("pc.doc.asymmetry")}: <strong>{asym ? t("pc.doc.yes") : t("pc.doc.no")}</strong>
          </p>
          {assessment.recommendation && (
            <p>
              {t("pc.doc.shown")}: <strong>{assessment.recommendation === "urgent" ? t("pc.urgent.title") : t(`pc.rec.${assessment.recommendation}.title`)}</strong>
            </p>
          )}
        </div>
        <div className="space-y-1 rounded border p-3">
          <p>
            {t("pc.doc.device")}: {r.device?.transducer === "earbuds" ? t("pc.hp.in") : r.device?.transducer === "circumaural" ? t("pc.hp.over") : "—"} ·{" "}
            {r.device?.connection === "wireless" ? t("pc.conn.wireless") : r.device?.connection === "wired" ? t("pc.conn.wired") : "—"}
          </p>
          {quality.channelCheck && <p>{t("pc.doc.channels_ok")}</p>}
          <p>{t("pc.doc.quality", quality.falsePositives ?? 0, quality.catchTrials ?? 0)}</p>
          {flags.length === 0 && (
            <p>
              {t("pc.doc.redflags")}: {t("pc.doc.none")}
            </p>
          )}
        </div>
      </div>
      <div className="rounded border p-3 text-sm">
        <p className="mb-2 font-semibold">{t("pc.doc.questionnaire", q.score ?? 0)}</p>
        <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[1fr_auto]">
          {[...SCALE_QUESTIONS, "worseEar" as const, "tinnitus" as const].map((k) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{t(`pc.q.${k}`)}</dt>
              <dd className="font-medium sm:text-right">{answerText(k)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
