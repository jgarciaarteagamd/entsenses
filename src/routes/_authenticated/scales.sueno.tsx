import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/modules/scales/i18n";
import { SleepForm } from "@/modules/scales/components/SleepForm";
import { AssessmentPage, validateAssessmentSearch } from "@/modules/scales/components/AssessmentPage";

export const Route = createFileRoute("/_authenticated/scales/sueno")({
  validateSearch: validateAssessmentSearch,
  component: SleepPage,
});

function SleepPage() {
  const { t } = useLang();
  const { id, label } = Route.useSearch();
  return (
    <AssessmentPage
      pack="sleep"
      id={id}
      label={label}
      titleNew={t("sleep.title.new")}
      titleEdit={t("sleep.title.edit")}
      defaultScales={{ exam: {} }}
      Form={SleepForm}
    />
  );
}
