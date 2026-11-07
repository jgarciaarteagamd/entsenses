// ENT Senses Quest uses the app's single Supabase client, typed with the Quest schema.
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase as core, supabaseAnon as coreAnon } from "@/lib/supabase";
import type { Database } from "./supabase-types";

export const supabase = core as unknown as SupabaseClient<Database>;
export const supabaseAnon = coreAnon as unknown as SupabaseClient<Database>;
export { isSupabaseConfigured };
