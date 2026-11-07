import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PublicHeader } from "@/components/PublicHeader";
import { useLang } from "@/lib/i18n";
import { isUuid } from "@/lib/ids";
import { isSupabaseConfigured } from "@/lib/supabase";

// Patient page opened from the doctor's QR. The informative remote test (questionnaire, device
// choice, tones and digits-in-noise) is built in phase 8; the submission helper already exists
// (submitPatientSession).
export const Route = createFileRoute("/p/$doctorId/hearing")({
  component: PatientPage,
});

function PatientPage() {
  const { doctorId } = Route.useParams();
  const { t } = useLang();
  const valid = isUuid(doctorId);

  return (
    <div className="min-h-screen bg-muted/30">
      <PublicHeader suffix={t("patient.header")} linkHome={false} />
      <main className="mx-auto max-w-2xl px-4 py-8">
        {!valid || !isSupabaseConfigured ? (
          <Card>
            <CardContent className="flex gap-3 py-8 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
              <span>{!valid ? t("patient.invalid") : t("setup.not_configured")}</span>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <h1 className="text-xl font-bold">{t("patient.header")}</h1>
              <div className="flex gap-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <Info className="h-5 w-5 shrink-0" />
                <span>{t("patient.disclaimer")}</span>
              </div>
              <p className="text-sm text-muted-foreground">{t("patient.coming")}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
