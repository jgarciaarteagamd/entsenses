import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLang } from "@/modules/scales/i18n";
import { getAssessment } from "@/modules/scales/lib/assessments";
import { RhinologyReport } from "@/modules/scales/components/RhinologyReport";
import { LarynxReport } from "@/modules/scales/components/LarynxReport";
import { OtologyReport } from "@/modules/scales/components/OtologyReport";
import { SleepReport } from "@/modules/scales/components/SleepReport";
import { formatDay } from "@/modules/scales/components/ScalesInbox";

export const Route = createFileRoute("/_authenticated/scales/informe/$id")({
  component: ReportPage,
});

function ReportPage() {
  const { id } = Route.useParams();
  const { lang, t } = useLang();
  const { data: r, isLoading } = useQuery({ queryKey: ["scale-assessment", id], queryFn: () => getAssessment(id) });

  return (
    <div className="min-h-screen bg-muted/30 print:bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/bandeja" search={{ m: "scales" }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("report.back")}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button size="sm" onClick={() => window.print()} disabled={!r}>
            <Printer className="mr-2 h-4 w-4" />
            {t("report.print")}
          </Button>
        </div>
      </div>
      <main className="mx-auto max-w-3xl space-y-5 bg-white px-6 pb-12 pt-6 text-neutral-900 shadow-sm print:max-w-none print:px-0 print:shadow-none">
        {isLoading && <p className="text-sm text-neutral-500">{t("list.loading")}</p>}
        {!isLoading && !r && <p className="text-sm text-neutral-500">{t("report.not_available")}</p>}
        {r && (
          <>
            <header className="border-b pb-4">
              <p className="text-xs uppercase tracking-wide text-neutral-500">ENT Senses Scales</p>
              <h1 className="text-2xl font-bold">{t(r.pack === "rhinology" ? "report.title" : `report.title.${r.pack}`)}</h1>
              <p className="mt-1 text-sm text-neutral-600">
                {t("report.date")}: {formatDay(r.assessed_on, lang)}
                {r.label && (
                  <>
                    {" · "}
                    {t("report.label")}: <strong>{r.label}</strong>
                  </>
                )}
              </p>
            </header>
            {r.pack === "larynx" ? (
              <LarynxReport row={r} />
            ) : r.pack === "otology" ? (
              <OtologyReport row={r} />
            ) : r.pack === "sleep" ? (
              <SleepReport row={r} />
            ) : (
              <RhinologyReport row={r} />
            )}
          </>
        )}
      </main>
      <style>{`@media print { @page { size: A4; margin: 12mm; } }`}</style>
    </div>
  );
}
