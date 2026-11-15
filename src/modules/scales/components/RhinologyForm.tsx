// ENT Senses Scales — rhinology pack form: every scale can be switched on or off; scores update live.
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Download, Minus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang, type Lang } from "@/modules/scales/i18n";
import {
  BIOLOGICS,
  BIOLOGIC_CRITERIA,
  BIOLOGIC_TEXT,
  CONTROL_ITEMS,
  CONTROL_TEXT,
  LK_GRADES,
  LK_ITEMS,
  LK_NAMES,
  LM_ITEMS,
  LM_NAMES,
  LM_SINUS_GRADES,
  LM_OMC_GRADES,
  NPS_GRADES,
  RESPONSE_CRITERIA,
  RESPONSE_TEXT,
  RHINOLOGY_REFERENCES,
  RHINOLOGY_SCALES,
  SCALE_REFERENCES,
  SIDES,
  SMELL_TESTS,
  SNOT22_MCID,
  TIMEPOINTS,
  incompleteScales,
  lmGrades,
  summarizeRhinology,
  type BiologicInput,
  type ControlInput,
  type Grade,
  type LkInput,
  type LmInput,
  type NpsInput,
  type ResponseInput,
  type RhinologyScaleId,
  type RhinologyScales,
  type RhinologySummary,
  type Side,
  type SidedScore,
  type Snot22Input,
} from "@/modules/scales/lib/rhinology";
import { listSnot22ByLabel, sanitizeLabel, type AssessmentInput, type RowOf, type ScaleAssessmentRow } from "@/modules/scales/lib/assessments";
import { FieldRow, NumberInput, ScaleSection, ScoreBadge, Segmented, YesNo } from "./controls";
import { RhinologySummaryView } from "./SummaryView";

const fmtDate = (iso: string, lang: Lang) =>
  new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString(lang === "en" ? "en-GB" : "es-ES");

const gradeOptions = (grades: Grade[], lang: Lang) => grades.map((g) => ({ value: g.value, label: String(g.value), title: g.text[lang] }));

function sidedBadge(v: SidedScore | null | undefined, max: number, incomplete: string) {
  return v ? <ScoreBadge>{`${v.total}/${max}`}</ScoreBadge> : <ScoreBadge muted>{incomplete}</ScoreBadge>;
}

