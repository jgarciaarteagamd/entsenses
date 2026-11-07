-- Tighten SECURITY DEFINER exposure: switch to INVOKER where possible and restrict EXECUTE.

-- calculate_questionnaire_score only reads public tables; INVOKER is safe and removes DEFINER exposure.
CREATE OR REPLACE FUNCTION public.calculate_questionnaire_score(questionnaire_slug text, answers integer[])
RETURNS TABLE(total_score integer, category text, description text, color text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  q_id uuid;
  score integer := 0;
BEGIN
  SELECT id INTO q_id FROM public.questionnaires WHERE slug = questionnaire_slug;
  SELECT COALESCE(SUM(val), 0) INTO score FROM UNNEST(answers) AS val;
  total_score := score;
  SELECT i.category, i.description, i.color
  INTO category, description, color
  FROM public.interpretations i
  WHERE i.questionnaire_id = q_id
    AND score >= i.min_score
    AND score <= i.max_score
  ORDER BY i.min_score DESC
  LIMIT 1;
  RETURN NEXT;
END;
$function$;

REVOKE ALL ON FUNCTION public.calculate_questionnaire_score(text, integer[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_questionnaire_score(text, integer[]) TO anon, authenticated, service_role;

-- doctor_exists must stay SECURITY DEFINER (reads auth.users), but restrict its exposed surface.
-- It's used only inside the RLS INSERT policy evaluated for anonymous patient submissions.
REVOKE ALL ON FUNCTION public.doctor_exists(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.doctor_exists(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.doctor_exists(uuid) TO anon;
