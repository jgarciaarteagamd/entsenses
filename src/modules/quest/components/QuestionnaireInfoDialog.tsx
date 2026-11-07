import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, BadgeCheck, ChevronLeft } from "lucide-react";
import { useLang } from "@/modules/quest/i18n";
import {
  QUESTIONNAIRE_STUDIES,
  pickText,
  type ValidationStudy,
} from "@/modules/quest/lib/questionnaire-studies";

interface Props {
  slug: string;
  questionnaireName: string;
}

/**
 * Info button + dialog with the full bibliographic metadata of a
 * questionnaire (original study + Spanish-language validations, if any).
 * The dialog is presentational bibliographic content only — no clinical
 * interpretation or diagnostic output.
 */
export function QuestionnaireInfoDialog({ slug, questionnaireName }: Props) {
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ValidationStudy | null>(null);
  const study = QUESTIONNAIRE_STUDIES[slug];

  if (!study) return null;

  const section = (label: string, body: string) =>
    body ? (
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-foreground">{body}</p>
      </section>
    ) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setDetail(null);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={t("info.aria")}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        {detail ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 h-8 px-2"
                  onClick={() => setDetail(null)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {t("info.back")}
                </Button>
              </div>
              <DialogTitle className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-primary" />
                {t("info.validated_title")}
                {detail.variantLabel && (
                  <Badge variant="secondary" className="text-xs">
                    {pickText(detail.variantLabel, lang)}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>{questionnaireName}</DialogDescription>
            </DialogHeader>
            <div className="mt-2 space-y-4">
              {section(t("info.citation"), pickText(detail.citation, lang))}
              {detail.doi &&
                section(
                  "DOI",
                  detail.doi.startsWith("http") ? detail.doi : `https://doi.org/${detail.doi}`,
                )}
              {section(t("info.summary"), pickText(detail.summary, lang))}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{questionnaireName}</DialogTitle>
              <DialogDescription>{t("info.subtitle")}</DialogDescription>
            </DialogHeader>
            <div className="mt-2 space-y-4">
              {section(t("info.study"), pickText(study.study, lang))}
              {study.doi &&
                section(
                  "DOI",
                  study.doi.startsWith("http") ? study.doi : `https://doi.org/${study.doi}`,
                )}
              {section(t("info.rationale"), pickText(study.rationale, lang))}
              {section(t("info.objective"), pickText(study.objective, lang))}
              {section(t("info.methodology"), pickText(study.methodology, lang))}
              {section(t("info.results"), pickText(study.results, lang))}
              {study.sensitivity &&
                section(t("info.sensitivity"), pickText(study.sensitivity, lang))}
              {study.observations &&
                section(t("info.observations"), pickText(study.observations, lang))}

              {study.spanishValidations && study.spanishValidations.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("info.spanish_validations")}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {study.spanishValidations.map((v, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setDetail(v)}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                      >
                        <BadgeCheck className="h-3.5 w-3.5" />
                        {t("info.validated_badge")}
                        {v.variantLabel ? ` · ${pickText(v.variantLabel, lang)}` : ""}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("info.validated_hint")}
                  </p>
                </section>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
