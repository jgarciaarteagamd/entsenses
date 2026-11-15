// ENT Senses Scales — otology and skull base pack form.
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Download, Minus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang, type Lang } from "@/modules/scales/i18n";
import {
  CHOLE_STAGE_TEXT,
  CHOLE_TYPES,
  CHOLE_TYPE_TEXT,
  HB_GRADES,
  KOOS_GRADES,
  MENIERE_STAGE_TEXT,
  OTOLOGY_REFERENCES,
  OTOLOGY_SCALES,
  OTOLOGY_SCALE_REFERENCES,
  PTA_FREQUENCIES,
  SADE_GRADES,
  SB_CHEEK,
  SB_EXPRESSIONS,
  SB_EXPRESSION_TEXT,
  SB_EYE,
  SB_MOUTH,
  SB_SYNKINESIS,
  SB_VOLUNTARY,
  STAM_SITES,
  STAM_TEXT,
  TOS_GRADES,
  incompleteOtologyScales,
  meniereStage,
  pta4,
  roman,
  scoreBarany,
  summarizeOtology,
  thresholdsFromAudiogram,
  type CholeType,
  type CholesteatomaInput,
  type MeniereInput,
  type OtologyScaleId,
  type OtologyScales,
  type RetractionInput,
  type SunnybrookInput,
} from "@/modules/scales/lib/otology";
import { SIDES, type Side } from "@/modules/scales/lib/types";
import { listHearingByLabel, sanitizeLabel } from "@/modules/scales/lib/assessments";
import { FieldRow, GradeList, NumberInput, ReferenceList, ScaleSection, ScoreBadge, Segmented, YesNo } from "./controls";
import { OtologySummaryView } from "./SummaryView";
import type { PackFormProps } from "./AssessmentPage";

const fmtDate = (iso: string, lang: Lang) => new Date(iso).toLocaleDateString(lang === "en" ? "en-GB" : "es-ES");
const fmtNum = (v: number, lang: Lang) => v.toLocaleString(lang === "en" ? "en-GB" : "es-ES", { maximumFractionDigits: 1 });

function SidePicker({ value, onChange, ear }: { value: Side | null | undefined; onChange: (v: Side | null) => void; ear?: boolean }) {
  const { t } = useLang();
  return (
    <FieldRow label={ear ? t("oto.ear") : t("oto.side")}>
      <Segmented ariaLabel={ear ? t("oto.ear") : t("oto.side")} options={SIDES.map((s) => ({ value: s, label: t(`form.${s}`) }))} value={value} onChange={onChange} />
    </FieldRow>
  );
}

