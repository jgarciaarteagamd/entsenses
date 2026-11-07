// The questionnaire a patient answers on their own device (consent → questions → submit).
// Shared by the QR link (/p/$doctorId/$slug) and the invitation link (/i/$token).
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getQuestionnaireBySlug } from "@/modules/quest/lib/questionnaire.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { useLang } from "@/modules/quest/i18n";
import { getLocalisedQuestionnaire } from "@/modules/quest/lib/questionnaire-i18n";
import { PatientConsentGate } from "@/modules/quest/components/PatientConsentGate";

export function PatientQuestionnaireFlow({
  slug,
  variantId,
  onSubmit,
  errorMessage,
}: {
  slug: string;
  variantId?: string;
  /** Sends the answers; throws on failure. */
  onSubmit: (answers: number[]) => Promise<void>;
  /** Optional mapping from a submission error to the message shown to the patient. */
  errorMessage?: (e: unknown) => string | null;
}) {
  const { lang, setLang, t } = useLang();
  const { data: questionnaire } = useSuspenseQuery({
    queryKey: ["questionnaire", slug],
    queryFn: () => getQuestionnaireBySlug({ data: slug }),
  });

  const structure = questionnaire?.structure as any;
  const rawItems: any[] = structure?.items ?? [];
  const loc = getLocalisedQuestionnaire(slug, lang, questionnaire.name, questionnaire.description, rawItems, variantId);
  const items = loc.items;


  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const totalSteps = items.length;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const currentItem = items[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const canProceed = answers[currentStep] !== undefined;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const answerArray = items.map((_, i) => answers[i] ?? 0);
      await onSubmit(answerArray);
      setSubmitted(true);
    } catch (e: unknown) {
      console.error("[patient submit] error", e);
      setError(errorMessage?.(e) ?? t("patient.error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <p className="text-muted-foreground">{t("patient.no_questions")}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md text-center">
          <CardContent className="space-y-3 pt-8 pb-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h1 className="text-xl font-semibold">{t("patient.done.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("patient.done.body")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const languageToggle = (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setLang(lang === "es" ? "en" : "es")}
      className="px-2 text-xs font-semibold uppercase tracking-wide"
    >
      {lang}
    </Button>
  );

  if (!consentAccepted) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="border-b bg-background">
          <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <span>{t("patient.header")}</span>
            </div>
            {languageToggle}
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-8">
          <h1 className="mb-6 text-xl font-bold">{loc.name}</h1>
          <PatientConsentGate onAccept={() => setConsentAccepted(true)} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <span>{t("patient.header")}</span>
          </div>
          {languageToggle}
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold">{loc.name}</h1>
          <p className="text-sm text-muted-foreground">
            {t("form.question_of", currentStep + 1, totalSteps)}
          </p>
          <Progress value={progress} className="mt-3" />
        </div>

        <Card>
          <CardContent className="pt-6">
            <p className="mb-6 text-lg font-medium">{currentItem.text}</p>
            <RadioGroup
              key={currentStep}
              value={answers[currentStep]?.toString() ?? ""}
              onValueChange={(v) => setAnswers((p) => ({ ...p, [currentStep]: Number(v) }))}
              className="space-y-3"
            >
              {currentItem.options.map((opt) => (
                <div
                  key={opt.value}
                  className="flex items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <RadioGroupItem value={opt.value.toString()} id={`opt-${opt.value}`} />
                  <Label htmlFor={`opt-${opt.value}`} className="flex-1 cursor-pointer">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {error && (
          <p className="mt-4 rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep((s) => Math.max(0, s - 1))} disabled={currentStep === 0}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("form.previous")}
          </Button>

          {isLastStep ? (
            <Button onClick={handleSubmit} disabled={!canProceed || submitting}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {submitting ? t("patient.submitting") : t("patient.submit")}
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
