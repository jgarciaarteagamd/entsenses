import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/modules/scales/i18n";
import { LarynxForm } from "@/modules/scales/components/LarynxForm";
import { AssessmentPage, validateAssessmentSearch } from "@/modules/scales/components/AssessmentPage";

export const Route = createFileRoute("/_authenticated/scales/laringe")({
  validateSearch: validateAssessmentSearch,
  component: LarynxPage,
});

function LarynxPage() {
  const { t } = useLang();
  const { id, label } = Route.useSearch();
  return (
    <AssessmentPage
      pack="larynx"
      id={id}
      label={label}
      titleNew={t("larynx.title.new")}
      titleEdit={t("larynx.title.edit")}
      defaultScales={{ rfs: {} }}
      Form={LarynxForm}
    />
  );
}
