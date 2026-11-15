import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Inbox, LineChart, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLang } from "@/modules/scales/i18n";
import { CATALOG } from "@/modules/scales/lib/catalog";
import { distinctLabels } from "@/modules/scales/lib/assessments";
import { AssessmentCard, useAssessments } from "@/modules/scales/components/ScalesInbox";

export const Route = createFileRoute("/_authenticated/scales/")({
  component: ScalesHome,
});

function ScalesHome() {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const { data, isLoading } = useAssessments();
  const [label, setLabel] = useState("");
  const labels = distinctLabels(data ?? []);
  const recent = (data ?? []).slice(0, 5);

  function openFollowup(e: React.FormEvent) {
    e.preventDefault();
    const l = label.trim();
    if (l) navigate({ to: "/scales/evolucion", search: { label: l } });
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t("scales.title")}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">{t("scales.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/scales/rinologia">
                <Plus className="mr-1 h-4 w-4" />
                {t("pack.rhinology")}
              </Link>
            </Button>
            <Button asChild>
              <Link to="/scales/laringe">
                <Plus className="mr-1 h-4 w-4" />
                {t("pack.larynx")}
              </Link>
            </Button>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          {CATALOG.map((area) => (
            <Card key={area.id} className={area.route ? "" : "opacity-70"}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2 text-lg">
                  {area.name[lang]}
                  {!area.route && (
                    <Badge variant="outline" className="text-[11px] font-normal">
                      {t("scales.coming")}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1 text-sm">
                  {area.scales.map((s) => (
                    <li key={s.name}>
                      <span className="font-medium">{s.name}</span> <span className="text-muted-foreground">— {s.desc[lang]}</span>
                    </li>
                  ))}
                </ul>
                {area.route && (
                  <Button size="sm" asChild>
                    <Link to={area.route}>
                      {t("scales.new")}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <LineChart className="h-5 w-5" />
              {t("scales.followup")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={openFollowup} className="flex flex-wrap gap-2">
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value.slice(0, 60))}
                placeholder={t("scales.followup.placeholder")}
                list="scales-labels"
                className="max-w-xs"
              />
              <datalist id="scales-labels">
                {labels.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
              <Button type="submit" variant="outline" disabled={!label.trim()}>
                {t("scales.followup.open")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{t("scales.recent")}</h2>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/bandeja" search={{ m: "scales" }}>
                <Inbox className="mr-1 h-4 w-4" />
                {t("nav.inbox")}
              </Link>
            </Button>
          </div>
          {isLoading && <p className="text-sm text-muted-foreground">{t("list.loading")}</p>}
          {!isLoading && recent.length === 0 && <p className="text-sm text-muted-foreground">{t("scales.empty")}</p>}
          {recent.map((r) => (
            <AssessmentCard key={r.id} r={r} />
          ))}
        </section>

        <p className="text-xs text-muted-foreground">{t("scales.disclaimer")}</p>
      </main>
    </div>
  );
}
