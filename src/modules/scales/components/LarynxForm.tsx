// ENT Senses Scales — larynx and swallowing pack form.
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang, type Lang } from "@/modules/scales/i18n";
import {
  CONSISTENCIES,
  CONSISTENCY_TEXT,
  COTTON_TEXT,
  ELS_PATTERNS,
  ELS_TEXT,
  FOIS_GRADES,
  LARYNX_REFERENCES,
  LARYNX_SCALES,
  LARYNX_SCALE_REFERENCES,
  LARYNX_SITES,
  MURRAY_GRADES,
  NI_TEXT,
  NI_TYPES,
  PAS_GRADES,
  REINKE_GRADES,
  RFS_GRADES,
  RFS_ITEMS,
  RFS_NAMES,
  SITE_TEXT,
  YALE_PYRIFORM,
  YALE_VALLECULA,
  incompleteLarynxScales,
  summarizeLarynx,
  type BolusInput,
  type Consistency,
  type FeesInput,
  type LarynxScaleId,
  type LarynxScales,
  type LarynxSite,
  type NbiInput,
  type ReinkeInput,
  type RfsInput,
  type StenosisInput,
  type VoiceSnapshot,
} from "@/modules/scales/lib/larynx";
import { SIDES, type Grade } from "@/modules/scales/lib/types";
import { listVoiceByLabel, sanitizeLabel, type VoiceResultLite } from "@/modules/scales/lib/assessments";
import { FieldRow, GradeList, NumberInput, ReferenceList, ScaleSection, ScoreBadge, Segmented, YesNo } from "./controls";
import { LarynxSummaryView } from "./SummaryView";
import type { PackFormProps } from "./AssessmentPage";

const fmtDate = (iso: string, lang: Lang) => new Date(iso).toLocaleDateString(lang === "en" ? "en-GB" : "es-ES");
const fmtNum = (v: number | null | undefined, lang: Lang, d = 1) =>
  v == null ? "—" : v.toLocaleString(lang === "en" ? "en-GB" : "es-ES", { maximumFractionDigits: d });

