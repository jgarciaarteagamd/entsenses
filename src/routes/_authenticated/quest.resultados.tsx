import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, Copy, ClipboardCheck } from "lucide-react";
import { useLang } from "@/modules/quest/i18n";
import { translateInterpretation } from "@/modules/quest/lib/questionnaire-i18n";

export const Route = createFileRoute("/_authenticated/quest/resultados")({
  component: ResultsPage,
});

type Band = { min: number; max: number; category: string; description: string; color: string };

const interpretations: Record<string, Band[]> = {
  "eat-10": [
    { min: 0, max: 2, category: "Normal", description: "Sin riesgo de disfagia. No se requiere evaluación adicional.", color: "#22c55e" },
    { min: 3, max: 40, category: "Riesgo", description: "Riesgo de disfagia. Se recomienda valoración por especialista.", color: "#ef4444" },
  ],
  "snot-22": [
    { min: 0, max: 10, category: "Muy leve", description: "Impacto mínimo en la calidad de vida.", color: "#22c55e" },
    { min: 11, max: 20, category: "Leve", description: "Impacto leve. Tratamiento médico habitualmente suficiente.", color: "#84cc16" },
    { min: 21, max: 50, category: "Moderado", description: "Impacto moderado. Considerar tratamiento combinado.", color: "#eab308" },
    { min: 51, max: 110, category: "Severo", description: "Impacto severo. Valorar intervención quirúrgica.", color: "#ef4444" },
  ],
  "thi-25": [
    { min: 0, max: 16, category: "Leve", description: "Handicap leve por acúfenos. Manejo conservador adecuado.", color: "#22c55e" },
    { min: 17, max: 36, category: "Leve-moderado", description: "Handicap leve a moderado. Terapia de reentrenamiento auditivo recomendada.", color: "#84cc16" },
    { min: 37, max: 56, category: "Moderado", description: "Handicap moderado. Tratamiento multimodal recomendado.", color: "#eab308" },
    { min: 57, max: 76, category: "Moderado-severo", description: "Handicap moderado-severo. Intervención especializada intensiva.", color: "#f97316" },
    { min: 77, max: 100, category: "Severo", description: "Handicap severo por acúfenos. Manejo multidisciplinario urgente.", color: "#ef4444" },
  ],
  "dhi-25": [
    { min: 0, max: 30, category: "Leve", description: "Handicap leve por vértigo. Rehabilitación vestibular ambulatoria.", color: "#22c55e" },
    { min: 31, max: 60, category: "Moderado", description: "Handicap moderado. Rehabilitación vestibular estructurada recomendada.", color: "#eab308" },
    { min: 61, max: 100, category: "Severo", description: "Handicap severo. Valoración multidisciplinaria y tratamiento intensivo.", color: "#ef4444" },
  ],
  "etdq-7": [
    { min: 0, max: 11, category: "Leve", description: "Disfunción tubárica leve. Seguimiento ambulatorio.", color: "#22c55e" },
    { min: 12, max: 24, category: "Moderada", description: "Disfunción tubárica moderada. Considerar tratamiento conservador.", color: "#eab308" },
    { min: 25, max: 49, category: "Severa", description: "Disfunción tubárica severa. Valorar tratamiento quirúrgico.", color: "#ef4444" },
  ],
  "vhi-30": [
    { min: 0, max: 30, category: "Leve", description: "Discapacidad vocal leve. Higiene vocal y seguimiento.", color: "#22c55e" },
    { min: 31, max: 60, category: "Moderada", description: "Discapacidad vocal moderada. Terapia fonoaudiológica indicada.", color: "#eab308" },
    { min: 61, max: 120, category: "Severa", description: "Discapacidad vocal severa. Evaluación laringológica completa.", color: "#ef4444" },
  ],
};

const sources: Record<string, string> = {
  "eat-10": "Belafsky PC et al. Ann Otol Rhinol Laryngol. 2008;117(12):919-924.",
  "snot-22": "Hopkins C et al. Clin Otolaryngol. 2009;34(5):447-454.",
  "thi-25": "Newman CW et al. Arch Otolaryngol Head Neck Surg. 1996;122(2):143-148.",
  "dhi-25": "Jacobson GP, Newman CW. Arch Otolaryngol Head Neck Surg. 1990;116(4):424-427.",
  "etdq-7": "McCoul ED et al. Laryngoscope. 2012;122(5):1137-1141.",
  "vhi-30": "Jacobson BH et al. Am J Speech Lang Pathol. 1997;6(3):66-70.",
};

export function ReferenceTable({ slug, lang, t }: { slug: string; lang: "es" | "en"; t: (k: string) => string }) {
  const bands = interpretations[slug] ?? [];
  if (bands.length === 0) return null;
  const source = sources[slug];
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-medium text-muted-foreground">{t("results.reference")}</p>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-muted-foreground">
            <th className="py-1 pr-3 font-medium">{t("results.range")}</th>
            <th className="py-1 font-medium">{t("results.interpretation")}</th>
          </tr>
        </thead>
        <tbody>
          {bands.map((b, i) => {
            const tr = translateInterpretation(slug, lang, b.category, b.description);
            return (
              <tr key={i} className="border-t align-top">
                <td className="py-2 pr-3 font-mono text-xs">
                  {b.min}{b.max !== b.min ? `–${b.max}` : ""}
                </td>
                <td className="py-2">
                  <div className="font-medium">{tr.category ?? b.category}</div>
                  <div className="text-xs text-muted-foreground">{tr.description ?? b.description}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted-foreground">{t("results.disclaimer")}</p>
      {source && (
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="font-medium">{t("results.source")}:</span> {source}
        </p>
      )}
    </div>
  );
}

function ResultsPage() {
  const { lang, t } = useLang();
  const search = Route.useSearch() as { slug?: string; answers?: string };
  const slug = search.slug ?? "";
  const answers: number[] = useMemo(() => {
    try {
      return JSON.parse(search.answers ?? "[]") as number[];
    } catch {
      return [];
    }
  }, [search.answers]);

  const totalScore = answers.reduce((sum, v) => sum + (typeof v === "number" ? v : 0), 0);

  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${slug.toUpperCase()}: ${totalScore} ${t("inbox.points")}.`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error("[results copy] error", e);
    }
  }


  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t("results.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted p-6">
              <p className="text-sm text-muted-foreground">{t("results.total")}</p>
              <p className="text-4xl font-bold">{totalScore}</p>
            </div>

            <ReferenceTable slug={slug} lang={lang} t={t} />

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">{t("results.answers")}</p>
              <div className="mt-2 grid grid-cols-5 gap-2 text-center text-sm">
                {answers.map((a, i) => (
                  <div key={i} className="rounded bg-muted p-1">
                    {i + 1}: <span className="font-semibold">{a}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link to="/quest/$slug" params={{ slug }}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("results.repeat")}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/quest">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  {t("results.catalog")}
                </Link>
              </Button>
              <Button
                variant={copied ? "default" : "outline"}
                onClick={handleCopy}
              >
                {copied ? (
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copied ? t("results.copied") : t("results.copy")}
              </Button>

            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
