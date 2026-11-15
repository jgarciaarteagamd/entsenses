// New / edit assessment page shared by every pack: loads the row when editing, saves, and shows
// the follow-up actions after saving.
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ComponentType } from "react";
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
  todayIso,
  updateAssessment,
  type AssessmentInput,
  type Pack,
  type RowOf,
  type ScaleAssessmentRow,
} from "@/modules/scales/lib/assessments";
import { ASSESSMENTS_KEY, useAssessments } from "./ScalesInbox";

export interface PackFormProps<S> {
  initial: AssessmentInput<S>;
  currentId?: string;
  rows: ScaleAssessmentRow[];
  saving: boolean;
  onSave: (input: AssessmentInput<S>) => void;
}

export function AssessmentPage<P extends Pack>({
  pack,
  id,
  label,
  titleNew,
  titleEdit,
  defaultScales,
  Form,
}: {
  pack: P;
  id?: string;
  label?: string;
  titleNew: string;
  titleEdit: string;
  defaultScales: RowOf<P>["scales"];
  Form: ComponentType<PackFormProps<RowOf<P>["scales"]>>;
}) {
  const { t } = useLang();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: rows } = useAssessments();
  const existing = useQuery({ queryKey: ["scale-assessment", id], queryFn: () => getAssessment(id!), enabled: !!id });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ id: string; label: string | null } | null>(null);
  const [attempt, setAttempt] = useState(0);

  async function save(input: AssessmentInput<RowOf<P>["scales"]>) {
    setSaving(true);
    try {
      let savedId = id;
      if (id) await updateAssessment(id, pack, input);
      else savedId = await createAssessment(pack, input);
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

  function another() {
    setSaved(null);
    setAttempt((a) => a + 1);
    // Clears ?id= when the page was editing an existing assessment.
    if (pack === "larynx") void navigate({ to: "/scales/laringe", search: {} });
    else if (pack === "otology") void navigate({ to: "/scales/otologia", search: {} });
    else void navigate({ to: "/scales/rinologia", search: {} });
  }

  const row = existing.data && existing.data.pack === pack ? (existing.data as RowOf<P>) : null;
  const initial: AssessmentInput<RowOf<P>["scales"]> | null = id
    ? row
      ? { assessedOn: row.assessed_on, label: row.label, scales: row.scales }
      : null
    : { assessedOn: todayIso(), label: label ?? null, scales: defaultScales };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">{id ? titleEdit : titleNew}</h1>
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
                    <Link to="/scales/evolucion" search={{ label: saved.label, pack }}>
                      <LineChart className="mr-2 h-4 w-4" />
                      {t("form.after_save.followup")}
                    </Link>
                  </Button>
                )}
                <Button onClick={another}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t("form.after_save.new")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : id && existing.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("list.loading")}</p>
        ) : !initial ? (
          <p className="text-sm text-muted-foreground">{t("form.not_found")}</p>
        ) : (
          <Form key={`${id ?? "new"}-${attempt}`} initial={initial} currentId={id} rows={rows ?? []} saving={saving} onSave={save} />
        )}
      </main>
    </div>
  );
}

export function validateAssessmentSearch(s: Record<string, unknown>): { id?: string; label?: string } {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return {
    id: typeof s.id === "string" && UUID_RE.test(s.id) ? s.id : undefined,
    label: typeof s.label === "string" ? s.label.slice(0, 60) : undefined,
  };
}
