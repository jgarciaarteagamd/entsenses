import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PatientQuestionnaireFlow } from "@/modules/quest/components/PatientQuestionnaireFlow";
import { getInvitation, submitInvitedResponse } from "@/modules/quest/lib/invitations.functions";
import { useLang } from "@/modules/quest/i18n";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Invitation link sent by the doctor (/i/<token>): same questionnaire flow as the QR link, but the
// response reaches the inbox already labelled. Single use; expires.
export const Route = createFileRoute("/i/$token")({
  head: () => ({
    meta: [
      { title: "Patient questionnaire — ENT Senses Quest" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvitationPage,
});

function Message({ icon, title, body }: { icon: React.ReactNode; title: string; body?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md text-center">
        <CardContent className="space-y-3 pb-8 pt-8">
          <div className="flex justify-center">{icon}</div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {body && <p className="text-sm text-muted-foreground">{body}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function InvitationPage() {
  const { token } = Route.useParams();
  const { t } = useLang();
  const valid = UUID_RE.test(token);
  const { data: inv, isLoading, isError } = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => getInvitation(token),
    enabled: valid,
    retry: 1,
    staleTime: Infinity,
  });

  const spinner = <Message icon={<Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />} title={t("invite.patient.loading")} />;
  if (valid && isLoading) return spinner;
  if (!valid || isError || !inv)
    return <Message icon={<AlertTriangle className="h-12 w-12 text-destructive" />} title={t("invite.patient.invalid")} body={t("invite.patient.ask_doctor")} />;
  if (inv.status === "completed")
    return <Message icon={<CheckCircle2 className="h-12 w-12 text-green-600" />} title={t("invite.patient.completed")} body={t("invite.patient.completed_body")} />;
  if (inv.status === "expired")
    return <Message icon={<Clock className="h-12 w-12 text-amber-600" />} title={t("invite.patient.expired")} body={t("invite.patient.ask_doctor")} />;

  return (
    <Suspense fallback={spinner}>
      <PatientQuestionnaireFlow
        slug={inv.slug}
        variantId={inv.variant}
        onSubmit={async (answers) => {
          await submitInvitedResponse(token, answers);
        }}
        errorMessage={(e) => {
          const m = e instanceof Error ? e.message : "";
          if (m.includes("invitation_completed")) return t("invite.patient.completed");
          if (m.includes("invitation_expired")) return t("invite.patient.expired");
          return null;
        }}
      />
    </Suspense>
  );
}
