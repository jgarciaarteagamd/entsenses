import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/modules/quest/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLang } from "@/modules/quest/i18n";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Comentarios y sugerencias — ENT Senses" },
      { name: "description", content: "Envíanos tus comentarios, sugerencias o incidencias sobre ENT Senses." },
    ],
  }),
  component: FeedbackPage,
});

type Category = "general" | "bug" | "suggestion" | "question" | "other";

function FeedbackPage() {
  const { lang, setLang, t } = useLang();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error: insErr } = await supabase.from("feedback").insert({
        name: name.trim() || null,
        email: email.trim() || null,
        category,
        message: message.trim(),
        language: lang,
      });
      if (insErr) throw insErr;
      setSubmitted(true);
    } catch (err) {
      console.error("[feedback] insert error", err);
      setError(t("feedback.error"));
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setName("");
    setEmail("");
    setCategory("general");
    setMessage("");
    setSubmitted(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-primary">
            <span>{t("app.name")}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLang(lang === "es" ? "en" : "es")}
              className="px-2 text-xs font-semibold uppercase tracking-wide"
            >
              {lang}
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/">
                <ArrowLeft className="mr-1 h-4 w-4" /> {t("legal.back")}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        {submitted ? (
          <Card>
            <CardContent className="space-y-4 pt-8 pb-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
              <h1 className="text-xl font-semibold">{t("feedback.done.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("feedback.done.body")}</p>
              <Button variant="outline" onClick={resetForm}>
                {t("feedback.new")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t("feedback.title")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("feedback.subtitle")}</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fb-name">{t("feedback.name")}</Label>
                    <Input
                      id="fb-name"
                      value={name}
                      maxLength={120}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fb-email">{t("feedback.email")}</Label>
                    <Input
                      id="fb-email"
                      type="email"
                      value={email}
                      maxLength={254}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fb-cat">{t("feedback.category")}</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                    <SelectTrigger id="fb-cat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">{t("feedback.cat.general")}</SelectItem>
                      <SelectItem value="bug">{t("feedback.cat.bug")}</SelectItem>
                      <SelectItem value="suggestion">{t("feedback.cat.suggestion")}</SelectItem>
                      <SelectItem value="question">{t("feedback.cat.question")}</SelectItem>
                      <SelectItem value="other">{t("feedback.cat.other")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fb-msg">{t("feedback.message")}</Label>
                  <Textarea
                    id="fb-msg"
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 5000))}
                    placeholder={t("feedback.message_placeholder")}
                    rows={7}
                    required
                    maxLength={5000}
                  />
                  <p className="text-right text-xs text-muted-foreground">{message.length}/5000</p>
                </div>

                {error && (
                  <p className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </p>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={submitting || !message.trim()}>
                    {submitting ? t("feedback.sending") : t("feedback.submit")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="border-t bg-background py-6 text-center text-xs text-muted-foreground">
        <Link to="/legal/terminos" className="hover:underline">{t("landing.legal.terms")}</Link>
        {" · "}
        <Link to="/legal/privacidad" className="hover:underline">{t("landing.legal.privacy")}</Link>
      </footer>
    </div>
  );
}
