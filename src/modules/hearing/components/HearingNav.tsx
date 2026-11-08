import { Link } from "@tanstack/react-router";
import { Ear, FileText, Gauge, Headphones } from "lucide-react";
import { useLang } from "@/modules/hearing/i18n";

/** Sub-navigation of ENT Senses Hearing: new report, audiometer, calibration. */
export function HearingNav() {
  const { t } = useLang();
  const items = [
    { to: "/hearing/consulta", icon: FileText, label: t("hearing.nav.report") },
    { to: "/hearing/audiometro", icon: Headphones, label: t("hearing.nav.audiometer") },
    { to: "/hearing/calibracion", icon: Gauge, label: t("hearing.nav.calibration") },
  ] as const;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
        <Ear className="h-4 w-4" />
        ENT Senses Hearing
      </span>
      <nav className="flex flex-wrap gap-1 rounded-lg border bg-background p-1">
        {items.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
            activeProps={{ className: "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground" }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
