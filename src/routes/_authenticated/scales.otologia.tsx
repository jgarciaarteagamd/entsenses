import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/modules/scales/i18n";
import { OtologyForm } from "@/modules/scales/components/OtologyForm";
import { AssessmentPage, validateAssessmentSearch } from "@/modules/scales/components/AssessmentPage";

export const Route = createFileRoute("/_authenticated/scales/otologia")({
  validateSearch: validateAssessmentSearch,
  component: OtologyPage,
});

function OtologyPage() {
  const { t } = useLang();
  const { id, label } = Route.useSearch();
  return (
    <AssessmentPage
      pack="otology"
      id={id}
      label={label}
      titleNew={t("otology.title.new")}
      titleEdit={t("otology.title.edit")}
      defaultScales={{ houseBrackmann: {} }}
      Form={OtologyForm}
    />
  );
}
