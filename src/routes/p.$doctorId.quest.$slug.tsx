import { createFileRoute } from "@tanstack/react-router";
import { getQuestionnaireBySlug } from "@/modules/quest/lib/questionnaire.functions";
import { submitPatientResponse } from "@/modules/quest/lib/patient-responses.functions";
import { normaliseVariantId } from "@/modules/quest/lib/questionnaire-variants";
import { PatientQuestionnaireFlow } from "@/modules/quest/components/PatientQuestionnaireFlow";

export const Route = createFileRoute("/p/$doctorId/quest/$slug")({
  validateSearch: (search: Record<string, unknown>): { v?: string } => ({
    v: normaliseVariantId(typeof search.v === "string" ? search.v : undefined),
  }),
  head: () => ({
    meta: [
      { title: "Patient questionnaire — ENT Senses Quest" },
      { name: "description", content: "Complete the questionnaire online; results will reach your doctor." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["questionnaire", params.slug],
      queryFn: () => getQuestionnaireBySlug({ data: params.slug }),
    });
  },
  component: PatientQuestionnairePage,
});

function PatientQuestionnairePage() {
  const { doctorId, slug } = Route.useParams();
  const { v: variantId } = Route.useSearch();
  return (
    <PatientQuestionnaireFlow
      slug={slug}
      variantId={variantId}
      onSubmit={async (answers) => {
        await submitPatientResponse({ data: { doctorId, slug, answers } });
      }}
    />
  );
}
