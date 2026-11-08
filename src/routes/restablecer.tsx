import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicHeader } from "@/components/PublicHeader";
import { useLang } from "@/lib/i18n";

// Landing page of the password-reset e-mail: Supabase signs the user in from the link (recovery
// session) and here they choose a new password.
export const Route = createFileRoute("/restablecer")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "ready" | "invalid">("checking");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (/error=/.test(window.location.hash) || /error=/.test(window.location.search)) {
      setState("invalid");
      return;
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) setState("ready");
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setState("ready");
    });
    const timer = setTimeout(() => setState((s) => (s === "checking" ? "invalid" : s)), 5000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pass.length < 8) return setError(t("auth.pass_short"));
    if (pass !== pass2) return setError(t("auth.pass_mismatch"));
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pass });
    setSaving(false);
    if (error) return setError(error.message);
    toast.success(t("auth.reset_done"));
    navigate({ to: "/panel" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <PublicHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-xl">{t("auth.reset_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {state === "checking" && (
              <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("auth.reset_checking")}
              </p>
            )}
            {state === "invalid" && (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">{t("auth.reset_invalid")}</p>
                <Button variant="outline" onClick={() => navigate({ to: "/auth" })}>
                  {t("auth.back_signin")}
                </Button>
              </div>
            )}
            {state === "ready" && (
              <form onSubmit={save} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rp-pass">{t("auth.reset_new")}</Label>
                  <Input id="rp-pass" type="password" value={pass} onChange={(e) => setPass(e.target.value)} required autoComplete="new-password" autoFocus />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rp-pass2">{t("auth.password2")}</Label>
                  <Input id="rp-pass2" type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} required autoComplete="new-password" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("auth.reset_save")}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
