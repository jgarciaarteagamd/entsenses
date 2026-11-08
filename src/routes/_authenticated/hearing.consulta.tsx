import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Headphones, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { HearingNav } from "@/modules/hearing/components/HearingNav";
import { ReportEditor } from "@/modules/hearing/components/ReportEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/lib/i18n";
import { submitDoctorSession } from "@/modules/hearing/lib/sessions";
import { getProfessionalDefaults } from "@/lib/profile";
import { compactAudiogram, emptyAudiogram, fromStoredReport, rememberIdentity } from "@/modules/hearing/lib/report";
import { ageGroupFromText } from "@/modules/hearing/lib/age";

// New in-clinic report: the audiogram is typed in from the audiometer used (phase 1b). The
// calibrated ENT Senses audiometer (phases 2–6) will fill the same editor automatically.
export const Route = createFileRoute("/_authenticated/hearing/consulta")({
  component: ClinicPage,
});

function ClinicPage() {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [label, setLabel] = useState("");
  const { data: pro, isLoading } = useQuery({ queryKey: ["professional"], queryFn: getProfessionalDefaults });
  const [initial] = useState(() => ({ audiogram: emptyAudiogram(), ...fromStoredReport(null) }));

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <HearingNav />
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
          <Headphones className="h-6 w-6" />
          {t("clinic.title")}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">{t("clinic.subtitle")}</p>
        {isLoading || !pro ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <ReportEditor
            initial={initial}
            audiogramEditable
            professionalDefaults={pro}
            banner={
              <div className="max-w-sm space-y-1.5">
                <Label htmlFor="clinic-label" className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  {t("clinic.label")}
                </Label>
                <Input
                  id="clinic-label"
                  value={label}
                  maxLength={60}
                  onChange={(e) => setLabel(e.target.value.slice(0, 60))}
                  placeholder={t("inbox.label.placeholder")}
                />
              </div>
            }
            onSave={async ({ audiogram, report, identity }) => {
              try {
                const id = await submitDoctorSession(
                  {
                    info: { sex: "unspecified", ageGroup: ageGroupFromText(report.info.edad), lang },
                    device: { entry: "manual", transducer: "unknown" },
                    audiogram: compactAudiogram(audiogram),
                  },
                  { calibrated: false, label, report: report as unknown as Record<string, unknown> },
                );
                rememberIdentity(id, identity);
                void qc.invalidateQueries({ queryKey: ["sessions"] });
                toast.success(t("report.saved"));
                navigate({ to: "/hearing/informe/$id", params: { id } });
              } catch (e) {
                console.error("[clinic save]", e);
                toast.error(t("report.save_error"));
              }
            }}
          />
        )}
      </main>
    </div>
  );
}
