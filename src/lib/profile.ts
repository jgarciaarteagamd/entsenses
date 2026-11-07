import { supabase } from "./supabase";
import type { Professional } from "@/modules/hearing/components/ReportEditor";

/** Doctor's name and licence from their profile, used as defaults for the report signature. */
export async function getProfessionalDefaults(): Promise<Professional> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { name: "", profession: "", license: "" };
  const { data } = await supabase
    .from("doctor_profiles")
    .select("first_name,last_name,license_number")
    .eq("id", u.user.id)
    .maybeSingle();
  const name = [data?.first_name, data?.last_name].filter(Boolean).join(" ");
  return { name: name ? `Dr/a. ${name}` : "", profession: "", license: data?.license_number ?? "" };
}

/** Ensures the doctor's profile row exists (created from sign-up metadata on first login). */
export async function ensureProfile() {
  const { data: u } = await supabase.auth.getUser();
  const user = u.user;
  if (!user) return;
  const { data } = await supabase.from("doctor_profiles").select("id").eq("id", user.id).maybeSingle();
  if (data) return;
  const md = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const now = new Date().toISOString();
  await supabase.from("doctor_profiles").upsert({
    id: user.id,
    first_name: md.first_name ?? null,
    last_name: md.last_name ?? null,
    license_number: md.license_number ?? null,
    terms_accepted_at: md.terms_accepted_at ?? now,
    professional_declaration_at: md.professional_declaration_at ?? now,
    profile_completed: Boolean(md.first_name && md.license_number),
  });
}
