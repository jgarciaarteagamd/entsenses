ALTER TABLE public.questionnaires ADD COLUMN IF NOT EXISTS structure jsonb;

GRANT SELECT ON public.questionnaires TO authenticated;
GRANT SELECT ON public.questionnaires TO anon;
GRANT ALL ON public.questionnaires TO service_role;

CREATE OR REPLACE FUNCTION public.calculate_questionnaire_score(
  questionnaire_slug text,
  answers integer[]
) RETURNS TABLE(total_score integer, category text, description text, color text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q_id uuid;
  score integer := 0;
BEGIN
  SELECT id INTO q_id FROM public.questionnaires WHERE slug = questionnaire_slug;
  
  -- Sum all answers
  SELECT COALESCE(SUM(val), 0) INTO score FROM UNNEST(answers) AS val;
  
  total_score := score;
  
  -- Find matching interpretation
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
$$;