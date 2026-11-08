import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PublicHeader } from "@/components/PublicHeader";
import { useLang } from "@/lib/i18n";
import { isUuid } from "@/lib/ids";
import { isSupabaseConfigured } from "@/lib/supabase";
import { PatientCheck } from "@/modules/hearing/components/PatientCheck";

// Patient page opened from the doctor's QR: informative remote hearing check (not calibrated).
export const Route = createFileRoute("/p/$doctorId/hearing")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: PatientPage,
});

function PatientPage() {
  const { doctorId } = Route.useParams();
  const { t } = useLang();
  const valid = isUuid(doctorId);

  return (
    <div className="min-h-screen bg-muted/30">
      <PublicHeader suffix={t("patient.header")} linkHome={false} />
      <main className="mx-auto max-w-xl px-4 py-6">
        {!valid || !isSupabaseConfigured ? (
          <Card>
            <CardContent className="flex gap-3 py-8 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
              <span>{!valid ? t("patient.invalid") : t("setup.not_configured")}</span>
            </CardContent>
          </Card>
        ) : (
          <PatientCheck doctorId={doctorId} />
        )}
      </main>
    </div>
  );
}
