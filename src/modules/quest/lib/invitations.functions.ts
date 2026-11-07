// Patient invitations: a questionnaire link with the patient's label assigned before sending.
// The patient's e-mail address is never stored: it only pre-fills the doctor's own e-mail client.
import { supabase, supabaseAnon } from "@/modules/quest/lib/supabase";
import type { Lang } from "@/modules/quest/i18n";

export type InvitationStatus = "pending" | "completed" | "expired";

export interface InvitationRow {
  id: string;
  token: string;
  questionnaire_slug: string;
  variant: string | null;
  label: string;
  created_at: string;
  expires_at: string;
  completed_at: string | null;
  response_id: string | null;
}

export const INVITATION_DAYS = 14;

export function invitationStatus(r: Pick<InvitationRow, "completed_at" | "expires_at">, now = Date.now()): InvitationStatus {
  if (r.completed_at) return "completed";
  return new Date(r.expires_at).getTime() <= now ? "expired" : "pending";
}

export function publicOrigin(): string {
  const configured = import.meta.env.VITE_PUBLIC_ORIGIN?.replace(/\/+$/, "");
  return configured || (typeof window !== "undefined" ? window.location.origin : "");
}

export function invitationUrl(token: string): string {
  return `${publicOrigin()}/i/${token}`;
}

export function cleanInvitationLabel(label: string): string {
  return label.trim().slice(0, 60);
}

/** AUTH — creates an invitation and returns it (token included). */
export async function createInvitation(input: { slug: string; variant?: string | null; label: string }): Promise<InvitationRow> {
  const label = cleanInvitationLabel(input.label);
  if (!label) throw new Error("label required");
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Unauthorized");
  const { data, error } = await supabase
    .from("patient_invitations")
    .insert({ doctor_id: u.user.id, questionnaire_slug: input.slug, variant: input.variant ?? null, label })
    .select("*")
    .single();
  if (error) throw error;
  return data as InvitationRow;
}

export async function listMyInvitations(): Promise<InvitationRow[]> {
  const { data, error } = await supabase
    .from("patient_invitations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as InvitationRow[];
}

export async function deleteInvitation(id: string) {
  const { error } = await supabase.from("patient_invitations").delete().eq("id", id);
  if (error) throw error;
}

/** PUBLIC — what a token opens and whether it can still be answered (never the label). */
export async function getInvitation(token: string) {
  const { data, error } = await supabaseAnon.rpc("get_invitation", { _token: token });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? { slug: row.questionnaire_slug, variant: row.variant ?? undefined, status: row.status as InvitationStatus } : null;
}

/** PUBLIC — submits the answers through the invitation (single use). */
export async function submitInvitedResponse(token: string, answers: number[]) {
  const { data, error } = await supabaseAnon.rpc("submit_invited_response", { _token: token, _answers: answers });
  if (error) throw new Error(error.message);
  return data;
}

interface EmailOpts {
  lang: Lang;
  questionnaireName: string;
  url: string;
  expiresAt: string;
  to?: string;
}

/** Subject and body of the invitation e-mail. */
export function invitationMessage(opts: EmailOpts): { subject: string; body: string } {
  const date = new Date(opts.expiresAt).toLocaleDateString(opts.lang === "en" ? "en-GB" : "es-ES");
  const subject =
    opts.lang === "en" ? `Questionnaire: ${opts.questionnaireName}` : `Cuestionario: ${opts.questionnaireName}`;
  const body =
    opts.lang === "en"
      ? `Hello,\n\nPlease complete the questionnaire "${opts.questionnaireName}". Just open this link (valid until ${date}, single use):\n\n${opts.url}\n\nYour answers will reach me directly. No registration is needed.\n\nKind regards.`
      : `Hola:\n\nLe envío el cuestionario «${opts.questionnaireName}» para que lo responda. Solo tiene que abrir este enlace (válido hasta el ${date}, de un solo uso):\n\n${opts.url}\n\nSus respuestas me llegarán directamente. No es necesario registrarse.\n\nUn saludo.`;
  return { subject, body };
}

/** Pre-filled e-mail for the device's default e-mail app (mailto:). */
export function invitationEmail(opts: EmailOpts): string {
  const { subject, body } = invitationMessage(opts);
  const to = opts.to?.trim() ? encodeURIComponent(opts.to.trim()) : "";
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Gmail web compose window, pre-filled, in the browser (works without an e-mail app). With
 * `account`, Gmail opens that signed-in Google account; otherwise the browser's default one.
 * Nothing is sent automatically: the doctor reviews and presses Send.
 */
export function invitationGmailUrl(opts: EmailOpts & { account?: string }): string {
  const { subject, body } = invitationMessage(opts);
  const params = new URLSearchParams({ view: "cm", fs: "1", su: subject, body });
  if (opts.to?.trim()) params.set("to", opts.to.trim());
  if (opts.account?.trim()) params.set("authuser", opts.account.trim());
  return `https://mail.google.com/mail/?${params.toString()}`;
}

const GMAIL_ACCOUNT_KEY = "entsenses.gmailAccount";

/** Gmail account to send from, remembered on this browser only (never sent to the server). */
export function getSavedGmailAccount(): string {
  try {
    return window.localStorage.getItem(GMAIL_ACCOUNT_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveGmailAccount(account: string) {
  try {
    if (account.trim()) window.localStorage.setItem(GMAIL_ACCOUNT_KEY, account.trim());
    else window.localStorage.removeItem(GMAIL_ACCOUNT_KEY);
  } catch {
    // ignore (private mode)
  }
}
