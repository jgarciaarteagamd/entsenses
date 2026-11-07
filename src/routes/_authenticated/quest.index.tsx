import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getQuestionnaires } from "@/modules/quest/lib/questionnaire.functions";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, Search } from "lucide-react";
import { useLang } from "@/modules/quest/i18n";
import { getLocalisedQuestionnaire } from "@/modules/quest/lib/questionnaire-i18n";
import { QuestionnaireInfoDialog } from "@/modules/quest/components/QuestionnaireInfoDialog";
import { getVariantsForSlug, GENERIC_VARIANT_ID } from "@/modules/quest/lib/questionnaire-variants";
import { QUESTIONNAIRE_STUDIES } from "@/modules/quest/lib/questionnaire-studies";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Route = createFileRoute("/_authenticated/quest/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["questionnaires"],
      queryFn: () => getQuestionnaires({}),
    });
  },
  component: QuestionnairesIndexPage,
});

function QuestionnairesIndexPage() {
  const { lang, t } = useLang();
  const { data: questionnaires } = useSuspenseQuery({
    queryKey: ["questionnaires"],
    queryFn: () => getQuestionnaires({}),
  });

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-muted/30">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-violet-600">ENT Senses Quest</p>
              <h1 className="text-2xl font-bold">{t("catalog.title")}</h1>
              <p className="text-muted-foreground">{t("catalog.subtitle")}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/quest/buscar">
                <Search className="mr-2 h-4 w-4" />
                {t("dashboard.title")}
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {questionnaires?.map((q: any) => {
              const loc = getLocalisedQuestionnaire(q.slug, lang, q.name, q.description, []);
              const variants = getVariantsForSlug(q.slug);
              return (
                <Card key={q.id} className="relative flex h-full flex-col">
                  <div className="absolute right-2 top-2 z-10">
                    <QuestionnaireInfoDialog slug={q.slug} questionnaireName={loc.name} />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="pr-10 text-base">{loc.name}</CardTitle>
                    <div className="flex flex-wrap gap-1">
                      {q.specialties?.name && (
                        <Badge variant="outline" className="text-xs">{q.specialties.name}</Badge>
                      )}
                      {q.subspecialties?.name && (
                        <Badge variant="secondary" className="text-xs">{q.subspecialties.name}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">{loc.description}</p>

                    {lang === "en" ? (
                      (() => {
                        const origLang = QUESTIONNAIRE_STUDIES[q.slug]?.originalLanguage ?? "en";
                        const label = origLang === "en" ? t("catalog.en.original") : t("catalog.en.validated");
                        return (
                          <Button asChild size="sm" className="w-full">
                            <Link to="/quest/$slug" params={{ slug: q.slug }}>
                              {label}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        );
                      })()
                    ) : (() => {
                      const generic = variants.find((v) => v.id === GENERIC_VARIANT_ID);
                      const others = variants.filter((v) => v.id !== GENERIC_VARIANT_ID);
                      return (
                        <div className="space-y-3">
                          {generic && (
                            <Button asChild size="sm" className="w-full">
                              <Link
                                to="/quest/$slug"
                                params={{ slug: q.slug }}
                                search={{ v: generic.id }}
                              >
                                {generic.labelEs}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          {others.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                {t("catalog.variant.title")}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {others.map((v) => {
                                  if (v.pending) {
                                    const btn = (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 cursor-not-allowed border-dashed opacity-70 hover:bg-transparent"
                                        asChild={!!v.studyUrl}
                                        disabled={!v.studyUrl}
                                      >
                                        {v.studyUrl ? (
                                          <a href={v.studyUrl} target="_blank" rel="noopener noreferrer">
                                            {v.labelEs}
                                            <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                                              ({t("catalog.variant.pending")})
                                            </span>
                                          </a>
                                        ) : (
                                          <>
                                            {v.labelEs}
                                            <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                                              ({t("catalog.variant.pending")})
                                            </span>
                                          </>
                                        )}
                                      </Button>
                                    );
                                    return (
                                      <Tooltip key={v.id}>
                                        <TooltipTrigger asChild>
                                          <span>{btn}</span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs text-xs">
                                          {t("catalog.variant.pending_hint")}
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  }
                                  return (
                                    <Button key={v.id} asChild size="sm" variant="default" className="h-8">
                                      <Link
                                        to="/quest/$slug"
                                        params={{ slug: q.slug }}
                                        search={{ v: v.id }}
                                      >
                                        {v.labelEs}
                                      </Link>
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
