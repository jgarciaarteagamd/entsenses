// Shared helpers for identifiers and labels (all modules).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string) => UUID_RE.test(v);

/** Labels are the doctor's pseudonymous tag for a patient (initials / record number), max 60 chars. */
export function sanitizeLabel(label: string | null | undefined): string | null {
  if (!label) return null;
  const t = label.trim().slice(0, 60);
  return t.length ? t : null;
}
