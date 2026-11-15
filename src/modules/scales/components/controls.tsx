// Small form controls shared by the Scales packs.
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLang } from "@/modules/scales/i18n";

export interface Option<V> {
  value: V;
  label: string;
  title?: string;
}

/** Row of toggle buttons. Clicking the selected option again clears it. */
export function Segmented<V extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: Option<V>[];
  value: V | null | undefined;
  onChange: (v: V | null) => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("inline-flex flex-wrap gap-1", className)}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(active ? null : o.value)}
            className={cn(
              "min-w-9 rounded-md border px-2.5 py-1 text-sm font-medium tabular-nums transition-colors",
              active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function YesNo({
  value,
  onChange,
  ariaLabel,
}: {
  value: boolean | null | undefined;
  onChange: (v: boolean | null) => void;
  ariaLabel?: string;
}) {
  const { t } = useLang();
  return (
    <Segmented<"yes" | "no">
      ariaLabel={ariaLabel}
      options={[
        { value: "yes", label: t("form.yes") },
        { value: "no", label: t("form.no") },
      ]}
      value={value === true ? "yes" : value === false ? "no" : null}
      onChange={(v) => onChange(v === null ? null : v === "yes")}
    />
  );
}

/** A labelled row: question on the left, control on the right (stacked on phones). */
export function FieldRow({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-b py-2.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0 text-sm">
        <div>{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  ariaLabel,
  className,
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      aria-label={ariaLabel}
      min={min}
      max={max}
      step={step}
      value={value ?? ""}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") return onChange(null);
        const n = Number(raw);
        if (!Number.isFinite(n)) return;
        onChange(Math.max(min, max !== undefined ? Math.min(max, n) : n));
      }}
      className={cn(
        "h-9 w-24 rounded-md border bg-background px-2 text-right text-sm tabular-nums shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className,
      )}
    />
  );
}

/** A scale section with its "Include" switch, title, description and score badge. */
export function ScaleSection({
  title,
  desc,
  included,
  onInclude,
  badge,
  children,
}: {
  title: string;
  desc: string;
  included: boolean;
  onInclude: (v: boolean) => void;
  badge?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useLang();
  const id = `inc-${title.replace(/\W+/g, "-")}`;
  return (
    <Card className={included ? "" : "bg-muted/40"}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Checkbox id={id} checked={included} onCheckedChange={(v) => onInclude(v === true)} className="mt-1" aria-label={t("form.include")} />
          <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
            <span className="block font-semibold leading-tight">{title}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{desc}</span>
          </label>
          {included && badge}
        </div>
        {included && <div className="mt-4">{children}</div>}
      </CardContent>
    </Card>
  );
}

export function ScoreBadge({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <Badge variant={muted ? "outline" : "default"} className="shrink-0 whitespace-nowrap tabular-nums">
      {children}
    </Badge>
  );
}

/** Vertical list of grades with their full definition; clicking the selected one clears it. */
export function GradeList({
  grades,
  value,
  onChange,
  disabled,
}: {
  grades: { value: number; text: { es: string; en: string } }[];
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  disabled?: boolean;
}) {
  const { lang } = useLang();
  return (
    <div className="space-y-1.5">
      {grades.map((g) => {
        const active = value === g.value;
        return (
          <button
            key={g.value}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(active ? null : g.value)}
            className={cn(
              "flex w-full items-start gap-2 rounded-md border p-2 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
            )}
          >
            <span className="w-5 shrink-0 text-sm font-bold tabular-nums">{g.value}</span>
            <span>{g.text[lang]}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Citations with DOI / PubMed links. */
export function ReferenceList({ refs }: { refs: { citation: string; doi?: string; pmid?: string }[] }) {
  const { t } = useLang();
  if (!refs.length) return null;
  return (
    <div className="space-y-1 px-1 text-[11px] text-muted-foreground">
      <p className="font-medium">{t("form.references")}</p>
      {refs.map((r) => (
        <p key={r.citation}>
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
      ))}
    </div>
  );
}
