import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, LineChart, Printer, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/modules/scales/i18n";
import {
  createAssessment,
  getAssessment,
  isUuid,
  todayIso,
  updateAssessment,
  type AssessmentInput,
} from "@/modules/scales/lib/assessments";
import { RhinologyForm } from "@/modules/scales/components/RhinologyForm";
import { ASSESSMENTS_KEY, useAssessments } from "@/modules/scales/components/ScalesInbox";

interface Search {
  id?: string;
  label?: string;
}

export const Route = createFileRoute("/_authenticated/scales/rinologia")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: typeof s.id === "string" && isUuid(s.id) ? s.id : undefined,
    label: typeof s.label === "string" ? s.label.slice(0, 60) : undefined,
  }),
  component: RhinologyPage,
});

function RhinologyPage() {
  const { t } = useLang();
  const { id, label } = Route.useSearch();
  const qc = useQueryClient();
  const { data: rows } = useAssessments();
  const existing = useQuery({ queryKey: ["scale-assessment", id], queryFn: () => getAssessment(id!), enabled: !!id });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ id: string; label: string | null } | null>(null);
  const [attempt, setAttempt] = useState(0);

  async function save(input: AssessmentInput) {
    setSaving(true);
    try {
      let savedId = id;
      if (id) await updateAssessment(id, input);
      else savedId = await createAssessment(input);
      await qc.invalidateQueries({ queryKey: ASSESSMENTS_KEY });
      if (id) await qc.invalidateQueries({ queryKey: ["scale-assessment", id] });
      setSaved({ id: savedId!, label: input.label });
      window.scrollTo({ top: 0 });
      toast.success(t("form.saved"));
    } catch (e) {
      console.error("[scales save]", e);
      toast.error(t("form.error"));
    } finally {
      setSaving(false);
    }
  }

  const initial: AssessmentInput | null = id
    ? existing.data
      ? { assessedOn: existing.data.assessed_on, label: existing.data.label, scales: existing.data.scales }
      : null
    : { assessedOn: todayIso(), label: label ?? null, scales: { nps: {}, lundKennedy: {} } };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">{id ? t("form.title.edit") : t("form.title.new")}</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">{t("form.subtitle")}</p>

        {saved ? (
          <Card className="text-center">
            <CardContent className="space-y-4 py-10">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
              <p className="text-lg font-semibold">{t("form.saved")}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" asChild>
                  <Link to="/scales/informe/$id" params={{ id: saved.id }}>
                    <Printer className="mr-2 h-4 w-4" />
                    {t("form.after_save.print")}
                  </Link>
                </Button>
                {saved.label && (
                  <Button variant="outline" asChild>
                    <Link to="/scales/evolucion" search={{ label: saved.label }}>
                      <LineChart className="mr-2 h-4 w-4" />
                      {t("form.after_save.followup")}
                    </Link>
                  </Button>
                )}
                <Button asChild>
                  <Link
                    to="/scales/rinologia"
                    search={{}}
                    onClick={() => {
                      setSaved(null);
                      setAttempt((a) => a + 1);
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {t("form.after_save.new")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : id && existing.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("list.loading")}</p>
        ) : !initial ? (
          <p className="text-sm text-muted-foreground">{t("form.not_found")}</p>
        ) : (
          <RhinologyForm
            key={`${id ?? "new"}-${attempt}`}
            initial={initial}
            currentId={id}
            rows={rows ?? []}
            saving={saving}
            onSave={save}
          />
        )}
      </main>
    </div>
  );
}
