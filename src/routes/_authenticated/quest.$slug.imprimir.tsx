import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/modules/quest/lib/supabase";
import { getQuestionnaireBySlug } from "@/modules/quest/lib/questionnaire.functions";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLang } from "@/modules/quest/i18n";
import { getLocalisedQuestionnaire } from "@/modules/quest/lib/questionnaire-i18n";
import { normaliseVariantId, resolveVariant, GENERIC_VARIANT_ID } from "@/modules/quest/lib/questionnaire-variants";
import { QUESTIONNAIRE_STUDIES } from "@/modules/quest/lib/questionnaire-studies";
import { SendToPatientDialog } from "@/modules/quest/components/SendToPatientDialog";


export const Route = createFileRoute("/_authenticated/quest/$slug/imprimir")({
  validateSearch: (search: Record<string, unknown>): { v?: string } => ({
    v: normaliseVariantId(typeof search.v === "string" ? search.v : undefined),
  }),
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["questionnaire", params.slug],
      queryFn: () => getQuestionnaireBySlug({ data: params.slug }),
    });
  },
  component: PrintPage,
});

function PrintPage() {
  const { slug } = Route.useParams();
  const { v: variantId } = Route.useSearch();
  const { lang, setLang, t } = useLang();
  const { data: questionnaire } = useSuspenseQuery({
    queryKey: ["questionnaire", slug],
    queryFn: () => getQuestionnaireBySlug({ data: slug }),
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [patientUrl, setPatientUrl] = useState<string>("");
  const [isPreviewOrigin, setIsPreviewOrigin] = useState(false);
  const activeVariant = resolveVariant(slug, variantId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const doctorId = data.user?.id;
      if (!doctorId) return;
      const configured = import.meta.env.VITE_PUBLIC_ORIGIN?.replace(/\/+$/, "");
      const publicOrigin = configured || (typeof window !== "undefined" ? window.location.origin : "");
      setIsPreviewOrigin(false);
      // Only encode ?v= for non-generic (and only in Spanish, since EN never
      // exposes variants); patient page defaults to generic when absent.
      const vQuery =
        lang === "es" && activeVariant.id !== GENERIC_VARIANT_ID ? `?v=${encodeURIComponent(activeVariant.id)}` : "";
      const url = `${publicOrigin}/p/${doctorId}/quest/${slug}${vQuery}`;
      if (cancelled) return;
      setPatientUrl(url);
      const png = await QRCode.toDataURL(url, { margin: 1, width: 220 });
      if (!cancelled) setQrDataUrl(png);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, lang, activeVariant.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!qrDataUrl) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("print") === "1") {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [qrDataUrl]);

  const structure = questionnaire?.structure as any;
  const rawItems: any[] = structure?.items ?? [];
  const localised = getLocalisedQuestionnaire(slug, lang, questionnaire.name, questionnaire.description, rawItems, variantId);
  const items = localised.items;


  return (
    <div className="min-h-screen bg-muted/30 print:bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-4 print:hidden">
        <Button variant="ghost" asChild size="sm">
          <Link to="/quest/$slug" params={{ slug }} search={variantId ? { v: variantId } : {}}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("print.back")}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            className="px-2 text-xs font-semibold uppercase tracking-wide"
          >
            {lang}
          </Button>
          <SendToPatientDialog
            slug={slug}
            variant={lang === "es" && activeVariant.id !== GENERIC_VARIANT_ID ? activeVariant.id : null}
            questionnaireName={localised.name}
          />
          <Button
            onClick={() => {
              const inIframe = typeof window !== "undefined" && window.self !== window.top;
              if (inIframe) {
                window.open(window.location.href + "?print=1", "_blank");
              } else {
                window.print();
              }
            }}
            size="sm"
          >
            <Printer className="mr-2 h-4 w-4" />
            {t("form.print")}
          </Button>
        </div>
      </div>

      {isPreviewOrigin && (
        <div className="mx-auto mb-4 max-w-3xl rounded border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900 print:hidden">
          {t("print.preview_warning")}
        </div>
      )}

      <main className="mx-auto max-w-3xl bg-white px-8 pb-12 pt-6 shadow-sm print:max-w-none print:px-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b pb-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("print.header_kicker")}</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight">{localised.name}</h1>
            {localised.description && (
              <p className="mt-1 text-sm text-muted-foreground">{localised.description}</p>
            )}
          </div>
          <div className="flex flex-col items-center text-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR code" className="h-28 w-28" />
            ) : (
              <div className="h-28 w-28 animate-pulse rounded bg-muted" />
            )}
            <p className="mt-1 text-[10px] leading-tight text-muted-foreground">
              {t("print.qr_hint")}
            </p>
          </div>
        </header>

        <section className="mt-5 rounded border bg-muted/40 p-3 text-sm print:bg-transparent">
          <p className="font-medium">{t("print.instructions.title")}</p>
          <p className="mt-1 text-muted-foreground">{t("print.instructions.body")}</p>
        </section>

        <section className="mt-6 space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="break-inside-avoid rounded border border-gray-300 p-3">
              <p className="text-sm font-medium">
                {idx + 1}. {item.text}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {item.options.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-1.5 text-sm">
                    <span className="inline-block h-3.5 w-3.5 border border-gray-500" />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </section>

        <footer className="mt-6 border-t pt-3 text-[10px] text-muted-foreground">
          {(() => {
            const study = QUESTIONNAIRE_STUDIES[slug];
            const originalCitation = study?.study?.[lang];
            if (lang === "en") {
              return originalCitation ? <p>{originalCitation}</p> : null;
            }
            // Spanish
            if (activeVariant.id === GENERIC_VARIANT_ID) {
              return originalCitation ? (
                <p>
                  <span className="font-medium">{t("print.footer.generic")}</span> {originalCitation}
                </p>
              ) : null;
            }
            const validation =
              activeVariant.validationIndex !== undefined
                ? study?.spanishValidations?.[activeVariant.validationIndex]
                : undefined;
            const adaptedCitation = validation?.citation?.[lang];
            return (
              <>
                <p>
                  <span className="font-medium">
                    {t("print.footer.adapted", questionnaire.name)}
                  </span>{" "}
                  {adaptedCitation ?? originalCitation}
                </p>
                {adaptedCitation && originalCitation && (
                  <p className="mt-1">{originalCitation}</p>
                )}
              </>
            );
          })()}
        </footer>

      </main>

      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body { background: #ffffff !important; color: #000000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:bg-white, main, header, section, footer, div, p, h1, h2, h3, span, label { color: #111 !important; }
          .text-muted-foreground { color: #555 !important; }
          .border, .border-b, .border-t, .rounded, [class*="border-"] { border-color: #999 !important; }
          img { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
