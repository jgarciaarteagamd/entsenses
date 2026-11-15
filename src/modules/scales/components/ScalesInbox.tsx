import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LineChart, Pencil, Printer, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLang, type Lang } from "@/modules/scales/i18n";
import { deleteAssessment, listMyAssessments, type ScaleAssessmentRow } from "@/modules/scales/lib/assessments";
import { AssessmentSummary } from "./SummaryView";
import { PackLink } from "./PackLink";

export const ASSESSMENTS_KEY = ["scale-assessments"] as const;

export const useAssessments = () => useQuery({ queryKey: ASSESSMENTS_KEY, queryFn: listMyAssessments });

/** Scales has no patient submissions, so nothing is ever unread. */
export function useScalesUnseen(): number {
  return 0;
}

export const formatDay = (iso: string, lang: Lang) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(lang === "en" ? "en-GB" : "es-ES", { day: "2-digit", month: "short", year: "numeric" });

export function AssessmentCard({ r }: { r: ScaleAssessmentRow }) {
  const { lang, t } = useLang();
  const qc = useQueryClient();

  async function remove() {
    if (!confirm(t("list.confirm_delete"))) return;
    try {
      await deleteAssessment(r.id);
      await qc.invalidateQueries({ queryKey: ASSESSMENTS_KEY });
    } catch (e) {
      console.error("[scales delete]", e);
      toast.error(t("list.error"));
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{t(`pack.${r.pack}`)}</h3>
              <Badge variant="outline" className="gap-1 text-xs">
                <Tag className="h-3 w-3" />
                {r.label ?? t("list.no_label")}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{formatDay(r.assessed_on, lang)}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="outline" asChild>
              <PackLink pack={r.pack} id={r.id}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                {t("list.edit")}
              </PackLink>
            </Button>
            {r.label && (
              <Button size="sm" variant="outline" asChild>
                <Link to="/scales/evolucion" search={{ label: r.label, pack: r.pack }}>
                  <LineChart className="mr-1 h-3.5 w-3.5" />
                  {t("list.followup")}
                </Link>
              </Button>
            )}
            <Button size="sm" variant="outline" asChild>
              <Link to="/scales/informe/$id" params={{ id: r.id }}>
                <Printer className="mr-1 h-3.5 w-3.5" />
                {t("list.print")}
              </Link>
            </Button>
            <Button size="sm" variant="ghost" aria-label={t("list.delete")} onClick={remove}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <AssessmentSummary row={r} compact />
      </CardContent>
    </Card>
  );
}

/** ENT Senses Scales tab of the inbox: every saved assessment, filterable by label. */
export function ScalesInbox() {
  const { t } = useLang();
  const { data, isLoading, error } = useAssessments();
  const [filter, setFilter] = useState("");
  const rows = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return (data ?? []).filter((r) => !f || (r.label ?? "").toLowerCase().includes(f));
  }, [data, filter]);

  return (
    <div className="space-y-3">
      <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t("list.filter")} className="max-w-xs" />
      {isLoading && <p className="text-sm text-muted-foreground">{t("list.loading")}</p>}
      {error && <p className="text-sm text-destructive">{t("list.error")}</p>}
      {!isLoading && !error && rows.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">{t("scales.empty")}</CardContent>
        </Card>
      )}
      {rows.map((r) => (
        <AssessmentCard key={r.id} r={r} />
      ))}
    </div>
  );
}
