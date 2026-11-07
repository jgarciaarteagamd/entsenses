import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/lib/i18n";
import { MODULES, activeModules, type ModuleId } from "@/modules/registry";
import { HearingInbox, useHearingUnseen } from "@/modules/hearing/components/HearingInbox";
import { QuestInbox, useQuestUnseen } from "@/modules/quest/components/QuestInbox";

// Unified inbox: one tab per active module, each rendering that module's own inbox.
export const Route = createFileRoute("/_authenticated/bandeja")({
  validateSearch: (s: Record<string, unknown>): { m?: ModuleId } => ({
    m: MODULES.some((x) => x.id === s.m) ? (s.m as ModuleId) : undefined,
  }),
  component: InboxPage,
});

const INBOXES: Partial<Record<ModuleId, { Inbox: () => React.ReactNode; useUnseen: () => number }>> = {
  quest: { Inbox: QuestInbox, useUnseen: useQuestUnseen },
  hearing: { Inbox: HearingInbox, useUnseen: useHearingUnseen },
};

function UnseenBadge({ use }: { use: () => number }) {
  const n = use();
  return n > 0 ? <Badge className="ml-1.5 h-5 px-1.5 text-[11px]">{n}</Badge> : null;
}

function InboxPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { m } = Route.useSearch();
  const tabs = activeModules().filter((x) => INBOXES[x.id]);
  const current = tabs.find((x) => x.id === m) ?? tabs[0];
  const Current = current ? INBOXES[current.id]!.Inbox : null;

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-5">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Inbox className="h-6 w-6" />
            {t("inbox.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("inbox.subtitle")}</p>
        </div>
        <nav className="mb-5 flex flex-wrap gap-1 rounded-lg border bg-background p-1">
          {tabs.map((x) => {
            const Icon = x.icon;
            const active = x.id === current?.id;
            return (
              <button
                key={x.id}
                onClick={() => navigate({ to: "/bandeja", search: { m: x.id } })}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                <Icon className="h-4 w-4" />
                {x.name}
                <UnseenBadge use={INBOXES[x.id]!.useUnseen} />
              </button>
            );
          })}
        </nav>
        {Current && <Current />}
      </main>
    </div>
  );
}
