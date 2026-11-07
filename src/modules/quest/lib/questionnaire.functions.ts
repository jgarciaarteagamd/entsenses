// Read-only access to the questionnaire catalogue (public data protected by RLS).
// Functions keep the `{ data }` call shape used throughout the routes.
import { supabase } from "@/modules/quest/lib/supabase";

export async function getSpecialties() {
  const { data, error } = await supabase.from("specialties").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getSubspecialties() {
  const { data, error } = await supabase.from("subspecialties").select("*, specialties(name, slug)").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getQuestionnaires(_?: unknown) {
  const { data, error } = await supabase
    .from("questionnaires")
    .select("*, specialties(name, slug), subspecialties(name, slug)")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getQuestionnaireBySlug({ data: slug }: { data: string }) {
  const { data, error } = await supabase
    .from("questionnaires")
    .select("*, interpretations(*), specialties(name, slug), subspecialties(name, slug)")
    .eq("slug", slug)
    .single();
  if (error) throw error;

  // Fallback: build structure from relational questions/options if JSONB is missing
  if (!data?.structure) {
    const { data: questions } = await supabase
      .from("questions")
      .select("*, question_options(*)")
      .eq("questionnaire_id", data.id)
      .order("order_index");
    if (questions && questions.length > 0) {
      (data as any).structure = {
        slug,
        items: questions.map((q: any) => ({
          text: q.text,
          options: (q.question_options ?? [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((o: any) => ({ label: o.label, value: o.value })),
        })),
      };
    }
  }
  return data;
}

export async function searchByDiagnosis({ data: raw }: { data: string }) {
  const query = raw.trim().toLowerCase().replace(/[%,()]/g, " ").trim();
  if (!query) return [];

  const { data: keywords, error: kwError } = await supabase
    .from("diagnostic_keywords")
    .select("questionnaire_id, weight")
    .ilike("keyword", `%${query}%`);
  if (kwError) throw kwError;

  const scores = new Map<string, number>();
  for (const k of keywords ?? []) {
    scores.set(k.questionnaire_id, (scores.get(k.questionnaire_id) ?? 0) + (k.weight ?? 1));
  }

  const ids = Array.from(scores.keys());
  if (ids.length === 0) {
    const { data: fallback } = await supabase
      .from("questionnaires")
      .select("*")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq("is_active", true)
      .limit(10);
    return fallback ?? [];
  }

  const { data: questionnaires, error: qError } = await supabase
    .from("questionnaires")
    .select("*, specialties(name, slug), subspecialties(name, slug)")
    .in("id", ids)
    .eq("is_active", true);
  if (qError) throw qError;

  const result = (questionnaires ?? []).map((q) => ({ ...q, relevance: scores.get(q.id) ?? 0 }));
  result.sort((a, b) => b.relevance - a.relevance);
  return result;
}
