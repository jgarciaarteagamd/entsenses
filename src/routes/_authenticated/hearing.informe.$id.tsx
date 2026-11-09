import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Loader2, Stethoscope, Tag, User } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { ReportEditor } from "@/modules/hearing/components/ReportEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { getSession, isManualEntry, updateAudiogram, updateReport } from "@/modules/hearing/lib/sessions";
import { getProfessionalDefaults } from "@/lib/profile";
import { RemoteCheckDetails } from "@/modules/hearing/components/RemoteCheckDetails";
import { compactAudiogram, fromStoredReport, normalizeAudiogram, recallIdentity, rememberIdentity } from "@/modules/hearing/lib/report";

export const Route = createFileRoute("/_authenticated/hearing/informe/$id")({
  component: ReportPage,
});

function ReportPage() {
  const { id } = Route.useParams();
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const { data: r, isLoading } = useQuery({ queryKey: ["session", id], queryFn: () => getSession(id) });
  const { data: pro } = useQuery({ queryKey: ["professional"], queryFn: getProfessionalDefaults });

  return (
    <div className="min-h-screen bg-muted/30 print:bg-white">
      <div className="print:hidden">
        <Header />
      </div>
      <main className="mx-auto max-w-6xl px-4 py-6 print:max-w-none print:p-0">
        <div className="mb-4 print:hidden">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/bandeja" search={{ m: "hearing" }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("print.back")}
            </Link>
          </Button>
        </div>
        {(isLoading || !pro) && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        {!isLoading && !r && <p className="text-sm text-muted-foreground">{t("report.not_available")}</p>}
        {r && pro && (
          <ReportEditor
            key={r.id}
            initial={(() => {
              const stored = fromStoredReport(r.report);
              const identity = recallIdentity(r.id);
              return { audiogram: normalizeAudiogram(r.audiogram), ...stored, info: { ...stored.info, ...(identity ?? {}) } };
            })()}
            audiogramEditable={isManualEntry(r)}
            professionalDefaults={pro}
            printNotice={
              r.source === "patient"
                ? t("report.print_notice.remote")
                : r.device?.entry === "audiometer"
                  ? t("report.print_notice.audiometer")
                  : undefined
            }
            banner={
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {r.source === "doctor" ? (
                    <Badge variant="outline" className="gap-1"><Stethoscope className="h-3 w-3" />{t("inbox.source.doctor")}</Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1"><User className="h-3 w-3" />{t("inbox.source.patient")}</Badge>
                  )}
                  {r.label && <Badge variant="outline" className="gap-1"><Tag className="h-3 w-3" />{r.label}</Badge>}
                  <span className="text-muted-foreground">
                    {new Date(r.created_at).toLocaleString(lang === "en" ? "en-GB" : "es-ES")} · {t(`inbox.origin.${r.device?.entry ?? (r.source === "patient" ? "remote" : "manual")}`)}
                  </span>
                </div>
                {r.source === "patient" && (
                  <p className="flex gap-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {t("report.not_calibrated")}
                  </p>
                )}
                {r.source === "patient" && (
                  <div className="print:hidden">
                    <RemoteCheckDetails r={r} />
                  </div>
                )}
              </div>
            }
            onSave={async ({ audiogram, report, identity }) => {
              try {
                if (isManualEntry(r)) await updateAudiogram(r.id, compactAudiogram(audiogram));
                await updateReport(r.id, report as unknown as Record<string, unknown>);
                rememberIdentity(r.id, identity);
                void qc.invalidateQueries({ queryKey: ["sessions"] });
                void qc.invalidateQueries({ queryKey: ["session", id] });
                toast.success(t("report.saved"));
              } catch (e) {
                console.error("[report save]", e);
                toast.error(t("report.save_error"));
              }
            }}
          />
        )}
      </main>
    </div>
  );
}
