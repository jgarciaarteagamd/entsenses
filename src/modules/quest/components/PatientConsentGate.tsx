import { useId, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useLang } from "@/modules/quest/i18n";

/**
 * Consent screen shown to patients before they start a questionnaire opened
 * from a doctor's QR / link. The patient must tick the checkbox (accepting the
 * Terms of use and Privacy policy) before the "Accept" button is enabled.
 */
export function PatientConsentGate({ onAccept }: { onAccept: () => void }) {
  const { t } = useLang();
  const [checked, setChecked] = useState(false);
  const checkboxId = useId();

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 shrink-0 text-emerald-600" />
          <h2 className="text-lg font-semibold">{t("consent.title")}</h2>
        </div>

        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>{t("consent.body.anonymous")}</p>
          <p>{t("consent.body.no_identifiers")}</p>
          <p>{t("consent.body.doctor_only")}</p>
        </div>

        <div className="flex items-start gap-3 rounded-lg border p-3">
          <Checkbox
            id={checkboxId}
            checked={checked}
            onCheckedChange={(v) => setChecked(Boolean(v))}
            className="mt-0.5"
          />
          <label htmlFor={checkboxId} className="cursor-pointer text-sm leading-5">
            {t("consent.accept_prefix")}{" "}
            <Link
              to="/legal/terminos"
              target="_blank"
              rel="noopener"
              className="font-medium underline hover:text-primary"
            >
              {t("consent.terms_link")}
            </Link>{" "}
            {t("consent.and")}{" "}
            <Link
              to="/legal/privacidad"
              target="_blank"
              rel="noopener"
              className="font-medium underline hover:text-primary"
            >
              {t("consent.privacy_link")}
            </Link>
            .
          </label>
        </div>

        <Button className="w-full" size="lg" disabled={!checked} onClick={onAccept}>
          {t("consent.accept_button")}
        </Button>
      </CardContent>
    </Card>
  );
}
