import { useLang } from "@/lib/i18n";

/** ENT Senses logo: the three-circle symbol plus the wordmark (images in public/brand). */
export function Brand({ suffix }: { suffix?: string }) {
  const { t } = useLang();
  return (
    <span className="flex items-center gap-2">
      <img src="/brand/entsenses-symbol.png" alt="" className="h-8 w-auto" />
      <img src="/brand/entsenses-wordmark.png" alt={t("app.name")} className="h-[15px] w-auto dark:brightness-150" />
      {suffix && <span className="hidden text-sm font-normal text-muted-foreground sm:inline">· {suffix}</span>}
    </span>
  );
}
