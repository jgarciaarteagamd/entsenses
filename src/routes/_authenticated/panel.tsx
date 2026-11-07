import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ClipboardCheck, Copy, Inbox, Printer } from "lucide-react";
import { Header } from "@/components/Header";
import { QrCode } from "@/components/QrCode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLang } from "@/lib/i18n";
import { patientUrl } from "@/lib/links";
import { ensureProfile } from "@/lib/profile";
import { MODULES, type ModuleId } from "@/modules/registry";
import { useHearingUnseen } from "@/modules/hearing/components/HearingInbox";
import { useQuestUnseen } from "@/modules/quest/components/QuestInbox";

export const Route = createFileRoute("/_authenticated/panel")({
  component: PanelPage,
});

function PanelPage() {
  const { t } = useLang();
  const { user } = Route.useRouteContext();
  const qrModules = MODULES.filter((m) => m.status === "active" && m.patientLink);
  const [qrModule, setQrModule] = useState<ModuleId | undefined>(qrModules[0]?.id);
  const [copied, setCopied] = useState(false);
  const unseen = useHearingUnseen() + useQuestUnseen();
  const url = qrModule ? patientUrl(user.id, qrModule) : "";

  useEffect(() => {
    void ensureProfile().catch((e) => console.error("[profile]", e));
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold">{t("panel.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("panel.subtitle")}</p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => {
            const Icon = m.icon;
            const active = m.status === "active";
            return (
              <Card key={m.id} className={active ? "" : "opacity-60"}>
                <CardContent className="flex h-full flex-col gap-3 pt-6">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-lg p-2 ${m.accent}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">ENT Senses</p>
                      <h2 className="font-semibold leading-tight">{m.name}</h2>
                    </div>
                    {!active && <Badge variant="outline" className="ml-auto text-[11px]">{t("module.coming")}</Badge>}
                  </div>
                  <p className="flex-1 text-sm text-muted-foreground">{t(`module.${m.id}.desc`)}</p>
                  {active && m.home && (
                    <Button size="sm" asChild className="self-start">
                      <Link to={m.home}>
                        {t("module.open")}
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          {qrModule && (
            <Card>
              <CardHeader>
                <CardTitle>{t("panel.qr.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {qrModules.length > 1 && (
                  <div className="flex flex-wrap gap-1">
                    {qrModules.map((m) => (
                      <Button key={m.id} size="sm" variant={m.id === qrModule ? "default" : "outline"} onClick={() => setQrModule(m.id)}>
                        {m.name}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <QrCode value={url} size={170} className="mx-auto rounded border bg-white p-2 sm:mx-0" />
                  <div className="min-w-0 flex-1 space-y-3">
                    <p className="text-sm text-muted-foreground">{t(`panel.qr.desc.${qrModule}`)}</p>
                    <p className="break-all rounded bg-muted px-2 py-1 font-mono text-xs">{url}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant={copied ? "default" : "outline"} onClick={copy}>
                        {copied ? <ClipboardCheck className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                        {copied ? t("panel.qr.copied") : t("panel.qr.copy")}
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/imprimir-qr" search={{ m: qrModule }}>
                          <Printer className="mr-1 h-4 w-4" />
                          {t("panel.qr.print")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                {t("inbox.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{t("panel.inbox.desc", unseen)}</p>
              <Button variant="outline" asChild>
                <Link to="/bandeja">{t("panel.inbox.button")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
