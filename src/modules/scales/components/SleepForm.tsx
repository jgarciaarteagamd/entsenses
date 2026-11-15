// ENT Senses Scales — sleep and oropharynx pack form.
import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang, type Lang } from "@/modules/scales/i18n";
import {
  BRODSKY_GRADES,
  FRIEDMAN_TEXT,
  FTP_GRADES,
  FTP_TEXT,
  PARIKH_GRADES,
  SLEEP_REFERENCES,
  SLEEP_SCALES,
  SLEEP_SCALE_REFERENCES,
  VOTE_ALLOWED,
  VOTE_CONFIG_TEXT,
  VOTE_DEGREE_TEXT,
  VOTE_LEVELS,
  VOTE_LEVEL_TEXT,
  bmiOf,
  incompleteSleepScales,
  summarizeSleep,
  type ExamInput,
  type SleepScaleId,
  type SleepScales,
  type SleepStudyInput,
  type VoteDegree,
  type VoteInput,
} from "@/modules/scales/lib/sleep";
import { roman } from "@/modules/scales/lib/otology";
import { sanitizeLabel } from "@/modules/scales/lib/assessments";
import { FieldRow, GradeList, NumberInput, ReferenceList, ScaleSection, ScoreBadge, Segmented, YesNo } from "./controls";
import { SleepSummaryView } from "./SummaryView";
import type { PackFormProps } from "./AssessmentPage";

const fmtNum = (v: number | null | undefined, lang: Lang) => (v == null ? "—" : v.toLocaleString(lang === "en" ? "en-GB" : "es-ES", { maximumFractionDigits: 1 }));

