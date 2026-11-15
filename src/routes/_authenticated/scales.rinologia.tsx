import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/modules/scales/i18n";
import { RhinologyForm } from "@/modules/scales/components/RhinologyForm";
import { AssessmentPage, validateAssessmentSearch } from "@/modules/scales/components/AssessmentPage";

export const Route = createFileRoute("/_authenticated/scales/rinologia")({
  validateSearch: validateAssessmentSearch,
  component: RhinologyPage,
});

function RhinologyPage() {
  const { t } = useLang();
  const { id, label } = Route.useSearch();
  return (
    <AssessmentPage
      pack="rhinology"
      id={id}
      label={label}
      titleNew={t("form.title.new")}
      titleEdit={t("form.title.edit")}
      defaultScales={{ nps: {}, lundKennedy: {} }}
      Form={RhinologyForm}
    />
  );
}