export function OtologyForm({ initial, saving, onSave }: PackFormProps<OtologyScales>) {
  const { lang, t } = useLang();
  const [label, setLabel] = useState(initial.label ?? "");
  const [assessedOn, setAssessedOn] = useState(initial.assessedOn);
  const [scales, setScales] = useState<OtologyScales>(initial.scales);
  const summary = useMemo(() => summarizeOtology(scales), [scales]);
  const inc = <ScoreBadge muted>{t("form.incomplete")}</ScoreBadge>;
  const s = summary;

  function include(id: OtologyScaleId, on: boolean) {
    setScales((prev) => {
      const next = { ...prev };
      if (on) (next as Record<string, unknown>)[id] = (prev as Record<string, unknown>)[id] ?? {};
      else delete next[id];
      return next;
    });
  }
  function patch<K extends OtologyScaleId>(id: K, v: NonNullable<OtologyScales[K]>) {
    setScales((prev) => ({ ...prev, [id]: v }));
  }

  function submit() {
    if (!OTOLOGY_SCALES.some((k) => scales[k])) {
      alert(t("form.nothing"));
      return;
    }
    const missing = incompleteOtologyScales(scales);
    if (missing.length && !confirm(t("form.confirm_incomplete", missing.map((m) => t(`scale.${m}`)).join(", ")))) return;
    onSave({ assessedOn, label: sanitizeLabel(label), scales });
  }

  const refs = [...new Set(OTOLOGY_SCALES.filter((k) => scales[k]).flatMap((k) => OTOLOGY_SCALE_REFERENCES[k]))].map((k) => OTOLOGY_REFERENCES[k]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1">
            <Label htmlFor="label">{t("form.label")}</Label>
            <Input id="label" value={label} maxLength={60} onChange={(e) => setLabel(e.target.value.slice(0, 60))} placeholder={t("form.label.placeholder")} />
            <p className="text-[11px] text-muted-foreground">{t("form.label.hint")}</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="date">{t("form.date")}</Label>
            <Input id="date" type="date" value={assessedOn} onChange={(e) => e.target.value && setAssessedOn(e.target.value)} className="w-44" />
          </div>
        </CardContent>
      </Card>

      <ScaleSection
        title={t("scale.houseBrackmann")}
        desc={t("scale.houseBrackmann.desc")}
        included={!!scales.houseBrackmann}
        onInclude={(v) => include("houseBrackmann", v)}
        badge={s.houseBrackmann ? <ScoreBadge>{roman(s.houseBrackmann.grade)}</ScoreBadge> : inc}
      >
        <SidePicker value={scales.houseBrackmann?.side} onChange={(v) => patch("houseBrackmann", { ...scales.houseBrackmann, side: v })} />
        <div className="mt-3">
          <GradeList grades={HB_GRADES} marker={null} value={scales.houseBrackmann?.grade} onChange={(v) => patch("houseBrackmann", { ...scales.houseBrackmann, grade: v })} />
        </div>
      </ScaleSection>

      <ScaleSection
        title={t("scale.sunnybrook")}
        desc={t("scale.sunnybrook.desc")}
        included={!!scales.sunnybrook}
        onInclude={(v) => include("sunnybrook", v)}
        badge={s.sunnybrook ? <ScoreBadge>{`${s.sunnybrook.composite}/100`}</ScoreBadge> : inc}
      >
        <SunnybrookFields value={scales.sunnybrook ?? {}} onChange={(v) => patch("sunnybrook", v)} />
        {s.sunnybrook && (
          <p className="mt-3 text-sm font-semibold tabular-nums">
            {t("sb.result", s.sunnybrook.voluntary, s.sunnybrook.resting, s.sunnybrook.synkinesis, s.sunnybrook.composite)}
          </p>
        )}
      </ScaleSection>

      <ScaleSection
        title={t("scale.retraction")}
        desc={t("scale.retraction.desc")}
        included={!!scales.retraction}
        onInclude={(v) => include("retraction", v)}
        badge={s.retraction ? <ScoreBadge>✓</ScoreBadge> : inc}
      >
        <RetractionFields value={scales.retraction ?? {}} onChange={(v) => patch("retraction", v)} />
      </ScaleSection>

      <ScaleSection
        title={t("scale.cholesteatoma")}
        desc={t("scale.cholesteatoma.desc")}
        included={!!scales.cholesteatoma}
        onInclude={(v) => include("cholesteatoma", v)}
        badge={s.cholesteatoma ? <ScoreBadge>{`${t("oto.stage")} ${roman(s.cholesteatoma.stage)}`}</ScoreBadge> : inc}
      >
        <CholesteatomaFields value={scales.cholesteatoma ?? {}} onChange={(v) => patch("cholesteatoma", v)} />
        {s.cholesteatoma && <p className="mt-3 text-sm font-semibold">{CHOLE_STAGE_TEXT[s.cholesteatoma.stage][lang]}</p>}
      </ScaleSection>

      <ScaleSection
        title={t("scale.meniere")}
        desc={t("scale.meniere.desc")}
        included={!!scales.meniere}
        onInclude={(v) => include("meniere", v)}
        badge={s.meniere ? <ScoreBadge>{s.meniere.stage ? `${t("oto.stage")} ${s.meniere.stage}` : t(`men.result.${s.meniere.barany}`)}</ScoreBadge> : inc}
      >
        <MeniereFields label={label} value={scales.meniere ?? {}} onChange={(v) => patch("meniere", v)} />
      </ScaleSection>

      <ScaleSection
        title={t("scale.koos")}
        desc={t("scale.koos.desc")}
        included={!!scales.koos}
        onInclude={(v) => include("koos", v)}
        badge={s.koos ? <ScoreBadge>{roman(s.koos.grade)}</ScoreBadge> : inc}
      >
        <SidePicker value={scales.koos?.side} onChange={(v) => patch("koos", { ...scales.koos, side: v })} />
        <div className="mt-3">
          <GradeList grades={KOOS_GRADES} marker={null} value={scales.koos?.grade} onChange={(v) => patch("koos", { ...scales.koos, grade: v })} />
        </div>
      </ScaleSection>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <p className="text-sm font-medium">{t("form.summary")}</p>
          <OtologySummaryView summary={summary} compact />
          <Button onClick={submit} disabled={saving} className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            {saving ? t("form.saving") : t("form.save")}
          </Button>
        </CardContent>
      </Card>

      <ReferenceList refs={refs} />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

function SunnybrookFields({ value, onChange }: { value: SunnybrookInput; onChange: (v: SunnybrookInput) => void }) {
  const { lang, t } = useLang();
  const opts = <T extends string>(list: { value: T; points: number; text: { es: string; en: string } }[]) =>
    list.map((x) => ({ value: x.value, label: `${x.text[lang]} (${x.points})` }));
  const num = (grades: { value: number; text: { es: string; en: string } }[]) => grades.map((g) => ({ value: g.value, label: String(g.value), title: g.text[lang] }));
  return (
    <div className="space-y-4">
      <SidePicker value={value.side} onChange={(v) => onChange({ ...value, side: v })} />
      <div>
        <p className="text-sm font-medium">{t("sb.resting")}</p>
        <FieldRow label={t("sb.eye")}>
          <Segmented ariaLabel={t("sb.eye")} options={opts(SB_EYE)} value={value.eye} onChange={(v) => onChange({ ...value, eye: v })} className="justify-end" />
        </FieldRow>
        <FieldRow label={t("sb.cheek")}>
          <Segmented ariaLabel={t("sb.cheek")} options={opts(SB_CHEEK)} value={value.cheek} onChange={(v) => onChange({ ...value, cheek: v })} className="justify-end" />
        </FieldRow>
        <FieldRow label={t("sb.mouth")}>
          <Segmented ariaLabel={t("sb.mouth")} options={opts(SB_MOUTH)} value={value.mouth} onChange={(v) => onChange({ ...value, mouth: v })} className="justify-end" />
        </FieldRow>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-1 pr-2 font-medium">{t("sb.expression")}</th>
              <th className="px-1 py-1 font-medium">{t("sb.voluntary")}</th>
              <th className="px-1 py-1 font-medium">{t("sb.synkinesis")}</th>
            </tr>
          </thead>
          <tbody>
            {SB_EXPRESSIONS.map((e) => (
              <tr key={e} className="border-t">
                <td className="py-2 pr-2">{SB_EXPRESSION_TEXT[e][lang]}</td>
                <td className="px-1 py-2">
                  <Segmented
                    ariaLabel={`${t("sb.voluntary")} · ${SB_EXPRESSION_TEXT[e][lang]}`}
                    options={num(SB_VOLUNTARY)}
                    value={value.voluntary?.[e]}
                    onChange={(v) => onChange({ ...value, voluntary: { ...value.voluntary, [e]: v } })}
                  />
                </td>
                <td className="px-1 py-2">
                  <Segmented
                    ariaLabel={`${t("sb.synkinesis")} · ${SB_EXPRESSION_TEXT[e][lang]}`}
                    options={num(SB_SYNKINESIS)}
                    value={value.synkinesis?.[e]}
                    onChange={(v) => onChange({ ...value, synkinesis: { ...value.synkinesis, [e]: v } })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">{t("form.legend")}</summary>
        <p className="mt-1">
          <span className="font-medium text-foreground">{t("sb.voluntary")}:</span> {SB_VOLUNTARY.map((g) => `${g.value} ${g.text[lang]}`).join(" · ")}
        </p>
        <p>
          <span className="font-medium text-foreground">{t("sb.synkinesis")}:</span> {SB_SYNKINESIS.map((g) => `${g.value} ${g.text[lang]}`).join(" · ")}
        </p>
      </details>
    </div>
  );
}

function RetractionFields({ value, onChange }: { value: RetractionInput; onChange: (v: RetractionInput) => void }) {
  const { t } = useLang();
  const set = (side: Side, k: "sade" | "tos", v: number | null) => onChange({ ...value, [side]: { ...(value[side] ?? {}), [k]: v } });
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {SIDES.map((side) => (
        <div key={side} className="space-y-3">
          <p className="text-sm font-semibold">{t(`form.${side}`)}</p>
          <div className="space-y-1.5">
            <p className="text-xs font-medium">{t("ret.sade")}</p>
            <GradeList grades={SADE_GRADES} value={value[side]?.sade} onChange={(v) => set(side, "sade", v)} />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium">{t("ret.tos")}</p>
            <GradeList grades={TOS_GRADES} value={value[side]?.tos} onChange={(v) => set(side, "tos", v)} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CholesteatomaFields({ value, onChange }: { value: CholesteatomaInput; onChange: (v: CholesteatomaInput) => void }) {
  const { lang, t } = useLang();
  const set = (p: Partial<CholesteatomaInput>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-4">
      <div>
        <SidePicker ear value={value.ear} onChange={(v) => set({ ear: v })} />
        <FieldRow label={t("chole.type")}>
          <select
            aria-label={t("chole.type")}
            value={value.type ?? ""}
            onChange={(e) => set({ type: (e.target.value || null) as CholeType | null })}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">{t("chole.type.none")}</option>
            {CHOLE_TYPES.map((x) => (
              <option key={x} value={x}>
                {CHOLE_TYPE_TEXT[x][lang]}
              </option>
            ))}
          </select>
        </FieldRow>
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{t("chole.sites")}</p>
        {STAM_SITES.map((site) => {
          const on = value.sites?.[site] === true;
          return (
            <button
              key={site}
              type="button"
              aria-pressed={on}
              onClick={() => set({ sites: { ...value.sites, [site]: !on } })}
              className={`flex w-full items-center gap-2 rounded-md border p-2 text-left text-xs transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
            >
              {on ? <Check className="h-4 w-4 shrink-0" /> : <Minus className="h-4 w-4 shrink-0 opacity-40" />}
              {STAM_TEXT[site][lang]}
            </button>
          );
        })}
      </div>
      <div>
        <FieldRow label={t("chole.extracranial")} hint={t("chole.extracranial.hint")}>
          <YesNo ariaLabel={t("chole.extracranial")} value={value.extracranial} onChange={(v) => set({ extracranial: v })} />
        </FieldRow>
        <FieldRow label={t("chole.intracranial")}>
          <YesNo ariaLabel={t("chole.intracranial")} value={value.intracranial} onChange={(v) => set({ intracranial: v })} />
        </FieldRow>
      </div>
    </div>
  );
}

function MeniereFields({ label, value, onChange }: { label: string; value: MeniereInput; onChange: (v: MeniereInput) => void }) {
  const { lang, t } = useLang();
  const set = (p: Partial<MeniereInput>) => onChange({ ...value, ...p });
  const clean = sanitizeLabel(label);
  const { data, isFetching } = useQuery({ queryKey: ["scales-hearing", clean], queryFn: () => listHearingByLabel(clean), enabled: !!clean });
  const pta = pta4(value.thresholds);
  const stage = pta === null ? null : meniereStage(pta);
  const barany = scoreBarany(value);

  return (
    <div className="space-y-4">
      <SidePicker ear value={value.ear} onChange={(v) => set({ ear: v })} />

      <div className="rounded-md bg-muted/60 p-3 text-xs">
        <p className="mb-2 font-medium">{t("men.from_hearing")}</p>
        {!clean ? (
          <p className="text-muted-foreground">{t("men.no_label")}</p>
        ) : isFetching && !data ? (
          <p className="text-muted-foreground">{t("list.loading")}</p>
        ) : data && data.length ? (
          <ul className="space-y-2">
            {data.slice(0, 5).map((sess) => (
              <li key={sess.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="font-medium">{fmtDate(sess.created_at, lang)}</span>
                  {!sess.calibrated && <span className="ml-1 rounded bg-amber-100 px-1 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">{t("men.uncalibrated")}</span>}
                  {SIDES.map((ear) => {
                    const r = thresholdsFromAudiogram(sess.audiogram, ear);
                    const p = pta4(r.thresholds);
                    return (
                      <span key={ear} className="ml-2 tabular-nums">
                        {t(`form.${ear}`).charAt(0)}: {p !== null ? `${fmtNum(p, lang)} dB` : r.noResponse.length ? t("men.nr", r.noResponse.join(", ")) : t("men.missing", r.missing.join(", "))}
                      </span>
                    );
                  })}
                </span>
                <span className="flex gap-1">
                  {SIDES.map((ear) => {
                    const r = thresholdsFromAudiogram(sess.audiogram, ear);
                    const usable = pta4(r.thresholds) !== null;
                    return (
                      <Button
                        key={ear}
                        size="sm"
                        variant="outline"
                        disabled={!usable}
                        onClick={() => set({ ear, thresholds: r.thresholds, source: { sessionId: sess.id, date: sess.created_at, calibrated: sess.calibrated } })}
                      >
                        <Download className="mr-1 h-3.5 w-3.5" />
                        {t(`men.use.${ear}`)}
                      </Button>
                    );
                  })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{t("men.none")}</p>
        )}
      </div>

      <div>
        <p className="text-sm font-medium">{t("men.thresholds")}</p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PTA_FREQUENCIES.map((f) => (
            <label key={f} className="space-y-1 text-xs">
              <span className="block text-muted-foreground">{f >= 1000 ? `${f / 1000} kHz` : `${f} Hz`}</span>
              <NumberInput
                ariaLabel={`${f} Hz`}
                value={value.thresholds?.[f]}
                min={-10}
                max={130}
                step={5}
                onChange={(v) => set({ thresholds: { ...value.thresholds, [f]: v }, source: null })}
                className="w-full"
              />
            </label>
          ))}
        </div>
        {value.source?.date && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t(value.source.calibrated === false ? "men.taken.uncalibrated" : "men.taken", fmtDate(value.source.date, lang))}
          </p>
        )}
        <p className="mt-2 text-sm font-semibold tabular-nums">
          {pta !== null && stage ? `${t("men.pta")}: ${fmtNum(pta, lang)} dB — ${MENIERE_STAGE_TEXT[stage][lang]}` : `${t("men.pta")}: —`}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium">{t("men.barany")}</p>
        <FieldRow label={t("men.episodes")}>
          <YesNo ariaLabel={t("men.episodes")} value={value.episodes} onChange={(v) => set({ episodes: v })} />
        </FieldRow>
        <FieldRow label={t("men.symptom")}>
          <Segmented
            ariaLabel={t("men.symptom")}
            options={(["vertigo", "dizziness"] as const).map((x) => ({ value: x, label: t(`men.symptom.${x}`) }))}
            value={value.symptom}
            onChange={(v) => set({ symptom: v })}
          />
        </FieldRow>
        <FieldRow label={t("men.duration")}>
          <Segmented
            ariaLabel={t("men.duration")}
            options={(["20m-12h", "12h-24h", "other"] as const).map((x) => ({ value: x, label: t(`men.duration.${x}`) }))}
            value={value.duration}
            onChange={(v) => set({ duration: v })}
          />
        </FieldRow>
        <FieldRow label={t("men.snhl")}>
          <YesNo ariaLabel={t("men.snhl")} value={value.snhl} onChange={(v) => set({ snhl: v })} />
        </FieldRow>
        <FieldRow label={t("men.fluctuating")}>
          <YesNo ariaLabel={t("men.fluctuating")} value={value.fluctuating} onChange={(v) => set({ fluctuating: v })} />
        </FieldRow>
        <FieldRow label={t("men.notBetter")}>
          <YesNo ariaLabel={t("men.notBetter")} value={value.notBetterAccounted} onChange={(v) => set({ notBetterAccounted: v })} />
        </FieldRow>
        <p className="mt-2 text-sm font-semibold">{barany ? t(`men.result.${barany}`) : <span className="text-xs font-normal text-muted-foreground">{t("form.incomplete")}</span>}</p>
      </div>
    </div>
  );
}
