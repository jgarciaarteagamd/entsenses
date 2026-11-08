import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Copy,
  Inbox,
  Pencil,
  Printer,
  Stethoscope,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLang } from "@/lib/i18n";
import { summaryText } from "@/modules/hearing/lib/summary";
import { normalizeAudiogram, ptaSummary, fromStoredReport } from "@/modules/hearing/lib/report";
import AudiogramChart from "@/modules/hearing/audiometric/components/AudiogramChart";
import { Ear } from "@/modules/hearing/audiometric/types";
import {
  deleteSession,
  listMySessions,
  markSeen,
  updateLabel,
  type SessionRow,
} from "@/modules/hearing/lib/sessions";
import { supabase } from "@/lib/supabase";
import { estimatedPta, readRemoteAudiogram } from "@/modules/hearing/lib/remoteCheck";
import { RemoteCheckDetails } from "./RemoteCheckDetails";

type Filter = "all" | "patient" | "doctor";

/** Unread Hearing sessions (for the inbox tab badge and the dashboard). */
export function useHearingUnseen(): number {
  const { data } = useQuery({ queryKey: ["sessions"], queryFn: listMySessions });
  return (data ?? []).filter((r) => !r.seen).length;
}

/** ENT Senses Hearing inbox: audiometry sessions (clinic reports and patient checks). */
export function HearingInbox() {
  const qc = useQueryClient();
  const { t } = useLang();
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isLoading } = useQuery({ queryKey: ["sessions"], queryFn: listMySessions });

  useEffect(() => {
    const channel = supabase
      .channel("audiometry_sessions_inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "audiometry_sessions" }, () =>
        qc.invalidateQueries({ queryKey: ["sessions"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  const all = data ?? [];
  const filtered = useMemo(() => (filter === "all" ? all : all.filter((r) => r.source === filter)), [all, filter]);
  const counts = {
    all: all.length,
    patient: all.filter((r) => r.source === "patient").length,
    doctor: all.filter((r) => r.source === "doctor").length,
  };
  const refresh = () => qc.invalidateQueries({ queryKey: ["sessions"] });

  return (
    <div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="mb-4">
          <TabsList>
            {(["all", "patient", "doctor"] as const).map((f) => (
              <TabsTrigger key={f} value={f}>
                {t(`inbox.filter.${f}`)} <span className="ml-1 text-xs text-muted-foreground">({counts[f]})</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading && <p className="text-sm text-muted-foreground">{t("inbox.loading")}</p>}
        {!isLoading && filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">{t("inbox.empty")}</CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {filtered.map((r) => (
            <ResultCard key={r.id} r={r} onChanged={refresh} />
          ))}
        </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-muted p-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}

function ResultCard({ r, onChanged }: { r: SessionRow; onChanged: () => void }) {
  const { lang, t } = useLang();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(r.label ?? "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const audiogram = normalizeAudiogram(r.audiogram);
  const pta = ptaSummary(r.audiogram, fromStoredReport(r.report).standard);
  const remote = readRemoteAudiogram(r.audiogram);
  const remotePta = remote ? { right: estimatedPta(remote.right), left: estimatedPta(remote.left) } : null;
  const redFlags = ((r.questionnaire as { redFlags?: unknown[] })?.redFlags ?? []).length;

  async function act(fn: () => Promise<void>) {
    try {
      await fn();
      onChanged();
    } catch (e) {
      console.error("[inbox]", e);
      toast.error(t("inbox.error"));
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(summaryText(r, lang));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error("[inbox copy]", e);
    }
  }

  async function saveLabel() {
    setSaving(true);
    await act(() => updateLabel(r.id, value));
    setSaving(false);
    setEditing(false);
  }

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && !r.seen) void act(() => markSeen(r.id, true));
  }

  return (
    <Card className={r.seen && !open ? "opacity-75" : ""}>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold">{t("inbox.item")}</h3>
              {r.source === "doctor" ? (
                <Badge variant="outline" className="gap-1 border-blue-300 bg-blue-50 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                  <Stethoscope className="h-3 w-3" />
                  {t("inbox.source.doctor")}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 border-emerald-300 bg-emerald-50 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <User className="h-3 w-3" />
                  {t("inbox.source.patient")}
                </Badge>
              )}
              {!r.seen && <Badge className="text-xs">{t("inbox.new_badge")}</Badge>}
              {redFlags > 0 && (
                <Badge variant="outline" className="gap-1 border-rose-300 bg-rose-50 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                  {t("inbox.red_flags")}
                </Badge>
              )}
              {r.label && !editing && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Tag className="h-3 w-3" />
                  {r.label}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(r.created_at).toLocaleString(lang === "en" ? "en-GB" : "es-ES")}
              {r.sex !== "unspecified" && ` · ${t(`setup.sex.${r.sex}`)}`}
              {r.age_group !== "unspecified" && ` · ${t(`setup.age.${r.age_group}`)}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={copied ? "default" : "outline"} onClick={handleCopy}>
              {copied ? <ClipboardCheck className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
              {copied ? t("inbox.copied") : t("inbox.copy")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => act(() => markSeen(r.id, !r.seen))}>
              <Check className="mr-1 h-3.5 w-3.5" />
              {r.seen ? t("inbox.mark_unread") : t("inbox.mark_read")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label="delete"
              onClick={() => {
                if (confirm(t("inbox.confirm_delete"))) void act(() => deleteSession(r.id));
              }}
            >
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
                <Button size="sm" onClick={saveLabel} disabled={saving}>
                  {saving ? t("inbox.label.saving") : t("inbox.label.save")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setValue(r.label ?? ""); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-[11px] leading-4 text-muted-foreground">{t("inbox.label.hint")}</p>
            </div>
          ) : (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => setEditing(true)}>
              <Pencil className="mr-1 h-3 w-3" />
              {r.label ? t("inbox.label.edit") : t("inbox.label.add")}
            </Button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label={t("inbox.origin")} value={t(`inbox.origin.${r.device?.entry ?? (r.source === "patient" ? "remote" : "manual")}`)} />
          <Metric label={t("inbox.calibration")} value={r.calibrated ? t("inbox.calibrated") : t("inbox.not_calibrated")} />
          {remotePta ? (
            <>
              <Metric label={t("inbox.pta_right_est")} value={remotePta.right !== null ? `≈ ${remotePta.right} dB` : "—"} />
              <Metric label={t("inbox.pta_left_est")} value={remotePta.left !== null ? `≈ ${remotePta.left} dB` : "—"} />
            </>
          ) : (
            <>
              <Metric label={t("inbox.pta_right")} value={pta.right ? `${pta.right} dB` : "—"} />
              <Metric label={t("inbox.pta_left")} value={pta.left ? `${pta.left} dB` : "—"} />
            </>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={toggleOpen}>
            {open ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
            {open ? t("inbox.details.hide") : t("inbox.details.show")}
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/hearing/informe/$id" params={{ id: r.id }}>
              <Printer className="mr-1 h-4 w-4" />
              {t("inbox.open_report")}
            </Link>
          </Button>
        </div>

        {open && remote && (
          <div className="mt-4">
            <RemoteCheckDetails r={r} />
          </div>
        )}
        {open && !remote && (
          <div className="mt-4 space-y-5">
            <div className="grid gap-4 text-slate-900 md:grid-cols-2">
              <div className="aspect-[4/3] overflow-hidden rounded-xl border border-red-200 bg-white sm:aspect-auto sm:h-[300px]">
                <AudiogramChart ear={Ear.Right} data={audiogram.right} />
              </div>
              <div className="aspect-[4/3] overflow-hidden rounded-xl border border-blue-200 bg-white sm:aspect-auto sm:h-[300px]">
                <AudiogramChart ear={Ear.Left} data={audiogram.left} />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
