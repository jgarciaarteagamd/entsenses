// "Send to patient": assigns the label first, then shares a single-use link by the doctor's own
// e-mail client, the clipboard or the device share sheet. The e-mail address is never stored.
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, Mail, Send, Share2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/modules/quest/i18n";
import {
  INVITATION_DAYS,
  createInvitation,
  getSavedGmailAccount,
  invitationEmail,
  invitationGmailUrl,
  invitationUrl,
  saveGmailAccount,
  type InvitationRow,
} from "@/modules/quest/lib/invitations.functions";

export function SendToPatientDialog({
  slug,
  variant,
  questionnaireName,
  size = "sm",
}: {
  slug: string;
  variant?: string | null;
  questionnaireName: string;
  size?: "sm" | "default";
}) {
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationRow | null>(null);
  const [copied, setCopied] = useState(false);
  const [gmailAccount, setGmailAccount] = useState(() => (typeof window === "undefined" ? "" : getSavedGmailAccount()));

  const url = invitation ? invitationUrl(invitation.token) : "";
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  function reset() {
    setLabel("");
    setEmail("");
    setError(null);
    setInvitation(null);
    setCopied(false);
  }

  async function create() {
    setCreating(true);
    setError(null);
    try {
      const inv = await createInvitation({ slug, variant, label });
      setInvitation(inv);
      void qc.invalidateQueries({ queryKey: ["invitations"] });
    } catch (e) {
      console.error("[invitation] create", e);
      setError(t("invite.error"));
    } finally {
      setCreating(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error("[invitation] copy", e);
    }
  }

  async function share() {
    try {
      await navigator.share({ title: questionnaireName, text: t("invite.share_text", questionnaireName), url });
    } catch {
      // cancelled by the user
    }
  }

  const emailOpts = invitation ? { lang, questionnaireName, url, expiresAt: invitation.expires_at, to: email } : null;
  const mailto = emailOpts ? invitationEmail(emailOpts) : "#";
  const gmail = emailOpts ? invitationGmailUrl({ ...emailOpts, account: gmailAccount }) : "#";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size={size}>
          <Send className="mr-2 h-4 w-4" />
          {t("invite.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("invite.title")}</DialogTitle>
          <DialogDescription>{questionnaireName}</DialogDescription>
        </DialogHeader>

        {!invitation ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (label.trim()) void create();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="invite-label">{t("invite.label")}</Label>
              <Input
                id="invite-label"
                value={label}
                onChange={(e) => setLabel(e.target.value.slice(0, 60))}
                placeholder={t("inbox.label.placeholder")}
                maxLength={60}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">{t("invite.label_hint")}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">{t("invite.email")}</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="paciente@ejemplo.com"
                autoComplete="off"
              />
              <p className="flex gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                {t("invite.email_hint")}
              </p>
            </div>
            {error && <p className="rounded border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={!label.trim() || creating}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {t("invite.create")}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              {t("invite.ready", invitation.label, String(INVITATION_DAYS))}
            </p>
            <Input value={url} readOnly onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
            <div className="grid gap-2">
              <Button asChild>
                <a href={gmail} target="_blank" rel="noopener noreferrer" onClick={() => saveGmailAccount(gmailAccount)}>
                  <Mail className="mr-2 h-4 w-4" />
                  {t("invite.open_gmail")}
                </a>
              </Button>
              <div className="space-y-1">
                <Label htmlFor="invite-gmail" className="text-xs font-normal text-muted-foreground">
                  {t("invite.gmail_account")}
                </Label>
                <Input
                  id="invite-gmail"
                  type="email"
                  value={gmailAccount}
                  onChange={(e) => setGmailAccount(e.target.value)}
                  onBlur={() => saveGmailAccount(gmailAccount)}
                  placeholder="usuario@gmail.com"
                  className="h-8 text-sm"
                />
              </div>
              <Button variant="outline" asChild>
                <a href={mailto}>
                  <Mail className="mr-2 h-4 w-4" />
                  {t("invite.open_email")}
                </a>
              </Button>
              <Button variant="outline" onClick={copy}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? t("invite.copied") : t("invite.copy")}
              </Button>
              {canShare && (
                <Button variant="outline" onClick={share}>
                  <Share2 className="mr-2 h-4 w-4" />
                  {t("invite.share")}
                </Button>
              )}
            </div>
            <Button variant="ghost" size="sm" className="w-full" onClick={reset}>
              {t("invite.another")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
