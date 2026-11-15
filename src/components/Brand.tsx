import { useLang } from "@/lib/i18n";

/** ENT Senses logo: the horizontal wordmark (black; inverted in dark mode). Images in public/brand. */
export function Brand({ suffix }: { suffix?: string }) {
  const { t } = useLang();
  return (
    <span className="flex items-center gap-2">
      <img src="/brand/entsenses-horizontal.svg" alt={t("app.name")} className="h-6 w-auto dark:invert" />
      {suffix && <span className="hidden text-sm font-normal text-muted-foreground sm:inline">· {suffix}</span>}
    </span>
  );
}
