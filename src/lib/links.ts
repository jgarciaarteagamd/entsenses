import type { ModuleId } from "@/modules/registry";

/** Public origin used for patient links / QR codes. */
export function publicOrigin(): string {
  const configured = import.meta.env.VITE_PUBLIC_ORIGIN?.replace(/\/+$/, "");
  if (configured) return configured;
  return typeof window !== "undefined" ? window.location.origin : "";
}

/** Patient link of a module for this doctor, e.g. https://entsenses.app/p/<id>/hearing */
export function patientUrl(doctorId: string, module: ModuleId, rest = ""): string {
  return `${publicOrigin()}/p/${doctorId}/${module}${rest ? `/${rest.replace(/^\/+/, "")}` : ""}`;
}