export function LarynxForm({ initial, saving, onSave }: PackFormProps<LarynxScales>) {
  const { lang, t } = useLang();
  const [label, setLabel] = useState(initial.label ?? "");
  const [assessedOn, setAssessedOn] = useState(initial.assessedOn);
  const [scales, setScales] = useState<LarynxScales>(initial.scales);
  const summary = useMemo(() => summarizeLarynx(scales), [scales]);
  const inc = <ScoreBadge muted>{t("form.incomplete")}</ScoreBadge>;

  function include(id: LarynxScaleId, on: boolean) {
    setScales((s) => {
      const next = { ...s };
      if (on) (next as Record<string, unknown>)[id] = (s as Record<string, unknown>)[id] ?? {};
      else delete next[id];
      return next;
    });
  }
  function patch<K extends LarynxScaleId>(id: K, v: NonNullable<LarynxScales[K]>) {
    setScales((s) => ({ ...s, [id]: v }));
  }

  function submit() {
    if (!LARYNX_SCALES.some((k) => scales[k])) {
      alert(t("form.nothing"));
      return;
    }
    const missing = incompleteLarynxScales(scales);
    if (missing.length && !confirm(t("form.confirm_incomplete", missing.map((m) => t(`scale.${m}`)).join(", ")))) return;
    onSave({ assessedOn, label: sanitizeLabel(label), scales });
  }

  const refs = [...new Set(LARYNX_SCALES.filter((k) => scales[k]).flatMap((k) => LARYNX_SCALE_REFERENCES[k]))].map((k) => LARYNX_REFERENCES[k]);
  const s = summary;

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
        title={t("scale.rfs")}
        desc={t("scale.rfs.desc")}
        included={!!scales.rfs}
        onInclude={(v) => include("rfs", v)}
        badge={s.rfs ? <ScoreBadge>{`${s.rfs.total}/26`}</ScoreBadge> : inc}
      >
        <RfsFields value={scales.rfs ?? {}} onChange={(v) => patch("rfs", v)} />
        <p className="mt-2 text-sm font-semibold tabular-nums">
          {s.rfs ? `RFS ${s.rfs.total}/26 — ${s.rfs.aboveThreshold ? t("rfs.result.above") : t("rfs.result.below")}` : t("form.incomplete")}
        </p>
      </ScaleSection>

      <ScaleSection
        title={t("scale.reinke")}
        desc={t("scale.reinke.desc")}
        included={!!scales.reinke}
        onInclude={(v) => include("reinke", v)}
        badge={s.reinke ? <ScoreBadge>{`${t("reinke.max")} ${s.reinke.max}`}</ScoreBadge> : inc}
      >
        <ReinkeFields value={scales.reinke ?? {}} onChange={(v) => patch("reinke", v)} />
      </ScaleSection>

      <ScaleSection
        title={t("scale.nbi")}
        desc={t("scale.nbi.desc")}
        included={!!scales.nbi}
        onInclude={(v) => include("nbi", v)}
        badge={s.nbi ? <ScoreBadge>{[s.nbi.ni && `Ni ${s.nbi.ni}`, s.nbi.els && t(`nbi.els.${s.nbi.els}`)].filter(Boolean).join(" · ")}</ScoreBadge> : inc}
      >
        <NbiFields value={scales.nbi ?? {}} onChange={(v) => patch("nbi", v)} />
      </ScaleSection>

      <ScaleSection
        title={t("scale.stenosis")}
        desc={t("scale.stenosis.desc")}
        included={!!scales.stenosis}
        onInclude={(v) => include("stenosis", v)}
        badge={s.stenosis ? <ScoreBadge>{["I", "II", "III", "IV"][s.stenosis.grade - 1]}</ScoreBadge> : inc}
      >
        <StenosisFields value={scales.stenosis ?? {}} onChange={(v) => patch("stenosis", v)} />
        {s.stenosis && <p className="mt-2 text-sm font-semibold">{COTTON_TEXT[s.stenosis.grade][lang]}</p>}
      </ScaleSection>

      <ScaleSection
        title={t("scale.voice")}
        desc={t("scale.voice.desc")}
        included={!!scales.voice}
        onInclude={(v) => include("voice", v)}
        badge={s.voice ? <ScoreBadge>{s.voice.avqi != null ? `AVQI ${fmtNum(s.voice.avqi, lang, 2)}` : "Voice"}</ScoreBadge> : inc}
      >
        <VoiceFields label={label} value={scales.voice ?? {}} onChange={(v) => patch("voice", v)} />
      </ScaleSection>

      <ScaleSection
        title={t("scale.secretions")}
        desc={t("scale.secretions.desc")}
        included={!!scales.secretions}
        onInclude={(v) => include("secretions", v)}
        badge={s.secretions != null ? <ScoreBadge>{`${s.secretions}/3`}</ScoreBadge> : inc}
      >
        <GradeList grades={MURRAY_GRADES} value={scales.secretions?.value} onChange={(v) => patch("secretions", { value: v })} />
      </ScaleSection>

      <ScaleSection
        title={t("scale.fees")}
        desc={t("scale.fees.desc")}
        included={!!scales.fees}
        onInclude={(v) => include("fees", v)}
        badge={s.fees ? <ScoreBadge>{s.fees.pas != null ? `PAS ${s.fees.pas}` : "Yale"}</ScoreBadge> : inc}
      >
        <FeesFields value={scales.fees ?? {}} onChange={(v) => patch("fees", v)} />
        {s.fees?.pas != null && s.fees.pasClass && s.fees.pasConsistency && (
          <p className="mt-2 text-sm font-semibold">
            {t("fees.worst", s.fees.pas, CONSISTENCY_TEXT[s.fees.pasConsistency][lang])} — {t(`fees.class.${s.fees.pasClass}`)}
          </p>
        )}
      </ScaleSection>

      <ScaleSection
        title={t("scale.fois")}
        desc={t("scale.fois.desc")}
        included={!!scales.fois}
        onInclude={(v) => include("fois", v)}
        badge={s.fois != null ? <ScoreBadge>{`${s.fois}/7`}</ScoreBadge> : inc}
      >
        <GradeList grades={FOIS_GRADES} value={scales.fois?.value} onChange={(v) => patch("fois", { value: v })} />
      </ScaleSection>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <p className="text-sm font-medium">{t("form.summary")}</p>
          <LarynxSummaryView summary={summary} compact />
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

const gradeOptions = (grades: Grade[], lang: Lang) => grades.map((g) => ({ value: g.value, label: `${g.text[lang]} (${g.value})` }));

function RfsFields({ value, onChange }: { value: RfsInput; onChange: (v: RfsInput) => void }) {
  const { lang } = useLang();
  return (
    <div>
      {RFS_ITEMS.map((k) => (
        <FieldRow key={k} label={RFS_NAMES[k][lang]}>
          <Segmented
            ariaLabel={RFS_NAMES[k][lang]}
            options={gradeOptions(RFS_GRADES[k], lang)}
            value={value[k] ?? null}
            onChange={(g) => onChange({ ...value, [k]: g })}
            className="justify-end"
          />
        </FieldRow>
      ))}
    </div>
  );
}

function ReinkeFields({ value, onChange }: { value: ReinkeInput; onChange: (v: ReinkeInput) => void }) {
  const { t } = useLang();
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {SIDES.map((side) => {
          const other = side === "right" ? "left" : "right";
          const blocked = value[other] === 4;
          return (
            <div key={side} className="space-y-1.5">
              <p className="text-sm font-medium">{t(`form.${side}`)}</p>
              {blocked && <p className="text-xs text-muted-foreground">{t("reinke.not_graded")}</p>}
              <GradeList
                grades={REINKE_GRADES}
                value={blocked ? null : value[side]}
                disabled={blocked}
                onChange={(g) => onChange({ ...value, [side]: g, ...(g === 4 ? { [other]: null } : {}) })}
              />
            </div>
          );
        })}
      </div>
      <FieldRow label={t("reinke.packYears")}>
        <NumberInput ariaLabel={t("reinke.packYears")} value={value.packYears} max={200} onChange={(v) => onChange({ ...value, packYears: v })} />
      </FieldRow>
      <p className="text-[11px] text-muted-foreground">{t("reinke.yonekawa")}</p>
    </div>
  );
}