export function RhinologyForm({
  initial,
  currentId,
  rows,
  saving,
  onSave,
}: {
  initial: AssessmentInput;
  currentId?: string;
  /** The doctor's assessments, to choose a baseline for the response evaluation. */
  rows: ScaleAssessmentRow[];
  saving: boolean;
  onSave: (input: AssessmentInput) => void;
}) {
  const { lang, t } = useLang();
  const [label, setLabel] = useState(initial.label ?? "");
  const [assessedOn, setAssessedOn] = useState(initial.assessedOn);
  const [scales, setScales] = useState<RhinologyScales>(initial.scales);
  const summary = useMemo(() => summarizeRhinology(scales), [scales]);
  const inc = t("form.incomplete");

  function include(id: RhinologyScaleId, on: boolean) {
    setScales((s) => {
      const next = { ...s };
      if (on) (next as Record<string, unknown>)[id] = (s as Record<string, unknown>)[id] ?? {};
      else delete next[id];
      return next;
    });
  }
  function patch<K extends RhinologyScaleId>(id: K, fn: (v: NonNullable<RhinologyScales[K]>) => NonNullable<RhinologyScales[K]>) {
    setScales((s) => ({ ...s, [id]: fn((s[id] ?? {}) as NonNullable<RhinologyScales[K]>) }));
  }

  function submit() {
    if (!RHINOLOGY_SCALES.some((k) => scales[k])) {
      alert(t("form.nothing"));
      return;
    }
    const missing = incompleteScales(scales);
    if (missing.length && !confirm(t("form.confirm_incomplete", missing.map((m) => t(`scale.${m}`)).join(", ")))) return;
    onSave({ assessedOn, label: sanitizeLabel(label), scales });
  }

  const usedRefs = [...new Set(RHINOLOGY_SCALES.filter((k) => scales[k]).flatMap((k) => SCALE_REFERENCES[k]))];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1">
            <Label htmlFor="label">{t("form.label")}</Label>
            <Input
              id="label"
              value={label}
              maxLength={60}
              onChange={(e) => setLabel(e.target.value.slice(0, 60))}
              placeholder={t("form.label.placeholder")}
            />
            <p className="text-[11px] text-muted-foreground">{t("form.label.hint")}</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="date">{t("form.date")}</Label>
            <Input id="date" type="date" value={assessedOn} onChange={(e) => e.target.value && setAssessedOn(e.target.value)} className="w-44" />
          </div>
        </CardContent>
      </Card>

      <ScaleSection
        title={t("scale.nps")}
        desc={t("scale.nps.desc")}
        included={!!scales.nps}
        onInclude={(v) => include("nps", v)}
        badge={sidedBadge(summary.nps, 8, inc)}
      >
        <NpsFields value={scales.nps ?? {}} onChange={(v) => patch("nps", () => v)} />
      </ScaleSection>

      <ScaleSection
        title={t("scale.lundKennedy")}
        desc={t("scale.lundKennedy.desc")}
        included={!!scales.lundKennedy}
        onInclude={(v) => include("lundKennedy", v)}
        badge={sidedBadge(summary.mlk, 12, inc)}
      >
        <SidedTable
          items={LK_ITEMS}
          names={LK_NAMES}
          grades={(k) => LK_GRADES[k]}
          value={scales.lundKennedy ?? {}}
          onChange={(v) => patch("lundKennedy", () => v as LkInput)}
          totals={[
            { label: t("scale.lk.modified"), score: summary.mlk, max: 12 },
            { label: t("scale.lk.original"), score: summary.lk, max: 20 },
          ]}
        />
      </ScaleSection>

      <ScaleSection
        title={t("scale.lundMackay")}
        desc={t("scale.lundMackay.desc")}
        included={!!scales.lundMackay}
        onInclude={(v) => include("lundMackay", v)}
        badge={sidedBadge(summary.lm, 24, inc)}
      >
        <SidedTable
          items={LM_ITEMS}
          names={LM_NAMES}
          grades={lmGrades}
          legend={[
            { name: lang === "es" ? "Senos" : "Sinuses", grades: LM_SINUS_GRADES },
            { name: LM_NAMES.omc[lang], grades: LM_OMC_GRADES },
          ]}
          value={scales.lundMackay ?? {}}
          onChange={(v) => patch("lundMackay", () => v as LmInput)}
          totals={[{ label: t("form.total"), score: summary.lm, max: 24 }]}
        />
      </ScaleSection>

      <ScaleSection
        title={t("scale.snot22")}
        desc={t("scale.snot22.desc")}
        included={!!scales.snot22}
        onInclude={(v) => include("snot22", v)}
        badge={summary.snot22 == null ? <ScoreBadge muted>{inc}</ScoreBadge> : <ScoreBadge>{`${summary.snot22}/110`}</ScoreBadge>}
      >
        <Snot22Fields label={label} value={scales.snot22 ?? {}} onChange={(v) => patch("snot22", () => v)} />
      </ScaleSection>

      <ScaleSection
        title={t("scale.control")}
        desc={t("scale.control.desc")}
        included={!!scales.control}
        onInclude={(v) => include("control", v)}
        badge={summary.control ? <ScoreBadge>{t(`control.level.${summary.control.level}`)}</ScoreBadge> : <ScoreBadge muted>{inc}</ScoreBadge>}
      >
        <ControlFields value={scales.control ?? {}} onChange={(v) => patch("control", () => v)} />
      </ScaleSection>

      <ScaleSection
        title={t("scale.biologic")}
        desc={t("scale.biologic.desc")}
        included={!!scales.biologic}
        onInclude={(v) => include("biologic", v)}
        badge={summary.biologic ? <ScoreBadge>{`${summary.biologic.met}/5`}</ScoreBadge> : <ScoreBadge muted>{inc}</ScoreBadge>}
      >
        <BiologicFields
          value={scales.biologic ?? {}}
          onChange={(v) => patch("biologic", () => v)}
          summary={summary}
          snotIncluded={!!scales.snot22}
        />
      </ScaleSection>

      <ScaleSection
        title={t("scale.response")}
        desc={t("scale.response.desc")}
        included={!!scales.response}
        onInclude={(v) => include("response", v)}
        badge={summary.response ? <ScoreBadge>{`${summary.response.met}/${summary.response.possible}`}</ScoreBadge> : <ScoreBadge muted>{inc}</ScoreBadge>}
      >
        <ResponseFields
          value={scales.response ?? {}}
          onChange={(v) => patch("response", () => v)}
          summary={summary}
          label={label}
          rows={rows}
          currentId={currentId}
        />
      </ScaleSection>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <p className="text-sm font-medium">{t("form.summary")}</p>
          <RhinologySummaryView summary={summary} compact />
          <Button onClick={submit} disabled={saving} className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            {saving ? t("form.saving") : t("form.save")}
          </Button>
        </CardContent>
      </Card>

      {usedRefs.length > 0 && (
        <div className="space-y-1 px-1 text-[11px] text-muted-foreground">
          <p className="font-medium">{t("form.references")}</p>
          {usedRefs.map((k) => {
            const r = RHINOLOGY_REFERENCES[k];
            return (
              <p key={k}>
                {r.citation}{" "}
                {r.doi ? (
                  <a className="underline" href={`https://doi.org/${r.doi}`} target="_blank" rel="noreferrer">
                    doi:{r.doi}
                  </a>
                ) : r.pmid ? (
                  <a className="underline" href={`https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`} target="_blank" rel="noreferrer">
                    PMID {r.pmid}
                  </a>
                ) : null}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

function NpsFields({ value, onChange }: { value: NpsInput; onChange: (v: NpsInput) => void }) {
  const { lang, t } = useLang();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SIDES.map((side) => (
        <div key={side} className="space-y-1.5">
          <p className="text-sm font-medium">{t(`form.${side}`)}</p>
          {NPS_GRADES.map((g) => {
            const active = value[side] === g.value;
            return (
              <button
                key={g.value}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ ...value, [side]: active ? null : g.value })}
                className={`flex w-full items-start gap-2 rounded-md border p-2 text-left text-xs transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
              >
                <span className="w-4 shrink-0 text-sm font-bold tabular-nums">{g.value}</span>
                <span>{g.text[lang]}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

type SidedValue = Partial<Record<Side, Partial<Record<string, number | null>>>>;

function SidedTable<K extends string>({
  items,
  names,
  grades,
  legend,
  value,
  onChange,
  totals,
}: {
  items: readonly K[];
  names: Record<K, { es: string; en: string }>;
  grades: (k: K) => Grade[];
  legend?: { name: string; grades: Grade[] }[];
  value: SidedValue;
  onChange: (v: SidedValue) => void;
  totals: { label: string; score: SidedScore | null | undefined; max: number }[];
}) {
  const { lang, t } = useLang();
  const set = (side: Side, k: K, g: number | null) => onChange({ ...value, [side]: { ...(value[side] ?? {}), [k]: g } });
  const legendRows = legend ?? items.map((k) => ({ name: names[k][lang], grades: grades(k) }));
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-1 pr-2 font-medium" />
              {SIDES.map((s) => (
                <th key={s} className="px-1 py-1 font-medium">
                  {t(`form.${s}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((k) => (
              <tr key={k} className="border-t">
                <td className="py-2 pr-2">{names[k][lang]}</td>
                {SIDES.map((s) => (
                  <td key={s} className="px-1 py-2">
                    <Segmented
                      ariaLabel={`${names[k][lang]} · ${t(`form.${s}`)}`}
                      options={gradeOptions(grades(k), lang)}
                      value={value[s]?.[k] ?? null}
                      onChange={(g) => set(s, k, g)}
                    />
                  </td>
                ))}
              </tr>
            ))}
            {totals.map((x) => (
              <tr key={x.label} className="border-t font-medium">
                <td className="py-2 pr-2 text-xs">{x.label}</td>
                {SIDES.map((s) => (
                  <td key={s} className="px-1 py-2 tabular-nums">
                    {x.score ? x.score[s] : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs tabular-nums">
        {totals.map((x) => `${x.label}: ${x.score ? `${x.score.total}/${x.max}` : t("form.incomplete")}`).join(" · ")}
      </p>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">{t("form.legend")}</summary>
        <ul className="mt-1 space-y-0.5">
          {legendRows.map((r) => (
            <li key={r.name}>
              <span className="font-medium text-foreground">{r.name}:</span> {r.grades.map((g) => `${g.value} ${g.text[lang]}`).join(" · ")}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function Snot22Fields({ label, value, onChange }: { label: string; value: Snot22Input; onChange: (v: Snot22Input) => void }) {
  const { lang, t } = useLang();
  const clean = sanitizeLabel(label);
  const { data: responses, isFetching } = useQuery({
    queryKey: ["scales-snot22", clean],
    queryFn: () => listSnot22ByLabel(clean),
    enabled: !!clean,
  });
  const latest = responses?.[0];
  return (
    <div className="space-y-3">
      <FieldRow
        label={t("snot.value")}
        hint={value.date ? t("snot.taken", fmtDate(value.date, lang)) : undefined}
      >
        <NumberInput ariaLabel={t("snot.value")} value={value.value} max={110} onChange={(v) => onChange({ value: v, date: null })} />
      </FieldRow>
      <div className="rounded-md bg-muted/60 p-3 text-xs">
        {!clean ? (
          <p className="text-muted-foreground">{t("snot.no_label")}</p>
        ) : isFetching && !responses ? (
          <p className="text-muted-foreground">{t("list.loading")}</p>
        ) : latest ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>
              {t("snot.from_quest")}: <strong className="tabular-nums">{latest.total_score}</strong> ({fmtDate(latest.created_at, lang)})
              {responses && responses.length > 1 && (
                <span className="text-muted-foreground">
                  {" · "}
                  {responses
                    .slice(1, 4)
                    .map((r) => `${r.total_score} (${fmtDate(r.created_at, lang)})`)
                    .join(" · ")}
                </span>
              )}
            </p>
            <Button size="sm" variant="outline" onClick={() => onChange({ value: latest.total_score, date: latest.created_at })}>
              <Download className="mr-1 h-3.5 w-3.5" />
              {t("snot.use")}
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground">{t("snot.none")}</p>
        )}
      </div>
    </div>
  );
}

function ControlFields({ value, onChange }: { value: ControlInput; onChange: (v: ControlInput) => void }) {
  const { lang, t } = useLang();
  return (
    <div>
      {CONTROL_ITEMS.map((k) => (
        <FieldRow key={k} label={CONTROL_TEXT[k][lang]}>
          <YesNo ariaLabel={CONTROL_TEXT[k][lang]} value={value[k]} onChange={(v) => onChange({ ...value, [k]: v })} />
        </FieldRow>
      ))}
      <p className="mt-2 text-[11px] text-muted-foreground">{t("scale.control.vas")}</p>
    </div>
  );
}

function CriterionMark({ ok }: { ok: boolean }) {
  return ok ? <Check className="h-4 w-4 shrink-0 text-emerald-600" /> : <Minus className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

function BiologicFields({
  value,
  onChange,
  summary,
  snotIncluded,
}: {
  value: BiologicInput;
  onChange: (v: BiologicInput) => void;
  summary: RhinologySummary;
  snotIncluded: boolean;
}) {
  const { lang, t } = useLang();
  const set = (p: Partial<BiologicInput>) => onChange({ ...value, ...p });
  const b = summary.biologic;
  return (
    <div className="space-y-4">
      <div>
        <FieldRow label={t("bio.bilateral")}>
          <YesNo ariaLabel={t("bio.bilateral")} value={value.bilateralPolyps} onChange={(v) => set({ bilateralPolyps: v })} />
        </FieldRow>
        <FieldRow label={t("bio.surgery")}>
          <YesNo ariaLabel={t("bio.surgery")} value={value.priorSurgery} onChange={(v) => set({ priorSurgery: v })} />
        </FieldRow>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">1. {t("bio.type2")}</p>
        <FieldRow label={t("bio.tissueEos")} hint="≥10">
          <NumberInput ariaLabel={t("bio.tissueEos")} value={value.tissueEos} onChange={(v) => set({ tissueEos: v })} />
        </FieldRow>
        <FieldRow label={t("bio.bloodEos")} hint="≥150">
          <NumberInput ariaLabel={t("bio.bloodEos")} value={value.bloodEos} step={10} onChange={(v) => set({ bloodEos: v })} />
        </FieldRow>
        <FieldRow label={t("bio.ige")} hint="≥100">
          <NumberInput ariaLabel={t("bio.ige")} value={value.totalIge} step={1} onChange={(v) => set({ totalIge: v })} />
        </FieldRow>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">2. {t("bio.steroids")}</p>
        <FieldRow label={t("bio.courses")} hint="≥2">
          <NumberInput ariaLabel={t("bio.courses")} value={value.steroidCourses} max={52} onChange={(v) => set({ steroidCourses: v })} />
        </FieldRow>
        <FieldRow label={t("bio.longterm")}>
          <YesNo ariaLabel={t("bio.longterm")} value={value.steroidLongTerm} onChange={(v) => set({ steroidLongTerm: v })} />
        </FieldRow>
        <FieldRow label={t("bio.contraindicated")}>
          <YesNo ariaLabel={t("bio.contraindicated")} value={value.steroidContraindicated} onChange={(v) => set({ steroidContraindicated: v })} />
        </FieldRow>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">3. {t("bio.snot")}</p>
        <p className="text-xs text-muted-foreground">
          {snotIncluded ? (summary.snot22 != null ? `SNOT-22 = ${summary.snot22} (≥40)` : t("form.incomplete")) : t("bio.snot.missing")}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">4. {t("bio.smell")}</p>
        <FieldRow label={t("bio.anosmia")}>
          <YesNo ariaLabel={t("bio.anosmia")} value={value.anosmia} onChange={(v) => set({ anosmia: v })} />
        </FieldRow>
        <FieldRow label={t("bio.smellTest")}>
          <div className="flex items-center gap-2">
            <select
              aria-label={t("bio.smellTest")}
              value={value.smellTest ?? ""}
              onChange={(e) => set({ smellTest: (e.target.value || null) as BiologicInput["smellTest"] })}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="">{t("bio.smellTest.none")}</option>
              {SMELL_TESTS.map((s) => (
                <option key={s} value={s}>
                  {t(`bio.smellTest.${s}`)}
                </option>
              ))}
            </select>
            <NumberInput ariaLabel={t("bio.smellScore")} value={value.smellScore} step={0.25} max={100} onChange={(v) => set({ smellScore: v })} className="w-20" />
          </div>
        </FieldRow>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">5. {t("bio.asthma")}</p>
        <FieldRow label={t("bio.asthma")}>
          <YesNo ariaLabel={t("bio.asthma")} value={value.asthma} onChange={(v) => set({ asthma: v })} />
        </FieldRow>
      </div>

      <div className="rounded-md border p-3">
        {b ? (
          <>
            <ul className="space-y-1 text-xs">
              {BIOLOGIC_CRITERIA.map((k) => (
                <li key={k} className="flex items-start gap-2">
                  <CriterionMark ok={b.criteria[k]} />
                  <span>{BIOLOGIC_TEXT[k][lang]}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-semibold">
              {t("bio.result", b.met, b.required)} — {b.meets ? t("bio.meets") : t("bio.not_meets")}
            </p>
            {value.bilateralPolyps === false && <p className="text-xs text-muted-foreground">{t("bio.no_bilateral")}</p>}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("form.incomplete")}: {t("bio.bilateral")} · {t("bio.surgery")}
          </p>
        )}
      </div>
    </div>
  );
}

function ResponseFields({
  value,
  onChange,
  summary,
  label,
  rows,
  currentId,
}: {
  value: ResponseInput;
  onChange: (v: ResponseInput) => void;
  summary: RhinologySummary;
  label: string;
  rows: ScaleAssessmentRow[];
  currentId?: string;
}) {
  const { lang, t } = useLang();
  const set = (p: Partial<ResponseInput>) => onChange({ ...value, ...p });
  const clean = sanitizeLabel(label);
  const candidates = clean
    ? rows.filter((r): r is RowOf<"rhinology"> => r.pack === "rhinology" && r.label === clean && r.id !== currentId)
    : [];
  const baseline = candidates.find((r) => r.id === value.baselineId) ?? null;
  const r = summary.response;

  const delta = (name: string, now: number | null | undefined, before: number | null | undefined, note?: string) => (
    <li>
      <span className="font-medium">{name}:</span>{" "}
      {now != null && before != null ? (
        <span className="tabular-nums">
          {before} → {now} ({now - before > 0 ? "+" : ""}
          {now - before})
        </span>
      ) : (
        <span className="text-muted-foreground">{t("resp.delta.na")}</span>
      )}
      {note && <span className="text-muted-foreground"> · {note}</span>}
    </li>
  );

  return (
    <div className="space-y-4">
      <div>
        <FieldRow label={t("resp.timepoint")}>
          <Segmented
            ariaLabel={t("resp.timepoint")}
            options={TIMEPOINTS.map((x) => ({ value: x, label: t(`resp.timepoint.${x}`) }))}
            value={value.timepoint}
            onChange={(v) => set({ timepoint: v })}
          />
        </FieldRow>
        <FieldRow label={t("resp.biologic")}>
          <Segmented
            ariaLabel={t("resp.biologic")}
            options={BIOLOGICS.map((x) => ({ value: x, label: t(`resp.biologic.${x}`) }))}
            value={value.biologic}
            onChange={(v) => set({ biologic: v })}
          />
        </FieldRow>
        <FieldRow
          label={t("resp.baseline")}
          hint={!clean ? t("resp.baseline.need_label") : candidates.length === 0 ? t("resp.baseline.empty") : undefined}
        >
          <select
            aria-label={t("resp.baseline")}
            value={value.baselineId ?? ""}
            disabled={candidates.length === 0}
            onChange={(e) => set({ baselineId: e.target.value || null })}
            className="h-9 max-w-[16rem] rounded-md border bg-background px-2 text-sm"
          >
            <option value="">{t("resp.baseline.none")}</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {fmtDate(c.assessed_on, lang)}
                {c.summary.nps ? ` · NPS ${c.summary.nps.total}` : ""}
                {c.summary.snot22 != null ? ` · SNOT-22 ${c.summary.snot22}` : ""}
              </option>
            ))}
          </select>
        </FieldRow>
      </div>

      {baseline && (
        <div className="rounded-md bg-muted/60 p-3 text-xs">
          <p className="mb-1 font-medium">{t("resp.delta")}</p>
          <ul className="space-y-0.5">
            {delta("NPS", summary.nps?.total, baseline.summary.nps?.total)}
            {delta(t("scale.lk.modified"), summary.mlk?.total, baseline.summary.mlk?.total)}
            {delta("SNOT-22", summary.snot22, baseline.summary.snot22, t("snot.mcid"))}
          </ul>
        </div>
      )}

      <div>
        {RESPONSE_CRITERIA.filter((k) => k !== "comorbidities").map((k) => (
          <FieldRow key={k} label={RESPONSE_TEXT[k][lang]}>
            <YesNo ariaLabel={RESPONSE_TEXT[k][lang]} value={value[k as "polyps"]} onChange={(v) => set({ [k]: v })} />
          </FieldRow>
        ))}
        <FieldRow label={RESPONSE_TEXT.comorbidities[lang]}>
          <Segmented
            ariaLabel={RESPONSE_TEXT.comorbidities[lang]}
            options={(["improved", "not_improved", "none"] as const).map((x) => ({ value: x, label: t(`resp.comorb.${x}`) }))}
            value={value.comorbidities}
            onChange={(v) => set({ comorbidities: v })}
          />
        </FieldRow>
      </div>

      <div className="rounded-md border p-3 text-sm font-semibold">
        {r ? `${t("resp.result", r.met, r.possible)} — ${t(`resp.level.${r.level}`)}` : <span className="text-xs font-normal text-muted-foreground">{t("form.incomplete")}</span>}
      </div>
    </div>
  );
}
