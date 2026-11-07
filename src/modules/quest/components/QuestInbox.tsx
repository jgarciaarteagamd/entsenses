import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/modules/quest/lib/supabase";
import {
  listMyPatientResponses,
  markResponseSeen,
  deletePatientResponse,
  updateResponseLabel,
} from "@/modules/quest/lib/patient-responses.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Trash2, Inbox, Tag, Pencil, X, User, Stethoscope, Copy, ClipboardCheck, Send } from "lucide-react";
import { useLang } from "@/modules/quest/i18n";
import { ReferenceTable } from "@/routes/_authenticated/quest.resultados";

type Filter = "all" | "patient" | "doctor";

/** Unread Quest responses (for the inbox tab badge and the dashboard). */
export function useQuestUnseen(): number {
  const { data } = useQuery({ queryKey: ["patient-responses"], queryFn: () => listMyPatientResponses({}) });
  return (data ?? []).filter((r: any) => !r.seen).length;
}

/** ENT Senses Quest inbox: questionnaire responses (patients and clinic). */
export function QuestInbox() {
  const qc = useQueryClient();
  const { t, lang } = useLang();
  const [filter, setFilter] = useState<Filter>("all");

  const { data: responses, isLoading } = useQuery({
    queryKey: ["patient-responses"],
    queryFn: () => listMyPatientResponses({}),
  });

  useEffect(() => {
    const channel = supabase
      .channel("patient_responses_inbox")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patient_responses" },
        () => {
          qc.invalidateQueries({ queryKey: ["patient-responses"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  async function handleMarkSeen(id: string, seen: boolean) {
    await markResponseSeen({ data: { id, seen: !seen } });
    qc.invalidateQueries({ queryKey: ["patient-responses"] });
  }

  async function handleDelete(id: string) {
    if (!confirm(t("inbox.confirm_delete"))) return;
    await deletePatientResponse({ data: { id } });
    qc.invalidateQueries({ queryKey: ["patient-responses"] });
  }

  const all = responses ?? [];
  const filtered = useMemo(() => {
    if (filter === "all") return all;
    return all.filter((r: any) => (r.source ?? "patient") === filter);
  }, [all, filter]);

  const unseenCount = all.filter((r: any) => !r.seen).length;
  const counts = {
    all: all.length,
    patient: all.filter((r: any) => (r.source ?? "patient") === "patient").length,
    doctor: all.filter((r: any) => r.source === "doctor").length,
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link to="/invitaciones">
            <Send className="mr-2 h-4 w-4" />
            {t("nav.invitations")}
          </Link>
        </Button>
      </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="mb-4">
          <TabsList>
            <TabsTrigger value="all">
              {t("inbox.filter.all")} <span className="ml-1 text-xs text-muted-foreground">({counts.all})</span>
            </TabsTrigger>
            <TabsTrigger value="patient">
              {t("inbox.filter.patient")} <span className="ml-1 text-xs text-muted-foreground">({counts.patient})</span>
            </TabsTrigger>
            <TabsTrigger value="doctor">
              {t("inbox.filter.doctor")} <span className="ml-1 text-xs text-muted-foreground">({counts.doctor})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading && <p className="text-sm text-muted-foreground">{t("inbox.loading")}</p>}

        {!isLoading && filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {t("inbox.empty")}
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {filtered.map((r: any) => (
            <ResponseCard
              key={r.id}
              r={r}
              lang={lang}
              onMarkSeen={handleMarkSeen}
              onDelete={handleDelete}
              onLabelSaved={() => qc.invalidateQueries({ queryKey: ["patient-responses"] })}
            />
          ))}
        </div>
    </div>
  );
}

function ResponseCard({
  r,
  lang,
  onMarkSeen,
  onDelete,
  onLabelSaved,
}: {
  r: any;
  lang: "es" | "en";
  onMarkSeen: (id: string, seen: boolean) => void;
  onDelete: (id: string) => void;
  onLabelSaved: () => void;
}) {
  const { t } = useLang();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string>(r.label ?? "");
  const [saving, setSaving] = useState(false);

  const [copied, setCopied] = useState(false);

  const source: "patient" | "doctor" = (r.source ?? "patient") as any;

  const copyText = `${(r.questionnaire_slug ?? "").toUpperCase()}: ${r.total_score} ${t("inbox.points")}.`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error("[inbox copy] error", e);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await updateResponseLabel({ data: { id: r.id, label: value } });
      onLabelSaved();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className={r.seen ? "opacity-70" : ""}>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold">
                {r.questionnaire_name ?? r.questionnaire_slug}
              </h3>
              {source === "doctor" ? (
                <Badge variant="outline" className="gap-1 border-blue-300 bg-blue-50 text-blue-800 text-xs dark:bg-blue-950/40 dark:text-blue-300">
                  <Stethoscope className="h-3 w-3" />
                  {t("inbox.source.doctor")}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-800 text-xs dark:bg-emerald-950/40 dark:text-emerald-300">
                  <User className="h-3 w-3" />
                  {t("inbox.source.patient")}
                </Badge>
              )}
              {!r.seen && <Badge variant="default" className="text-xs">{t("inbox.new_badge")}</Badge>}
              {r.label && !editing && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Tag className="h-3 w-3" />
                  {r.label}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(r.created_at).toLocaleString(lang === "en" ? "en-GB" : "es-ES")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={copied ? "default" : "outline"}
              onClick={handleCopy}
              aria-label={copied ? t("inbox.copied") : t("inbox.copy")}
            >
              {copied ? (
                <ClipboardCheck className="mr-1 h-3.5 w-3.5" />
              ) : (
                <Copy className="mr-1 h-3.5 w-3.5" />
              )}
              {copied ? t("inbox.copied") : t("inbox.copy")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onMarkSeen(r.id, r.seen)}>
              <Check className="mr-1 h-3.5 w-3.5" />
              {r.seen ? t("inbox.mark_unread") : t("inbox.mark_read")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(r.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-3">
          {editing ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value.slice(0, 60))}
                  placeholder={t("inbox.label.placeholder")}
                  maxLength={60}
                  className="h-8"
                />
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? t("inbox.label.saving") : t("inbox.label.save")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setValue(r.label ?? "");
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-[11px] leading-4 text-muted-foreground">
                {t("inbox.label.hint")}
              </p>
            </div>

          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => setEditing(true)}
            >
              <Pencil className="mr-1 h-3 w-3" />
              {r.label ? t("inbox.label.edit") : t("inbox.label.add")}
            </Button>
          )}
        </div>

        <div className="mt-3 rounded bg-muted p-3">
          <p className="text-xs text-muted-foreground">{t("inbox.score")}</p>
          <p className="text-2xl font-bold">{r.total_score}</p>
        </div>
        <details className="mt-3 rounded border">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-muted-foreground">
            {t("results.reference")}
          </summary>
          <div className="p-3 pt-0">
            <ReferenceTable slug={r.questionnaire_slug} lang={lang} t={t} />
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