export function SleepForm({ initial, saving, onSave }: PackFormProps<SleepScales>) {
  const { lang, t } = useLang();
  const [label, setLabel] = useState(initial.label ?? "");
  const [assessedOn, setAssessedOn] = useState(initial.assessedOn);
  const [scales, setScales] = useState<SleepScales>(initial.scales);
  const summary = useMemo(() => summarizeSleep(scales), [scales]);
  const inc = <ScoreBadge muted>{t("form.incomplete")}</ScoreBadge>;
  const s = summary;

  function include(id: SleepScaleId, on: boolean) {
    setScales((prev) => {
      const next = { ...prev };
      if (on) (next as Record<string, unknown>)[id] = (prev as Record<string, unknown>)[id] ?? {};
      else delete next[id];
      return next;
    });
  }
  function patch<K extends SleepScaleId>(id: K, v: NonNullable<SleepScales[K]>) {
    setScales((prev) => ({ ...prev, [id]: v }));
  }

  function submit() {
    if (!SLEEP_SCALES.some((k) => scales[k])) {
      alert(t("form.nothing"));
      return;
    }
    const missing = incompleteSleepScales(scales);
    if (missing.length && !confirm(t("form.confirm_incomplete", missing.map((m) => t(`scale.${m}`)).join(", ")))) return;
    onSave({ assessedOn, label: sanitizeLabel(label), scales });
  }

  const refs = [...new Set(SLEEP_SCALES.filter((k) => scales[k]).flatMap((k) => SLEEP_SCALE_REFERENCES[k]))].map((k) => SLEEP_REFERENCES[k]);

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
        title={t("scale.exam")}
        desc={t("scale.exam.desc")}
        included={!!scales.exam}
        onInclude={(v) => include("exam", v)}
        badge={s.exam ? <ScoreBadge>{s.exam.friedman ? `Friedman ${roman(s.exam.friedman)}` : `Brodsky ${s.exam.brodsky ?? "—"}`}</ScoreBadge> : inc}
      >
        <ExamFields value={scales.exam ?? {}} onChange={(v) => patch("exam", v)} />
      </ScaleSection>

      <ScaleSection
        title={t("scale.adenoid")}
        desc={t("scale.adenoid.desc")}
        included={!!scales.adenoid}
        onInclude={(v) => include("adenoid", v)}
        badge={s.adenoid != null ? <ScoreBadge>{`${s.adenoid}/4`}</ScoreBadge> : inc}
      >
        <GradeList grades={PARIKH_GRADES} value={scales.adenoid?.value} onChange={(v) => patch("adenoid", { value: v })} />
      </ScaleSection>

      <ScaleSection
        title={t("scale.vote")}
        desc={t("scale.vote.desc")}
        included={!!scales.vote}
        onInclude={(v) => include("vote", v)}
        badge={s.vote ? <ScoreBadge>{s.vote.notation}</ScoreBadge> : inc}
      >
        <VoteFields value={scales.vote ?? {}} onChange={(v) => patch("vote", v)} />
        {s.vote && <p className="mt-3 text-sm font-semibold">{t("vote.obstructed", s.vote.obstructed)}</p>}
      </ScaleSection>

      <ScaleSection
        title={t("scale.study")}
        desc={t("scale.study.desc")}
        included={!!scales.study}
        onInclude={(v) => include("study", v)}
        badge={s.study ? <ScoreBadge>{`${fmtNum(s.study.ahi, lang)} · ${t(`study.severity.${s.study.severity}`)}`}</ScoreBadge> : inc}
      >
        <StudyFields value={scales.study ?? {}} onChange={(v) => patch("study", v)} />
        {s.study && (
          <p className="mt-3 text-sm font-semibold">
            {t("study.ahi")}: {fmtNum(s.study.ahi, lang)} — {t(`study.severity.${s.study.severity}`)}
          </p>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground">{t("study.adults")}</p>
      </ScaleSection>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <p className="text-sm font-medium">{t("form.summary")}</p>
          <SleepSummaryView summary={summary} compact />
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

function ExamFields({ value, onChange }: { value: ExamInput; onChange: (v: ExamInput) => void }) {
  const { lang, t } = useLang();
  const set = (p: Partial<ExamInput>) => onChange({ ...value, ...p });
  const sum = summarizeSleep({ exam: value }).exam;
  const bmi = bmiOf(value.weightKg, value.heightCm);
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{t("exam.brodsky")}</p>
        <GradeList grades={BRODSKY_GRADES} value={value.brodsky} onChange={(v) => set({ brodsky: v })} />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{t("exam.ftp")}</p>
        {FTP_GRADES.map((g) => {
          const active = value.ftp === g;
          return (
            <button
              key={g}
              type="button"
              aria-pressed={active}
              onClick={() => set({ ftp: active ? null : g })}
              className={`flex w-full items-start gap-2 rounded-md border p-2 text-left text-xs transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
            >
              <span className="w-8 shrink-0 text-sm font-bold">{g}</span>
              <span>{FTP_TEXT[g][lang]}</span>
            </button>
          );
        })}
      </div>
      <div>
        <FieldRow label={t("exam.weight")}>
          <NumberInput ariaLabel={t("exam.weight")} value={value.weightKg} max={400} step={0.5} onChange={(v) => set({ weightKg: v })} />
        </FieldRow>
        <FieldRow label={t("exam.height")}>
          <NumberInput ariaLabel={t("exam.height")} value={value.heightCm} max={250} onChange={(v) => set({ heightCm: v })} />
        </FieldRow>
        <p className="py-1 text-xs tabular-nums">
          {t("exam.bmi")}: <strong>{fmtNum(bmi, lang)}</strong> <span className="text-muted-foreground">kg/m²</span>
        </p>
        <FieldRow label={t("exam.craniofacial")}>
          <YesNo ariaLabel={t("exam.craniofacial")} value={value.craniofacial} onChange={(v) => set({ craniofacial: v })} />
        </FieldRow>
      </div>
      <div className="rounded-md border p-3 text-sm">
        {sum?.friedman ? (
          <p className="font-semibold">{FRIEDMAN_TEXT[sum.friedman][lang]}</p>
        ) : (
          <p className="text-xs text-muted-foreground">{t("exam.friedman.missing")}</p>
        )}
      </div>
    </div>
  );
}

function VoteFields({ value, onChange }: { value: VoteInput; onChange: (v: VoteInput) => void }) {
  const { lang, t } = useLang();
  const degrees: VoteDegree[] = [0, 1, 2, "X"];
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-1 pr-2 font-medium">{t("vote.level")}</th>
              <th className="px-1 py-1 font-medium">{t("vote.degree")}</th>
              <th className="px-1 py-1 font-medium">{t("vote.config")}</th>
            </tr>
          </thead>
          <tbody>
            {VOTE_LEVELS.map((l) => {
              const cur = value[l] ?? {};
              const obstructed = cur.degree === 1 || cur.degree === 2;
              const allowed = VOTE_ALLOWED[l];
              return (
                <tr key={l} className="border-t">
                  <td className="py-2 pr-2">{VOTE_LEVEL_TEXT[l][lang]}</td>
                  <td className="px-1 py-2">
                    <Segmented<string>
                      ariaLabel={`${t("vote.degree")} · ${VOTE_LEVEL_TEXT[l][lang]}`}
                      options={degrees.map((d) => ({ value: String(d), label: String(d), title: VOTE_DEGREE_TEXT[String(d) as "0"][lang] }))}
                      value={cur.degree === undefined || cur.degree === null ? null : String(cur.degree)}
                      onChange={(v) => {
                        const degree = v === null ? null : v === "X" ? "X" : (Number(v) as 0 | 1 | 2);
                        const keep = degree === 1 || degree === 2;
                        onChange({ ...value, [l]: { degree, config: keep ? (cur.config ?? (allowed.length === 1 ? allowed[0] : null)) : null } });
                      }}
                    />
                  </td>
                  <td className="px-1 py-2">
                    {obstructed ? (
                      <Segmented
                        ariaLabel={`${t("vote.config")} · ${VOTE_LEVEL_TEXT[l][lang]}`}
                        options={allowed.map((c) => ({ value: c, label: VOTE_CONFIG_TEXT[c][lang] }))}
                        value={cur.config}
                        onChange={(c) => onChange({ ...value, [l]: { ...cur, config: c } })}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{(["0", "1", "2", "X"] as const).map((d) => VOTE_DEGREE_TEXT[d][lang]).join(" · ")}</p>
    </div>
  );
}

function StudyFields({ value, onChange }: { value: SleepStudyInput; onChange: (v: SleepStudyInput) => void }) {
  const { t } = useLang();
  const set = (p: Partial<SleepStudyInput>) => onChange({ ...value, ...p });
  return (
    <div>
      <FieldRow label={t("study.type")}>
        <Segmented
          ariaLabel={t("study.type")}
          options={(["psg", "hsat"] as const).map((x) => ({ value: x, label: t(`study.type.${x}`) }))}
          value={value.type}
          onChange={(v) => set({ type: v })}
        />
      </FieldRow>
      <FieldRow label={t("study.ahi")}>
        <NumberInput ariaLabel={t("study.ahi")} value={value.ahi} max={200} step={0.1} onChange={(v) => set({ ahi: v })} />
      </FieldRow>
      <FieldRow label={t("study.odi")}>
        <NumberInput ariaLabel={t("study.odi")} value={value.odi} max={200} step={0.1} onChange={(v) => set({ odi: v })} />
      </FieldRow>
      <FieldRow label={t("study.nadir")}>
        <NumberInput ariaLabel={t("study.nadir")} value={value.nadirSpo2} max={100} onChange={(v) => set({ nadirSpo2: v })} />
      </FieldRow>
      <FieldRow label={t("study.ct90")}>
        <NumberInput ariaLabel={t("study.ct90")} value={value.ct90} max={100} step={0.1} onChange={(v) => set({ ct90: v })} />
      </FieldRow>
    </div>
  );
}