function NbiFields({ value, onChange }: { value: NbiInput; onChange: (v: NbiInput) => void }) {
  const { lang, t } = useLang();
  const set = (p: Partial<NbiInput>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-4">
      <div>
        <FieldRow label={t("nbi.site")}>
          <select
            aria-label={t("nbi.site")}
            value={value.site ?? ""}
            onChange={(e) => set({ site: (e.target.value || null) as LarynxSite | null })}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">{t("nbi.site.none")}</option>
            {LARYNX_SITES.map((x) => (
              <option key={x} value={x}>
                {SITE_TEXT[x][lang]}
              </option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label={t("nbi.leukoplakia")}>
          <YesNo ariaLabel={t("nbi.leukoplakia")} value={value.leukoplakia} onChange={(v) => set({ leukoplakia: v })} />
        </FieldRow>
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{t("nbi.ni")}</p>
        {NI_TYPES.map((n) => {
          const active = value.ni === n;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={active}
              onClick={() => set({ ni: active ? null : n })}
              className={`flex w-full items-start gap-2 rounded-md border p-2 text-left text-xs transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
            >
              <span className="w-7 shrink-0 text-sm font-bold">{n}</span>
              <span>{NI_TEXT[n][lang]}</span>
            </button>
          );
        })}
        {value.ni === "IV" && <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">{t("nbi.typeIV")}</p>}
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{t("nbi.els")}</p>
        <Segmented
          ariaLabel={t("nbi.els")}
          options={ELS_PATTERNS.map((x) => ({ value: x, label: ELS_TEXT[x][lang] }))}
          value={value.els}
          onChange={(v) => set({ els: v })}
        />
      </div>
    </div>
  );
}

function StenosisFields({ value, onChange }: { value: StenosisInput; onChange: (v: StenosisInput) => void }) {
  const { t } = useLang();
  return (
    <div>
      <FieldRow label={t("stenosis.noLumen")}>
        <YesNo ariaLabel={t("stenosis.noLumen")} value={value.noLumen} onChange={(v) => onChange({ ...value, noLumen: v })} />
      </FieldRow>
      {value.noLumen !== true && (
        <FieldRow label={t("stenosis.pct")}>
          <NumberInput ariaLabel={t("stenosis.pct")} value={value.obstructionPct} max={100} onChange={(v) => onChange({ ...value, obstructionPct: v })} />
        </FieldRow>
      )}
    </div>
  );
}

function snapshotOf(r: VoiceResultLite): VoiceSnapshot {
  const clinicianG = r.clinician?.grbas?.G;
  const estimateG = r.estimates?.grbas?.G;
  return {
    resultId: r.id,
    date: r.created_at,
    avqi: r.metrics?.avqi?.value ?? null,
    cpps: r.metrics?.vowel?.cpps ?? null,
    f0: r.metrics?.speech?.f0Mean ?? r.metrics?.vowel?.f0Mean ?? null,
    mpt: r.metrics?.mptSeconds ?? null,
    grbasG: typeof clinicianG === "number" ? clinicianG : typeof estimateG === "number" ? estimateG : null,
    gSource: typeof clinicianG === "number" ? "clinician" : typeof estimateG === "number" ? "estimate" : null,
  };
}

function VoiceValues({ v }: { v: VoiceSnapshot }) {
  const { lang, t } = useLang();
  return (
    <span className="tabular-nums">
      AVQI <strong>{fmtNum(v.avqi, lang, 2)}</strong> · CPPS <strong>{fmtNum(v.cpps, lang)}</strong> dB · {t("voice.f0")} <strong>{fmtNum(v.f0, lang, 0)}</strong> ·{" "}
      {t("voice.mpt")} <strong>{fmtNum(v.mpt, lang)}</strong>
      {v.grbasG != null && (
        <>
          {" "}
          · {v.gSource === "clinician" ? t("voice.g.clinician") : t("voice.g.estimate")} <strong>{v.grbasG}</strong>
        </>
      )}
    </span>
  );
}

function VoiceFields({ label, value, onChange }: { label: string; value: VoiceSnapshot; onChange: (v: VoiceSnapshot) => void }) {
  const { lang, t } = useLang();
  const clean = sanitizeLabel(label);
  const { data, isFetching } = useQuery({ queryKey: ["scales-voice", clean], queryFn: () => listVoiceByLabel(clean), enabled: !!clean });
  return (
    <div className="space-y-3 text-xs">
      {value.date && (
        <div className="rounded-md border p-3">
          <p className="mb-1 font-medium">{t("voice.attached", fmtDate(value.date, lang))}</p>
          <VoiceValues v={value} />
        </div>
      )}
      <div className="rounded-md bg-muted/60 p-3">
        {!clean ? (
          <p className="text-muted-foreground">{t("voice.no_label")}</p>
        ) : isFetching && !data ? (
          <p className="text-muted-foreground">{t("list.loading")}</p>
        ) : data && data.length ? (
          <ul className="space-y-2">
            {data.slice(0, 5).map((r) => {
              const snap = snapshotOf(r);
              const attached = value.resultId === r.id;
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <span className="font-medium">{fmtDate(r.created_at, lang)}</span> · <VoiceValues v={snap} />
                  </span>
                  <Button size="sm" variant={attached ? "default" : "outline"} onClick={() => onChange(snap)} disabled={attached}>
                    <Link2 className="mr-1 h-3.5 w-3.5" />
                    {t("voice.attach")}
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground">{t("voice.none")}</p>
        )}
      </div>
    </div>
  );
}

function FeesFields({ value, onChange }: { value: FeesInput; onChange: (v: FeesInput) => void }) {
  const { lang, t } = useLang();
  const set = (c: Consistency, k: keyof BolusInput, v: number | null) => onChange({ ...value, [c]: { ...(value[c] ?? {}), [k]: v } });
  const sel = (c: Consistency, k: keyof BolusInput, grades: Grade[], name: string) => (
    <select
      aria-label={`${name} · ${CONSISTENCY_TEXT[c][lang]}`}
      value={value[c]?.[k] ?? ""}
      onChange={(e) => set(c, k, e.target.value ? Number(e.target.value) : null)}
      className="h-8 w-16 rounded-md border bg-background px-1 text-sm tabular-nums"
      title={grades.find((g) => g.value === value[c]?.[k])?.text[lang]}
    >
      <option value="">—</option>
      {grades.map((g) => (
        <option key={g.value} value={g.value} title={g.text[lang]}>
          {g.value}
        </option>
      ))}
    </select>
  );
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-1 pr-2 font-medium">{t("fees.consistency")}</th>
              <th className="px-1 py-1 font-medium">{t("fees.pas")}</th>
              <th className="px-1 py-1 font-medium">{t("fees.yaleV")}</th>
              <th className="px-1 py-1 font-medium">{t("fees.yaleP")}</th>
            </tr>
          </thead>
          <tbody>
            {CONSISTENCIES.map((c) => (
              <tr key={c} className="border-t">
                <td className="py-2 pr-2">{CONSISTENCY_TEXT[c][lang]}</td>
                <td className="px-1 py-2">{sel(c, "pas", PAS_GRADES, "PAS")}</td>
                <td className="px-1 py-2">{sel(c, "yaleV", YALE_VALLECULA, t("fees.yaleV"))}</td>
                <td className="px-1 py-2">{sel(c, "yaleP", YALE_PYRIFORM, t("fees.yaleP"))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">{t("form.legend")}</summary>
        <div className="mt-1 space-y-2">
          {[
            { name: "PAS", grades: PAS_GRADES },
            { name: t("fees.yaleV"), grades: YALE_VALLECULA },
            { name: t("fees.yaleP"), grades: YALE_PYRIFORM },
          ].map((x) => (
            <div key={x.name}>
              <p className="font-medium text-foreground">{x.name}</p>
              <ul>
                {x.grades.map((g) => (
                  <li key={g.value}>
                    {g.value} — {g.text[lang]}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
