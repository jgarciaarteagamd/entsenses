import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getQuestionnaireBySlug } from "@/modules/quest/lib/questionnaire.functions";
import { submitDoctorResponse } from "@/modules/quest/lib/patient-responses.functions";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";

import { ChevronLeft, ChevronRight, CheckCircle2, Printer } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLang } from "@/modules/quest/i18n";
import { getLocalisedQuestionnaire } from "@/modules/quest/lib/questionnaire-i18n";
import { normaliseVariantId, resolveVariant, GENERIC_VARIANT_ID } from "@/modules/quest/lib/questionnaire-variants";
import { SendToPatientDialog } from "@/modules/quest/components/SendToPatientDialog";

export const Route = createFileRoute("/_authenticated/quest/$slug/")({
  validateSearch: (search: Record<string, unknown>): { v?: string } => ({
    v: normaliseVariantId(typeof search.v === "string" ? search.v : undefined),
  }),
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["questionnaire", params.slug],
      queryFn: () => getQuestionnaireBySlug({ data: params.slug }),
    });
  },
  component: QuestionnaireFormPage,
});

function QuestionnaireFormPage() {
  const { slug } = Route.useParams();
  const { v: variantId } = Route.useSearch();
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const { data: questionnaire } = useSuspenseQuery({
    queryKey: ["questionnaire", slug],
    queryFn: () => getQuestionnaireBySlug({ data: slug }),
  });

  const structure = questionnaire?.structure as any;
  const rawItems: any[] = structure?.items ?? [];
  const loc = getLocalisedQuestionnaire(slug, lang, questionnaire.name, questionnaire.description, rawItems, variantId);
  const items = loc.items;
  const activeVariant = resolveVariant(slug, variantId);


  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentStep, setCurrentStep] = useState(0);
  
  const [saving, setSaving] = useState(false);

  const submitFn = submitDoctorResponse;

  const totalSteps = items.length;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  function handleAnswer(value: number) {
    setAnswers((prev) => ({ ...prev, [currentStep]: value }));
  }

  async function handleFinish() {
    const answerArray = items.map((_, i) => answers[i] ?? 0);
    setSaving(true);
    try {
      // Save to inbox as a doctor-authored response
      await submitFn({ data: { slug, answers: answerArray } }).catch((e) => {
        console.error("[doctor submit] error", e);
      });
    } finally {
      setSaving(false);
    }
    const searchParams = new URLSearchParams();
    searchParams.set("slug", slug);
    searchParams.set("answers", JSON.stringify(answerArray));
    navigate({ to: "/quest/resultados", search: Object.fromEntries(searchParams) });
  }

  const currentItem = items[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const canProceed = answers[currentStep] !== undefined;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-12 text-center">
          <p className="text-muted-foreground">{t("form.no_questions")}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold">{loc.name}</h1>
              <p className="text-sm text-muted-foreground">
                {t("form.question_of", currentStep + 1, totalSteps)}
              </p>
              {lang === "es" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeVariant.id === GENERIC_VARIANT_ID ? (
                    <span className="font-medium text-primary">{activeVariant.labelEs}</span>
                  ) : (
                    <>
                      {t("catalog.variant.title")}{" "}
                      <span className={activeVariant.validated ? "font-medium text-primary" : "font-medium text-amber-700"}>
                        {activeVariant.labelEs}
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <SendToPatientDialog slug={slug} variant={variantId ?? null} questionnaireName={loc.name} />
            <Button variant="outline" size="sm" asChild>
              <Link
                to="/quest/$slug/imprimir"
                params={{ slug }}
                search={variantId ? { v: variantId } : {}}
              >
                <Printer className="mr-2 h-4 w-4" />
                {t("form.print")}
              </Link>
            </Button>
            </div>

          </div>
          <Progress value={progress} className="mt-3" />
        </div>

        <Card>
          <CardContent className="pt-6">
            <p className="mb-6 text-lg font-medium">{currentItem.text}</p>
            <RadioGroup
              key={currentStep}
              value={answers[currentStep]?.toString() ?? ""}
              onValueChange={(v) => handleAnswer(Number(v))}
              className="space-y-3"
            >
              {currentItem.options.map((opt) => (
                <div key={opt.value} className="flex items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                  <RadioGroupItem value={opt.value.toString()} id={`opt-${opt.value}`} />
                  <Label htmlFor={`opt-${opt.value}`} className="flex-1 cursor-pointer">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>


        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep((s) => Math.max(0, s - 1))} disabled={currentStep === 0}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("form.previous")}
          </Button>

          {isLastStep ? (
            <Button onClick={handleFinish} disabled={!canProceed || saving}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {saving ? t("form.saving") : t("form.see_result")}
            </Button>
          ) : (
            <Button onClick={() => setCurrentStep((s) => s + 1)} disabled={!canProceed}>
              {t("form.next")}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
