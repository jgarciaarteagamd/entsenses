// E-mail to the doctor when a patient sends a result. Called only by the database trigger
// private.notify_patient_submission (supabase/migrations/20261113000000_submission_notifications.sql)
// through pg_net, with the shared secret in the x-notify-secret header.
//
// Netlify environment variables:
//   NOTIFY_SECRET    same value as private.notification_settings.secret (≥ 32 characters)
//   RESEND_API_KEY   API key of https://resend.com (the domain of NOTIFY_FROM must be verified there)
//   NOTIFY_FROM      sender, e.g. "ENT Senses <avisos@entsenses.app>"
//   VITE_PUBLIC_ORIGIN (optional) origin of the app for the link; defaults to Netlify's URL.
//
// The e-mail carries no patient data beyond what the inbox shows: module, questionnaire and score,
// and the doctor's own label (e-mail invitations). Patients are anonymous.

declare const Netlify: { env: { get(key: string): string | undefined } };

type Module = "quest" | "voice" | "hearing";
interface Payload {
  to: string;
  lang?: string;
  module: Module;
  id?: string;
  label?: string | null;
  created_at?: string;
  detail?: { questionnaire?: string | null; score?: number | null; category?: string | null };
}

const TEXT = {
  es: {
    quest: "Nuevo cuestionario",
    voice: "Nuevo análisis de voz",
    hearing: "Nueva prueba de audición",
    intro: "Un paciente ha enviado un resultado a su bandeja de ENT Senses.",
    questionnaire: "Cuestionario",
    score: "Puntuación",
    label: "Etiqueta",
    date: "Fecha",
    open: "Abrir la bandeja",
    hearingNote: "Prueba informativa hecha con el dispositivo del paciente (no calibrada).",
    footer: "Puede desactivar estos avisos en ENT Senses → Configuración.",
  },
  en: {
    quest: "New questionnaire",
    voice: "New voice analysis",
    hearing: "New hearing check",
    intro: "A patient has sent a result to your ENT Senses inbox.",
    questionnaire: "Questionnaire",
    score: "Score",
    label: "Label",
    date: "Date",
    open: "Open the inbox",
    hearingNote: "Informative check on the patient's own device (not calibrated).",
    footer: "You can turn these e-mails off in ENT Senses → Settings.",
  },
} as const;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function sameSecret(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function isPayload(p: unknown): p is Payload {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.to === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.to) &&
    (o.module === "quest" || o.module === "voice" || o.module === "hearing")
  );
}

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const secret = Netlify.env.get("NOTIFY_SECRET");
  const apiKey = Netlify.env.get("RESEND_API_KEY");
  const from = Netlify.env.get("NOTIFY_FROM");
  if (!secret || secret.length < 32 || !apiKey || !from) {
    console.error("[notify-submission] NOTIFY_SECRET, RESEND_API_KEY or NOTIFY_FROM is missing");
    return new Response("missing configuration", { status: 500 });
  }
  if (!sameSecret(req.headers.get("x-notify-secret") ?? "", secret)) {
    return new Response("forbidden", { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }
  if (!isPayload(body)) return new Response("bad request", { status: 400 });

  const lang = body.lang === "en" ? "en" : "es";
  const t = TEXT[lang];
  const origin = (Netlify.env.get("VITE_PUBLIC_ORIGIN") || Netlify.env.get("URL") || "https://entsenses.app").replace(/\/+$/, "");
  const link = `${origin}/bandeja?m=${body.module}`;

  const rows: [string, string][] = [];
  const d = body.detail ?? {};
  if (body.module === "quest" && d.questionnaire) rows.push([t.questionnaire, d.questionnaire]);
  if (body.module === "quest" && typeof d.score === "number")
    rows.push([t.score, d.category ? `${d.score} · ${d.category}` : String(d.score)]);
  if (body.label) rows.push([t.label, body.label]);
  if (body.created_at) {
    const when = new Date(body.created_at);
    if (!Number.isNaN(when.getTime()))
      rows.push([t.date, when.toLocaleString(lang === "es" ? "es-ES" : "en-GB", { timeZone: "Europe/Madrid", dateStyle: "medium", timeStyle: "short" })]);
  }

  const subject = d.questionnaire ? `${t[body.module]}: ${d.questionnaire}` : t[body.module];
  const text = [
    t.intro,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    ...(body.module === "hearing" ? ["", t.hearingNote] : []),
    "",
    `${t.open}: ${link}`,
    "",
    t.footer,
  ].join("\n");
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.5;color:#111">
<h2 style="font-size:18px;margin:0 0 12px">${escapeHtml(t[body.module])}</h2>
<p style="margin:0 0 12px">${escapeHtml(t.intro)}</p>
${rows.length ? `<table style="border-collapse:collapse;margin:0 0 12px">${rows
    .map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#555">${escapeHtml(k)}</td><td style="padding:2px 0"><strong>${escapeHtml(v)}</strong></td></tr>`)
    .join("")}</table>` : ""}
${body.module === "hearing" ? `<p style="margin:0 0 12px;color:#555">${escapeHtml(t.hearingNote)}</p>` : ""}
<p style="margin:16px 0"><a href="${escapeHtml(link)}" style="background:#111;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">${escapeHtml(t.open)}</a></p>
<p style="margin:16px 0 0;color:#777;font-size:13px">${escapeHtml(t.footer)}</p>
</div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [body.to], subject, text, html }),
  });
  if (!res.ok) {
    console.error(`[notify-submission] Resend ${res.status} ${(await res.text()).slice(0, 200)}`);
    return new Response("send failed", { status: 502 });
  }
  console.log(`[notify-submission] sent (${body.module})`);
  return new Response("ok");
};
