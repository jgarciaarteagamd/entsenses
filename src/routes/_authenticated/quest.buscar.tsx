import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { searchByDiagnosis } from "@/modules/quest/lib/questionnaire.functions";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useLang } from "@/modules/quest/i18n";
import { getLocalisedQuestionnaire } from "@/modules/quest/lib/questionnaire-i18n";

export const Route = createFileRoute("/_authenticated/quest/buscar")({
  component: DashboardPage,
});

function DashboardPage() {
  const { lang, t } = useLang();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const searchFn = searchByDiagnosis;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await searchFn({ data: query });
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>

        <form onSubmit={handleSearch} className="mt-8 flex gap-2">
          <Input
            placeholder={t("dashboard.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 flex-1"
          />
          <Button type="submit" size="lg" disabled={loading}>
            <Search className="mr-2 h-4 w-4" />
            {t("dashboard.search")}
          </Button>
        </form>

        <div className="mt-8 space-y-3">
          {results.length > 0 && (
            <p className="text-sm font-medium text-muted-foreground">
              {results.length} {t("dashboard.results")}
            </p>
          )}
          {results.map((q: any) => {
            const loc = getLocalisedQuestionnaire(q.slug, lang, q.name, q.description, []);
            return (
              <Link
                key={q.id}
                to="/quest/$slug"
                params={{ slug: q.slug }}
                className="block transition-opacity hover:opacity-80"
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{loc.name}</CardTitle>
                      {q.subspecialties?.name && (
                        <Badge variant="secondary">{q.subspecialties.name}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{loc.description}</p>
                    {q.reference && (
                      <p className="mt-2 text-xs text-muted-foreground">Ref: {q.reference}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
