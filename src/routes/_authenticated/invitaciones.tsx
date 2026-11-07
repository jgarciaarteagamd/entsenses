import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Inbox, Send, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/modules/quest/lib/supabase";
import { useLang } from "@/modules/quest/i18n";
import {
  deleteInvitation,
  invitationStatus,
  invitationUrl,
  listMyInvitations,
  type InvitationRow,
  type InvitationStatus,
} from "@/modules/quest/lib/invitations.functions";
import { getQuestionnaires } from "@/modules/quest/lib/questionnaire.functions";

export const Route = createFileRoute("/_authenticated/invitaciones")({
  component: InvitationsPage,
});

type Filter = "all" | InvitationStatus;

const STATUS_STYLE: Record<InvitationStatus, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  completed: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  expired: "border-slate-300 bg-slate-50 text-slate-600 dark:bg-slate-900/40 dark:text-slate-300",
};

function InvitationsPage() {
  const qc = useQueryClient();
  const { t } = useLang();
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isLoading } = useQuery({ queryKey: ["invitations"], queryFn: listMyInvitations });
  const { data: questionnaires } = useQuery({ queryKey: ["questionnaires"], queryFn: () => getQuestionnaires() });

  useEffect(() => {
    const channel = supabase
      .channel("patient_invitations_list")
      .on("postgres_changes", { event: "*", schema: "public", table: "patient_invitations" }, () =>
        qc.invalidateQueries({ queryKey: ["invitations"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  const names = useMemo(
    () => Object.fromEntries((questionnaires ?? []).map((q: { slug: string; name: string }) => [q.slug, q.name])),
    [questionnaires],
  );
  const all = (data ?? []).map((r) => ({ ...r, status: invitationStatus(r) }));
  const counts = {
    all: all.length,
    pending: all.filter((r) => r.status === "pending").length,
    completed: all.filter((r) => r.status === "completed").length,
    expired: all.filter((r) => r.status === "expired").length,
  };
  const shown = filter === "all" ? all : all.filter((r) => r.status === filter);
  const refresh = () => qc.invalidateQueries({ queryKey: ["invitations"] });

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Send className="h-6 w-6" />
              {t("invite.list.title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("invite.list.subtitle")}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/bandeja">
              <Inbox className="mr-2 h-4 w-4" />
              {t("nav.inbox")}
            </Link>
          </Button>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="mb-4">
          <TabsList>
            {(["all", "pending", "completed", "expired"] as const).map((f) => (
              <TabsTrigger key={f} value={f}>
                {t(`invite.filter.${f}`)} <span className="ml-1 text-xs text-muted-foreground">({counts[f]})</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading && <p className="text-sm text-muted-foreground">{t("inbox.loading")}</p>}
        {!isLoading && shown.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">{t("invite.list.empty")}</CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {shown.map((r) => (
            <InvitationCard key={r.id} r={r} name={names[r.questionnaire_slug] ?? r.questionnaire_slug} onChanged={refresh} />
          ))}
        </div>
      </main>
    </div>
  );
}

function InvitationCard({
  r,
  name,
  onChanged,
}: {
  r: InvitationRow & { status: InvitationStatus };
  name: string;
  onChanged: () => void;
}) {
  const { lang, t } = useLang();
  const [copied, setCopied] = useState(false);
  const fmt = (d: string) => new Date(d).toLocaleDateString(lang === "en" ? "en-GB" : "es-ES");

  async function copy() {
    try {
      await navigator.clipboard.writeText(invitationUrl(r.token));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error("[invitation copy]", e);
    }
  }

  async function remove() {
    if (!confirm(t("invite.confirm_delete"))) return;
    try {
      await deleteInvitation(r.id);
      onChanged();
    } catch (e) {
      console.error("[invitation delete]", e);
      toast.error(t("invite.error"));
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <Tag className="h-3 w-3" />
              {r.label}
            </Badge>
            <Badge variant="outline" className={`text-xs ${STATUS_STYLE[r.status]}`}>
              {t(`invite.filter.${r.status}`)}
            </Badge>
          </div>
          <p className="mt-1 truncate text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            {t("invite.sent_on", fmt(r.created_at))}
            {" · "}
            {r.status === "completed" && r.completed_at
              ? t("invite.completed_on", fmt(r.completed_at))
              : t("invite.expires_on", fmt(r.expires_at))}
          </p>
        </div>
        <div className="flex gap-2">
          {r.status === "pending" && (
            <Button size="sm" variant={copied ? "default" : "outline"} onClick={copy}>
              {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
              {copied ? t("invite.copied") : t("invite.copy")}
            </Button>
          )}
          <Button size="sm" variant="ghost" aria-label="delete" onClick={remove}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
