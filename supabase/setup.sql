-- ENT Senses — complete database setup for a NEW Supabase project.
-- Generated from supabase/migrations by `npm run db:setup`. Do not edit by hand.
-- Paste the whole file into Supabase → SQL Editor → New query → Run (once).

-- ===== 20260708194115_5bbaac29-5748-4249-89ef-79d1ac4c0ca4.sql =====
CREATE TABLE public.specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.subspecialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty_id uuid NOT NULL REFERENCES public.specialties(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(specialty_id, slug)
);

CREATE TABLE public.questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  specialty_id uuid REFERENCES public.specialties(id) ON DELETE SET NULL,
  subspecialty_id uuid REFERENCES public.subspecialties(id) ON DELETE SET NULL,
  scoring_type text NOT NULL DEFAULT 'sum',
  max_score integer,
  reference text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  text text NOT NULL,
  question_type text NOT NULL DEFAULT 'single_choice',
  order_index integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  label text NOT NULL,
  value integer NOT NULL DEFAULT 0,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.scoring_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  rule_type text NOT NULL DEFAULT 'total_sum',
  config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.interpretations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  min_score integer NOT NULL,
  max_score integer NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  color text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.diagnostic_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  questionnaire_id uuid NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  weight integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.specialties TO authenticated;
GRANT SELECT ON public.specialties TO anon;
GRANT ALL ON public.specialties TO service_role;

GRANT SELECT ON public.subspecialties TO authenticated;
GRANT SELECT ON public.subspecialties TO anon;
GRANT ALL ON public.subspecialties TO service_role;

GRANT SELECT ON public.questionnaires TO authenticated;
GRANT SELECT ON public.questionnaires TO anon;
GRANT ALL ON public.questionnaires TO service_role;

GRANT SELECT ON public.questions TO authenticated;
GRANT SELECT ON public.questions TO anon;
GRANT ALL ON public.questions TO service_role;

GRANT SELECT ON public.question_options TO authenticated;
GRANT SELECT ON public.question_options TO anon;
GRANT ALL ON public.question_options TO service_role;

GRANT SELECT ON public.scoring_rules TO authenticated;
GRANT SELECT ON public.scoring_rules TO anon;
GRANT ALL ON public.scoring_rules TO service_role;

GRANT SELECT ON public.interpretations TO authenticated;
GRANT SELECT ON public.interpretations TO anon;
GRANT ALL ON public.interpretations TO service_role;

GRANT SELECT ON public.diagnostic_keywords TO authenticated;
GRANT SELECT ON public.diagnostic_keywords TO anon;
GRANT ALL ON public.diagnostic_keywords TO service_role;

ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subspecialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interpretations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read specialties" ON public.specialties FOR SELECT USING (true);
CREATE POLICY "Anyone can read subspecialties" ON public.subspecialties FOR SELECT USING (true);
CREATE POLICY "Anyone can read questionnaires" ON public.questionnaires FOR SELECT USING (true);
CREATE POLICY "Anyone can read questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Anyone can read question options" ON public.question_options FOR SELECT USING (true);
CREATE POLICY "Anyone can read scoring rules" ON public.scoring_rules FOR SELECT USING (true);
CREATE POLICY "Anyone can read interpretations" ON public.interpretations FOR SELECT USING (true);
CREATE POLICY "Anyone can read diagnostic keywords" ON public.diagnostic_keywords FOR SELECT USING (true);

-- ===== 20260708194425_7974f082-dbed-4666-b1c6-4cfb817ee642.sql =====
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

-- ===== 20260708194440_cdc32a7a-a48d-4bb8-9c82-776a6ebdc15b.sql =====
CREATE OR REPLACE FUNCTION public.calculate_questionnaire_score(
  questionnaire_slug text,
  answers integer[]
) RETURNS TABLE(total_score integer, category text, description text, color text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
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
$$;

-- ===== 20260708195054_65be38e2-593d-4557-b006-8e1c3dd4496b.sql =====
UPDATE public.questionnaires SET structure = '{"slug":"eat-10","items":[{"text":"1. Problemas para deglutir sólidos","options":[{"label":"Ningún problema","value":0},{"label":"Problema leve","value":1},{"label":"Problema moderado","value":2},{"label":"Problema grave","value":3}]},{"text":"2. Problemas para deglutir líquidos","options":[{"label":"Ningún problema","value":0},{"label":"Problema leve","value":1},{"label":"Problema moderado","value":2},{"label":"Problema grave","value":3}]},{"text":"3. Tos o atragantamiento al comer","options":[{"label":"Ningún problema","value":0},{"label":"Problema leve","value":1},{"label":"Problema moderado","value":2},{"label":"Problema grave","value":3}]},{"text":"4. Estridores al respirar","options":[{"label":"Ningún problema","value":0},{"label":"Problema leve","value":1},{"label":"Problema moderado","value":2},{"label":"Problema grave","value":3}]},{"text":"5. Dificultad para respirar durante las comidas","options":[{"label":"Ningún problema","value":0},{"label":"Problema leve","value":1},{"label":"Problema moderado","value":2},{"label":"Problema grave","value":3}]},{"text":"6. Acumulación de secreciones en la garganta","options":[{"label":"Ningún problema","value":0},{"label":"Problema leve","value":1},{"label":"Problema moderado","value":2},{"label":"Problema grave","value":3}]},{"text":"7. Sensación de que los alimentos se atoran","options":[{"label":"Ningún problema","value":0},{"label":"Problema leve","value":1},{"label":"Problema moderado","value":2},{"label":"Problema grave","value":3}]},{"text":"8. Dolor al tragar","options":[{"label":"Ningún problema","value":0},{"label":"Problema leve","value":1},{"label":"Problema moderado","value":2},{"label":"Problema grave","value":3}]},{"text":"9. Pérdida de peso inexplicada","options":[{"label":"Ningún problema","value":0},{"label":"Problema leve","value":1},{"label":"Problema moderado","value":2},{"label":"Problema grave","value":3}]},{"text":"10. Evita ciertos alimentos por dificultad para tragar","options":[{"label":"Ningún problema","value":0},{"label":"Problema leve","value":1},{"label":"Problema moderado","value":2},{"label":"Problema grave","value":3}]}]}'::jsonb WHERE slug = 'eat-10';

-- ===== 20260708195107_582d92b7-7d00-453d-a6f3-cd709def4d3e.sql =====
UPDATE public.questionnaires SET structure = '{"slug":"etdq-7","items":[{"text":"1. Presión en los oídos","options":[{"label":"1 (Nunca)","value":1},{"label":"2","value":2},{"label":"3","value":3},{"label":"4","value":4},{"label":"5","value":5},{"label":"6","value":6},{"label":"7 (Siempre)","value":7}]},{"text":"2. Dolor en los oídos","options":[{"label":"1 (Nunca)","value":1},{"label":"2","value":2},{"label":"3","value":3},{"label":"4","value":4},{"label":"5","value":5},{"label":"6","value":6},{"label":"7 (Siempre)","value":7}]},{"text":"3. Sensación de oídos tapados","options":[{"label":"1 (Nunca)","value":1},{"label":"2","value":2},{"label":"3","value":3},{"label":"4","value":4},{"label":"5","value":5},{"label":"6","value":6},{"label":"7 (Siempre)","value":7}]},{"text":"4. Chasquidos en los oídos","options":[{"label":"1 (Nunca)","value":1},{"label":"2","value":2},{"label":"3","value":3},{"label":"4","value":4},{"label":"5","value":5},{"label":"6","value":6},{"label":"7 (Siempre)","value":7}]},{"text":"5. Sensación de plenitud en los oídos","options":[{"label":"1 (Nunca)","value":1},{"label":"2","value":2},{"label":"3","value":3},{"label":"4","value":4},{"label":"5","value":5},{"label":"6","value":6},{"label":"7 (Siempre)","value":7}]},{"text":"6. Mareos relacionados con cambios de presión","options":[{"label":"1 (Nunca)","value":1},{"label":"2","value":2},{"label":"3","value":3},{"label":"4","value":4},{"label":"5","value":5},{"label":"6","value":6},{"label":"7 (Siempre)","value":7}]},{"text":"7. Problemas para equilibrar la presión al volar o bucear","options":[{"label":"1 (Nunca)","value":1},{"label":"2","value":2},{"label":"3","value":3},{"label":"4","value":4},{"label":"5","value":5},{"label":"6","value":6},{"label":"7 (Siempre)","value":7}]}]}'::jsonb WHERE slug = 'etdq-7';

-- ===== 20260708195129_203cdbdb-2ed4-4093-a24f-8bfd28dd6868.sql =====
UPDATE public.questionnaires SET structure = '{"slug":"thi-25","items":[{"text":"¿Acúfenos le resultan incómodos?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le resultan incómodos cuando intenta concentrarse?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le resultan incómodos cuando intenta pensar?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le causan irritabilidad?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le resultan incómodos cuando intenta leer?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le hacen sentir nervioso?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le resultan incómodos cuando intenta descansar?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le resultan incómodos cuando intenta dormir?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le resultan incómodos en situaciones sociales?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le causan frustración?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le resultan incómodos en el trabajo?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le resultan incómodos cuando está solo?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le causan desesperación?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le resultan incómodos cuando está rodeado de ruido?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le resultan incómodos cuando está en lugares tranquilos?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le hacen sentir que no puede escapar?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le causan depresión?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le resultan incómodos cuando está estresado?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le resultan incómodos cuando está cansado?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le hacen sentir que tiene una enfermedad grave?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le causan ansiedad?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le resultan incómodos cuando está de vacaciones?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le resultan incómodos cuando está con amigos?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le hacen sentir que no puede controlar su vida?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿Acúfenos le hacen sentir que va a perder la cordura?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]}]}'::jsonb WHERE slug = 'thi-25';

-- ===== 20260708195151_54e81b64-fecd-4be1-a43c-ae2acb685b1b.sql =====
UPDATE public.questionnaires SET structure = '{"slug":"dhi-25","items":[{"text":"¿El vértigo le resulta frustrante?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le obliga a estar más concentrado para leer?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le hace sentirse deprimido?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le causa problemas para recordar cosas?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le molesta cuando camina en la oscuridad?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le interfiere con sus actividades sociales y familiares?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le dificulta concentrarse?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le causa temor a salir solo de casa?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le dificulta caminar por la calle?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le hace sentirse avergonzado en público?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le dificulta subir escaleras?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le obliga a evitar posiciones extremas de la cabeza?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le dificulta inclinarse?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le dificulta girar la cabeza rápidamente?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le dificulta caminar sobre superficies irregulares?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le causa ansiedad o nerviosismo?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le dificulta trabajar?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le causa estrés en sus relaciones?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le obliga a evitar movimientos rápidos?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le dificulta viajar en autobús o coche?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le dificulta dormir?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le causa cansancio?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le hace sentirse inseguro?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le obliga a evitar actividades físicas?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]},{"text":"¿El vértigo le causa problemas para cuidar de sí mismo?","options":[{"label":"Sí","value":4},{"label":"A veces","value":2},{"label":"No","value":0}]}]}'::jsonb WHERE slug = 'dhi-25';

-- ===== 20260708195218_41507564-e21a-45a8-9a7b-aace4787ce1c.sql =====
UPDATE public.questionnaires SET structure = '{"slug":"vhi-30","items":[{"text":"1. Mi voz dificulta que la gente me escuche.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"2. La gente me pide que repita lo que digo.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"3. La gente me pregunta qué me pasa en la voz.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"4. Mi voz se cansa fácilmente.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"5. Siento que tengo que esforzarme para hablar.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"6. Mi voz empeora al final del día.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"7. Mi voz me resulta incómoda.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"8. Siento que tengo que aclarar la garganta con frecuencia.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"9. La gente me dice que sueno como si tuviera resfriado.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"10. Mi voz suena diferente en las grabaciones.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"11. Me cuesta hablar en voz alta.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"12. Mi voz se quiebra cuando trato de hablar.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"13. Mi voz suena ronca o áspera.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"14. Mi voz suena como si estuviera afónico.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"15. Mi voz empeora cuando hablo mucho.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"16. Mi voz empeora cuando hablo en ambientes ruidosos.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"17. Me siento avergonzado por mi voz.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"18. Evito hablar por teléfono debido a mi voz.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"19. Evito hablar en grupos debido a mi voz.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"20. Mi voz me causa problemas en el trabajo.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"21. Mi voz me causa problemas en mis relaciones personales.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"22. Me siento frustrado por mi voz.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"23. Me siento triste por mi voz.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"24. Me siento avergonzado por mi voz en público.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"25. Mi voz me hace sentir incompetente.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"26. Me siento tenso cuando hablo.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"27. Me siento ansioso por mi voz.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"28. Me siento deprimido por mi voz.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"29. Me siento aislado por mi voz.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]},{"text":"30. Mi voz dificulta mi vida social.","options":[{"label":"Nunca","value":0},{"label":"Casi nunca","value":1},{"label":"A veces","value":2},{"label":"Casi siempre","value":3},{"label":"Siempre","value":4}]}]}'::jsonb WHERE slug = 'vhi-30';

-- ===== 20260708203041_870478f7-12da-4e42-8cbb-a2209afecd76.sql =====
CREATE TABLE public.patient_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questionnaire_slug text NOT NULL,
  questionnaire_name text,
  answers integer[] NOT NULL DEFAULT '{}',
  total_score integer NOT NULL DEFAULT 0,
  category text,
  description text,
  color text,
  seen boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.patient_responses TO authenticated;
GRANT INSERT ON public.patient_responses TO anon, authenticated;
GRANT ALL ON public.patient_responses TO service_role;

ALTER TABLE public.patient_responses ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous patients) can insert a response
CREATE POLICY "Anyone can submit a patient response"
  ON public.patient_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Doctors can only read their own patients' responses
CREATE POLICY "Doctors can view their own responses"
  ON public.patient_responses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = doctor_id);

-- Doctors can mark their own responses as seen / delete them
CREATE POLICY "Doctors can update their own responses"
  ON public.patient_responses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their own responses"
  ON public.patient_responses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = doctor_id);

CREATE INDEX idx_patient_responses_doctor ON public.patient_responses(doctor_id, created_at DESC);

-- Enable realtime so the doctor's inbox can update live
ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_responses;

-- ===== 20260708203053_70405e64-6030-4420-8fbc-d6ee820525e4.sql =====
DROP POLICY IF EXISTS "Anyone can submit a patient response" ON public.patient_responses;

CREATE POLICY "Anyone can submit a patient response"
  ON public.patient_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    doctor_id IS NOT NULL
    AND length(questionnaire_slug) > 0
    AND array_length(answers, 1) IS NOT NULL
    AND array_length(answers, 1) > 0
    AND array_length(answers, 1) <= 200
    AND seen = false
  );

-- ===== 20260708214457_bddd8979-fc55-40ff-9360-dd15d3b4cfc4.sql =====
-- 1) Verify doctor exists at insert time (anon cannot read auth.users directly)
CREATE OR REPLACE FUNCTION public.doctor_exists(_doctor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = _doctor_id)
$$;

GRANT EXECUTE ON FUNCTION public.doctor_exists(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can submit a patient response" ON public.patient_responses;

CREATE POLICY "Anyone can submit a patient response"
  ON public.patient_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    doctor_id IS NOT NULL
    AND public.doctor_exists(doctor_id)
    AND length(questionnaire_slug) > 0
    AND array_length(answers, 1) IS NOT NULL
    AND array_length(answers, 1) > 0
    AND array_length(answers, 1) <= 200
    AND seen = false
  );

-- 2) Prevent doctors from tampering with clinical fields.
-- Restrict UPDATE privilege to only the "seen" column.
REVOKE UPDATE ON public.patient_responses FROM authenticated;
GRANT UPDATE (seen) ON public.patient_responses TO authenticated;

-- Keep the row-level ownership check
DROP POLICY IF EXISTS "Doctors can update their own responses" ON public.patient_responses;
CREATE POLICY "Doctors can update seen flag on own responses"
  ON public.patient_responses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

-- ===== 20260708221422_b2549698-ac53-4ed5-99fd-ae7d4f5cdb35.sql =====
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

-- ===== 20260708221910_477f930c-a9b6-4f54-8f74-85551be91a0a.sql =====
-- Move doctor_exists out of the exposed public schema so it's not callable via the Data API.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.doctor_exists(_doctor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = _doctor_id)
$$;

REVOKE ALL ON FUNCTION private.doctor_exists(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.doctor_exists(uuid) TO anon;

-- Repoint the RLS policy to the private function.
DROP POLICY IF EXISTS "Anyone can submit a patient response" ON public.patient_responses;

CREATE POLICY "Anyone can submit a patient response"
  ON public.patient_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    doctor_id IS NOT NULL
    AND private.doctor_exists(doctor_id)
    AND length(questionnaire_slug) > 0
    AND array_length(answers, 1) IS NOT NULL
    AND array_length(answers, 1) > 0
    AND array_length(answers, 1) <= 200
    AND seen = false
  );

-- Drop the now-unused public wrapper.
DROP FUNCTION IF EXISTS public.doctor_exists(uuid);

-- ===== 20260708223710_14c29175-ed16-4310-afa7-cd0a213b11f6.sql =====
ALTER TABLE public.patient_responses ADD COLUMN IF NOT EXISTS label text;

-- ===== 20260708225806_2bddba6a-1723-45c0-b98f-2461a75b1a58.sql =====
-- Add source column to distinguish responses filled by patient vs by doctor
ALTER TABLE public.patient_responses
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'patient';

ALTER TABLE public.patient_responses
  DROP CONSTRAINT IF EXISTS patient_responses_source_check;

ALTER TABLE public.patient_responses
  ADD CONSTRAINT patient_responses_source_check
  CHECK (source IN ('patient', 'doctor'));

CREATE INDEX IF NOT EXISTS patient_responses_doctor_source_idx
  ON public.patient_responses (doctor_id, source, created_at DESC);

-- ===== 20260708234015_fb644114-4dbe-4ac1-8c68-dfbf3188793e.sql =====
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  category text NOT NULL DEFAULT 'general',
  message text NOT NULL,
  language text NOT NULL DEFAULT 'es',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.feedback TO anon, authenticated;
GRANT SELECT ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
  ON public.feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(message) BETWEEN 1 AND 5000
    AND (email IS NULL OR char_length(email) <= 254)
    AND (name IS NULL OR char_length(name) <= 120)
    AND category IN ('general','bug','suggestion','question','other')
    AND language IN ('es','en')
  );

CREATE POLICY "Owner can read feedback"
  ON public.feedback FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'jgarciaarteaga.md@gmail.com');

-- ===== 20260709052742_e83b481f-becb-41dc-826d-466d5b233439.sql =====
-- Doctor profile table for ENT Quest
CREATE TABLE public.doctor_profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  country TEXT,
  city TEXT,
  postal_code TEXT,
  license_number TEXT,
  language TEXT NOT NULL DEFAULT 'es',
  terms_accepted_at TIMESTAMPTZ,
  professional_declaration_at TIMESTAMPTZ,
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_profiles TO authenticated;
GRANT ALL ON public.doctor_profiles TO service_role;

ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON public.doctor_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users insert own profile"
  ON public.doctor_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.doctor_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users delete own profile"
  ON public.doctor_profiles FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- Update trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER doctor_profiles_updated_at
  BEFORE UPDATE ON public.doctor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create empty profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.doctor_profiles (
    id, first_name, last_name, date_of_birth, country, city, postal_code, license_number
  )
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data->>'first_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'last_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'date_of_birth', '')::date,
    NULLIF(NEW.raw_user_meta_data->>'country', ''),
    NULLIF(NEW.raw_user_meta_data->>'city', ''),
    NULLIF(NEW.raw_user_meta_data->>'postal_code', ''),
    NULLIF(NEW.raw_user_meta_data->>'license_number', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== 20260709052757_58c4aa1c-578e-46fe-afaa-38c53eb8f687.sql =====
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ===== 20260709083541_002c680b-eb95-4d7a-9afa-f33d1004d316.sql =====
-- Revoke EXECUTE on internal SECURITY DEFINER functions (only used by triggers).
-- (The Lovable email-queue functions that were also hardened here were removed together with the
-- email infrastructure: auth emails are now sent by Supabase Auth directly.)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ===== 20260709150121_490b8ac8-d08b-4fca-8484-95cf4988a092.sql =====
CREATE POLICY "Doctors can insert their own responses"
ON public.patient_responses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = doctor_id);

-- ===== 20260710144417_0312e752-1228-4279-8693-3497ef29f677.sql =====
-- 1. Insert new specialties (slug is unique)
INSERT INTO public.specialties (slug, name) VALUES
  ('otologia-audiologia', 'Otología y Audiología'),
  ('rinologia-base-craneo', 'Rinología y Base de Cráneo'),
  ('faringolaringologia-funcionalidad', 'Faringolaringología y Funcionalidad'),
  ('cabeza-cuello-facial', 'Cabeza, Cuello y Facial')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- 2. Detach questionnaires temporarily
UPDATE public.questionnaires SET specialty_id = NULL, subspecialty_id = NULL;

-- 3. Wipe old subspecialties and old specialties
DELETE FROM public.subspecialties;
DELETE FROM public.specialties WHERE slug NOT IN (
  'otologia-audiologia','rinologia-base-craneo','faringolaringologia-funcionalidad','cabeza-cuello-facial'
);

-- 4. Insert new subspecialties
INSERT INTO public.subspecialties (slug, name, specialty_id)
SELECT v.slug, v.name, sp.id FROM (VALUES
  ('otologia-general', 'Otología General', 'otologia-audiologia'),
  ('otoneurologia', 'Otoneurología', 'otologia-audiologia'),
  ('audiologia', 'Audiología', 'otologia-audiologia'),
  ('rinologia-senos-paranasales', 'Rinología y Senos Paranasales', 'rinologia-base-craneo'),
  ('olfato-gusto', 'Olfato y Gusto', 'rinologia-base-craneo'),
  ('laringologia-voz', 'Laringología y Voz', 'faringolaringologia-funcionalidad'),
  ('deglucion-disfagia', 'Deglución y Disfagia', 'faringolaringologia-funcionalidad'),
  ('lenguaje-habla', 'Trastornos del Lenguaje y Habla', 'faringolaringologia-funcionalidad'),
  ('medicina-sueno', 'Medicina del Sueño', 'faringolaringologia-funcionalidad'),
  ('oncologia-cabeza-cuello', 'Oncología de Cabeza y Cuello', 'cabeza-cuello-facial'),
  ('cervical-glandulas-salivales', 'Patología Cervical y Glándulas Salivales', 'cabeza-cuello-facial'),
  ('cavidad-oral', 'Cavidad Oral', 'cabeza-cuello-facial'),
  ('cirugia-plastica-facial', 'Cirugía Plástica y Reconstructiva Facial', 'cabeza-cuello-facial')
) AS v(slug, name, sp_slug)
JOIN public.specialties sp ON sp.slug = v.sp_slug;

-- 5. Reassign questionnaires to new taxonomy
UPDATE public.questionnaires q SET
  specialty_id = (SELECT id FROM public.specialties WHERE slug = m.sp),
  subspecialty_id = (SELECT ss.id FROM public.subspecialties ss JOIN public.specialties s ON s.id=ss.specialty_id WHERE ss.slug = m.ss AND s.slug = m.sp)
FROM (VALUES
  ('etdq-7', 'otologia-audiologia', 'otologia-general'),
  ('dhi-25', 'otologia-audiologia', 'otoneurologia'),
  ('thi-25', 'otologia-audiologia', 'audiologia'),
  ('snot-22', 'rinologia-base-craneo', 'rinologia-senos-paranasales'),
  ('vhi-30', 'faringolaringologia-funcionalidad', 'laringologia-voz'),
  ('eat-10', 'faringolaringologia-funcionalidad', 'deglucion-disfagia')
) AS m(slug, sp, ss)
WHERE q.slug = m.slug;

-- ===== 20260714153227_37364e66-3b4a-4135-8ff0-e7185b41d199.sql =====
DROP POLICY IF EXISTS "Anyone can submit a patient response" ON public.patient_responses;
CREATE POLICY "Anyone can submit a patient response"
  ON public.patient_responses
  FOR INSERT
  TO anon
  WITH CHECK (
    doctor_id IS NOT NULL
    AND private.doctor_exists(doctor_id)
    AND length(questionnaire_slug) > 0
    AND array_length(answers, 1) IS NOT NULL
    AND array_length(answers, 1) > 0
    AND array_length(answers, 1) <= 200
    AND seen = false
  );

-- ===== 20261031000000_vocalyzer_init.sql =====
-- Vocalyzer — initial schema.
-- Idempotent: safe to run on a fresh Supabase project, and also on a project that already has the
-- ENT Quest tables (doctor_profiles / private.doctor_exists are created only if missing, with the
-- same shape ENT Quest uses).
--
-- Privacy model: audio is NEVER stored. Only numerical results (jsonb) are inserted, anonymously.

-- ---------------------------------------------------------------------------------------------
-- Doctor profiles (same columns as ENT Quest)
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  country TEXT,
  city TEXT,
  postal_code TEXT,
  license_number TEXT,
  language TEXT NOT NULL DEFAULT 'es',
  terms_accepted_at TIMESTAMPTZ,
  professional_declaration_at TIMESTAMPTZ,
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_profiles TO authenticated;
GRANT ALL ON public.doctor_profiles TO service_role;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doctor_profiles' AND policyname = 'Users read own profile') THEN
    CREATE POLICY "Users read own profile" ON public.doctor_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doctor_profiles' AND policyname = 'Users insert own profile') THEN
    CREATE POLICY "Users insert own profile" ON public.doctor_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doctor_profiles' AND policyname = 'Users update own profile') THEN
    CREATE POLICY "Users update own profile" ON public.doctor_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doctor_profiles' AND policyname = 'Users delete own profile') THEN
    CREATE POLICY "Users delete own profile" ON public.doctor_profiles FOR DELETE TO authenticated USING (auth.uid() = id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------------------------
-- Helper: does a doctor (auth user) exist? Lives in a non-exposed schema so it is not callable
-- through the Data API; used by the anonymous INSERT policy below.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.doctor_exists(_doctor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = _doctor_id)
$$;

REVOKE ALL ON FUNCTION private.doctor_exists(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.doctor_exists(uuid) TO anon;

-- ---------------------------------------------------------------------------------------------
-- The Data API roles need USAGE on the public schema. Granted explicitly so the migration also
-- works when the project was created with "Automatically expose new tables" disabled
-- (Supabase's recommended setting): every privilege below is granted explicitly.
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Voice results (numerical only)
CREATE TABLE IF NOT EXISTS public.voice_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'patient' CHECK (source IN ('patient', 'doctor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  seen boolean NOT NULL DEFAULT false,
  label text CHECK (label IS NULL OR char_length(label) <= 60),
  sex text NOT NULL DEFAULT 'unspecified' CHECK (sex IN ('male', 'female', 'unspecified')),
  age_group text NOT NULL DEFAULT 'unspecified' CHECK (age_group IN ('<18', '18-39', '40-59', '60+', 'unspecified')),
  language text NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en')),
  protocol_version text NOT NULL CHECK (char_length(protocol_version) BETWEEN 1 AND 40),
  metrics jsonb NOT NULL CHECK (jsonb_typeof(metrics) = 'object' AND octet_length(metrics::text) < 20000),
  estimates jsonb NOT NULL CHECK (jsonb_typeof(estimates) = 'object' AND octet_length(estimates::text) < 10000),
  clinician jsonb CHECK (clinician IS NULL OR (jsonb_typeof(clinician) = 'object' AND octet_length(clinician::text) < 10000))
);

CREATE INDEX IF NOT EXISTS voice_results_doctor_created_idx ON public.voice_results (doctor_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.voice_results TO authenticated;
GRANT INSERT ON public.voice_results TO anon;
-- Doctors may only change these columns (clinical numbers are immutable once stored).
REVOKE UPDATE ON public.voice_results FROM authenticated;
GRANT UPDATE (seen, label, clinician) ON public.voice_results TO authenticated;
GRANT ALL ON public.voice_results TO service_role;

ALTER TABLE public.voice_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anonymous patients can submit results" ON public.voice_results;
CREATE POLICY "Anonymous patients can submit results"
  ON public.voice_results
  FOR INSERT
  TO anon
  WITH CHECK (
    doctor_id IS NOT NULL
    AND private.doctor_exists(doctor_id)
    AND source = 'patient'
    AND seen = false
    AND label IS NULL
    AND clinician IS NULL
  );

DROP POLICY IF EXISTS "Doctors insert own results" ON public.voice_results;
CREATE POLICY "Doctors insert own results"
  ON public.voice_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors read own results" ON public.voice_results;
CREATE POLICY "Doctors read own results"
  ON public.voice_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors update own results" ON public.voice_results;
CREATE POLICY "Doctors update own results"
  ON public.voice_results
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors delete own results" ON public.voice_results;
CREATE POLICY "Doctors delete own results"
  ON public.voice_results
  FOR DELETE
  TO authenticated
  USING (auth.uid() = doctor_id);

-- Live inbox updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'voice_results'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_results;
  END IF;
END $$;

-- ===== 20261102000000_keepalive.sql =====
-- Lightweight function pinged by the scheduled Netlify function (netlify/functions/keepalive.mts)
-- so the Free-plan project registers daily activity and is not paused for inactivity.
CREATE OR REPLACE FUNCTION public.keepalive()
RETURNS timestamptz
LANGUAGE sql
STABLE
SET search_path = ''
AS $$ SELECT now() $$;

REVOKE ALL ON FUNCTION public.keepalive() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.keepalive() TO anon, authenticated;

-- ===== 20261102000100_standalone_hardening.sql =====
-- Standalone Supabase project (no Lovable Cloud).
-- 1) The Data API roles need USAGE on public (explicit, in case "auto-expose new tables" is off).
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2) Doctors label their own inbox entries: allow updating `label` (only `seen` was granted, so
--    saving a label failed). Clinical fields stay immutable.
GRANT UPDATE (seen, label) ON public.patient_responses TO authenticated;
ALTER TABLE public.patient_responses DROP CONSTRAINT IF EXISTS patient_responses_label_length;
ALTER TABLE public.patient_responses
  ADD CONSTRAINT patient_responses_label_length CHECK (label IS NULL OR char_length(label) <= 60);

-- 3) Anonymous patients cannot attach labels nor pretend to be the doctor.
DROP POLICY IF EXISTS "Anyone can submit a patient response" ON public.patient_responses;
CREATE POLICY "Anyone can submit a patient response"
  ON public.patient_responses
  FOR INSERT
  TO anon
  WITH CHECK (
    doctor_id IS NOT NULL
    AND private.doctor_exists(doctor_id)
    AND length(questionnaire_slug) > 0
    AND array_length(answers, 1) IS NOT NULL
    AND array_length(answers, 1) > 0
    AND array_length(answers, 1) <= 200
    AND seen = false
    AND label IS NULL
    AND source = 'patient'
  );

-- ===== 20261102000200_catalogue_seed.sql =====
-- Clinical questionnaire catalogue (content previously stored only in the Lovable Cloud database).
-- Copied verbatim from the original ENT Quest database on 2026-11-01. Idempotent.

INSERT INTO public.questionnaires (id, name, slug, description, specialty_id, subspecialty_id, scoring_type, max_score, reference, is_active, structure)
VALUES ('fea41933-4db7-4a95-9676-1da24f615c7f', 'Eustachian Tube Dysfunction Questionnaire (ETDQ-7)', 'etdq-7', 'Eustachian Tube Dysfunction Questionnaire de 7 ítems. Evalúa los síntomas de disfunción tubárica.', (SELECT id FROM public.specialties WHERE slug = 'otologia-audiologia'), (SELECT s.id FROM public.subspecialties s JOIN public.specialties p ON p.id = s.specialty_id WHERE s.slug = 'otologia-general' AND p.slug = 'otologia-audiologia'), 'sum', 49, 'Miller BJ et al. Otolaryngol Head Neck Surg 2017;157(1):77-83.', true, $j${"slug": "etdq-7", "items": [{"text": "1. Presión en los oídos", "options": [{"label": "1 (Nunca)", "value": 1}, {"label": "2", "value": 2}, {"label": "3", "value": 3}, {"label": "4", "value": 4}, {"label": "5", "value": 5}, {"label": "6", "value": 6}, {"label": "7 (Siempre)", "value": 7}]}, {"text": "2. Dolor en los oídos", "options": [{"label": "1 (Nunca)", "value": 1}, {"label": "2", "value": 2}, {"label": "3", "value": 3}, {"label": "4", "value": 4}, {"label": "5", "value": 5}, {"label": "6", "value": 6}, {"label": "7 (Siempre)", "value": 7}]}, {"text": "3. Sensación de oídos tapados", "options": [{"label": "1 (Nunca)", "value": 1}, {"label": "2", "value": 2}, {"label": "3", "value": 3}, {"label": "4", "value": 4}, {"label": "5", "value": 5}, {"label": "6", "value": 6}, {"label": "7 (Siempre)", "value": 7}]}, {"text": "4. Chasquidos en los oídos", "options": [{"label": "1 (Nunca)", "value": 1}, {"label": "2", "value": 2}, {"label": "3", "value": 3}, {"label": "4", "value": 4}, {"label": "5", "value": 5}, {"label": "6", "value": 6}, {"label": "7 (Siempre)", "value": 7}]}, {"text": "5. Sensación de plenitud en los oídos", "options": [{"label": "1 (Nunca)", "value": 1}, {"label": "2", "value": 2}, {"label": "3", "value": 3}, {"label": "4", "value": 4}, {"label": "5", "value": 5}, {"label": "6", "value": 6}, {"label": "7 (Siempre)", "value": 7}]}, {"text": "6. Mareos relacionados con cambios de presión", "options": [{"label": "1 (Nunca)", "value": 1}, {"label": "2", "value": 2}, {"label": "3", "value": 3}, {"label": "4", "value": 4}, {"label": "5", "value": 5}, {"label": "6", "value": 6}, {"label": "7 (Siempre)", "value": 7}]}, {"text": "7. Problemas para equilibrar la presión al volar o bucear", "options": [{"label": "1 (Nunca)", "value": 1}, {"label": "2", "value": 2}, {"label": "3", "value": 3}, {"label": "4", "value": 4}, {"label": "5", "value": 5}, {"label": "6", "value": 6}, {"label": "7 (Siempre)", "value": 7}]}]}$j$::jsonb)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.questionnaires (id, name, slug, description, specialty_id, subspecialty_id, scoring_type, max_score, reference, is_active, structure)
VALUES ('364111b1-05c8-42b0-a375-7728779dc0f0', 'Dizziness Handicap Inventory (DHI-25)', 'dhi-25', 'Inventario de discapacidad por vértigo de 25 ítems. Evalúa las repercusiones físicas, funcionales y emocionales del vértigo crónico.', (SELECT id FROM public.specialties WHERE slug = 'otologia-audiologia'), (SELECT s.id FROM public.subspecialties s JOIN public.specialties p ON p.id = s.specialty_id WHERE s.slug = 'otoneurologia' AND p.slug = 'otologia-audiologia'), 'sum', 100, 'Jacobson GP et al. Am J Otol 1990;11(3):192-7.', true, $j${"slug": "dhi-25", "items": [{"text": "¿El vértigo le resulta frustrante?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le obliga a estar más concentrado para leer?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le hace sentirse deprimido?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le causa problemas para recordar cosas?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le molesta cuando camina en la oscuridad?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le interfiere con sus actividades sociales y familiares?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le dificulta concentrarse?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le causa temor a salir solo de casa?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le dificulta caminar por la calle?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le hace sentirse avergonzado en público?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le dificulta subir escaleras?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le obliga a evitar posiciones extremas de la cabeza?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le dificulta inclinarse?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le dificulta girar la cabeza rápidamente?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le dificulta caminar sobre superficies irregulares?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le causa ansiedad o nerviosismo?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le dificulta trabajar?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le causa estrés en sus relaciones?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le obliga a evitar movimientos rápidos?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le dificulta viajar en autobús o coche?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le dificulta dormir?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le causa cansancio?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le hace sentirse inseguro?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le obliga a evitar actividades físicas?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿El vértigo le causa problemas para cuidar de sí mismo?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}]}$j$::jsonb)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.questionnaires (id, name, slug, description, specialty_id, subspecialty_id, scoring_type, max_score, reference, is_active, structure)
VALUES ('8e1e1e3b-5d0b-4726-97c1-279a82096eaa', 'Tinnitus Handicap Inventory (THI-25)', 'thi-25', 'Inventario de discapacidad por acúfenos de 25 ítems. Evalúa el impacto emocional, funcional y catastrófico de los tinnitus.', (SELECT id FROM public.specialties WHERE slug = 'otologia-audiologia'), (SELECT s.id FROM public.subspecialties s JOIN public.specialties p ON p.id = s.specialty_id WHERE s.slug = 'audiologia' AND p.slug = 'otologia-audiologia'), 'sum', 100, 'Newman CW et al. Ear Hear 1996;17(2):152-7.', true, $j${"slug": "thi-25", "items": [{"text": "¿Acúfenos le resultan incómodos?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le resultan incómodos cuando intenta concentrarse?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le resultan incómodos cuando intenta pensar?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le causan irritabilidad?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le resultan incómodos cuando intenta leer?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le hacen sentir nervioso?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le resultan incómodos cuando intenta descansar?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le resultan incómodos cuando intenta dormir?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le resultan incómodos en situaciones sociales?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le causan frustración?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le resultan incómodos en el trabajo?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le resultan incómodos cuando está solo?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le causan desesperación?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le resultan incómodos cuando está rodeado de ruido?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le resultan incómodos cuando está en lugares tranquilos?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le hacen sentir que no puede escapar?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le causan depresión?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le resultan incómodos cuando está estresado?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le resultan incómodos cuando está cansado?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le hacen sentir que tiene una enfermedad grave?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le causan ansiedad?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le resultan incómodos cuando está de vacaciones?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le resultan incómodos cuando está con amigos?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le hacen sentir que no puede controlar su vida?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}, {"text": "¿Acúfenos le hacen sentir que va a perder la cordura?", "options": [{"label": "Sí", "value": 4}, {"label": "A veces", "value": 2}, {"label": "No", "value": 0}]}]}$j$::jsonb)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.questionnaires (id, name, slug, description, specialty_id, subspecialty_id, scoring_type, max_score, reference, is_active, structure)
VALUES ('f16fce8d-b520-4e50-a0ab-cdb177ced659', 'Sino-Nasal Outcome Test (SNOT-22)', 'snot-22', 'Sino-Nasal Outcome Test de 22 ítems. Evalúa la calidad de vida relacionada con rinosinusitis crónica y sus tratamientos.', (SELECT id FROM public.specialties WHERE slug = 'rinologia-base-craneo'), (SELECT s.id FROM public.subspecialties s JOIN public.specialties p ON p.id = s.specialty_id WHERE s.slug = 'rinologia-senos-paranasales' AND p.slug = 'rinologia-base-craneo'), 'sum', 110, 'Buckland JR et al. Rhinology 2015;53(3):215-24.', true, $j${"slug": "snot-22", "items": [{"text": "1. Necesidad de sonarse la nariz", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "2. Estornudos", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "3. Secreción nasal o goteo postnasal", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "4. Congestión o obstrucción nasal", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "5. Pérdida del olfato o del gusto", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "6. Tos", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "7. Sensación de tener que aclarar la garganta", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "8. Secreción que baja por la garganta", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "9. Dolor de oídos", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "10. Sensación de plenitud o presión en los oídos", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "11. Mareos", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "12. Dolores de cabeza o de cara", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "13. Sensación de tener que aclarar los senos paranasales", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "14. Dificultad para conciliar el sueño", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "15. Despertarse durante la noche", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "16. Falta de sueño reparador", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "17. Fatiga", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "18. Reducción de la productividad", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "19. Reducción de la concentración", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "20. Sentirse frustrado, molesto o irritable", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "21. Sentirse triste", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "22. Sentirse avergonzado", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}, {"text": "23. Disminución de la productividad en el trabajo o la escuela", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema muy leve", "value": 1}, {"label": "Problema leve", "value": 2}, {"label": "Problema moderado", "value": 3}, {"label": "Problema grave", "value": 4}, {"label": "Problema muy grave", "value": 5}]}]}$j$::jsonb)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.questionnaires (id, name, slug, description, specialty_id, subspecialty_id, scoring_type, max_score, reference, is_active, structure)
VALUES ('f22eab44-804c-49ad-a689-9a697233c768', 'Voice Handicap Index (VHI-30)', 'vhi-30', 'Índice de discapacidad vocal de 30 ítems. Evalúa el impacto funcional, físico y emocional de la disfonía.', (SELECT id FROM public.specialties WHERE slug = 'faringolaringologia-funcionalidad'), (SELECT s.id FROM public.subspecialties s JOIN public.specialties p ON p.id = s.specialty_id WHERE s.slug = 'laringologia-voz' AND p.slug = 'faringolaringologia-funcionalidad'), 'sum', 120, 'Jacobson BH et al. Am J Speech Lang Pathol 1997;6:66-70.', true, $j${"slug": "vhi-30", "items": [{"text": "1. Mi voz dificulta que la gente me escuche.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "2. La gente me pide que repita lo que digo.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "3. La gente me pregunta qué me pasa en la voz.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "4. Mi voz se cansa fácilmente.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "5. Siento que tengo que esforzarme para hablar.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "6. Mi voz empeora al final del día.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "7. Mi voz me resulta incómoda.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "8. Siento que tengo que aclarar la garganta con frecuencia.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "9. La gente me dice que sueno como si tuviera resfriado.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "10. Mi voz suena diferente en las grabaciones.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "11. Me cuesta hablar en voz alta.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "12. Mi voz se quiebra cuando trato de hablar.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "13. Mi voz suena ronca o áspera.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "14. Mi voz suena como si estuviera afónico.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "15. Mi voz empeora cuando hablo mucho.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "16. Mi voz empeora cuando hablo en ambientes ruidosos.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "17. Me siento avergonzado por mi voz.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "18. Evito hablar por teléfono debido a mi voz.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "19. Evito hablar en grupos debido a mi voz.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "20. Mi voz me causa problemas en el trabajo.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "21. Mi voz me causa problemas en mis relaciones personales.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "22. Me siento frustrado por mi voz.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "23. Me siento triste por mi voz.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "24. Me siento avergonzado por mi voz en público.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "25. Mi voz me hace sentir incompetente.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "26. Me siento tenso cuando hablo.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "27. Me siento ansioso por mi voz.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "28. Me siento deprimido por mi voz.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "29. Me siento aislado por mi voz.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}, {"text": "30. Mi voz dificulta mi vida social.", "options": [{"label": "Nunca", "value": 0}, {"label": "Casi nunca", "value": 1}, {"label": "A veces", "value": 2}, {"label": "Casi siempre", "value": 3}, {"label": "Siempre", "value": 4}]}]}$j$::jsonb)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.questionnaires (id, name, slug, description, specialty_id, subspecialty_id, scoring_type, max_score, reference, is_active, structure)
VALUES ('bf6b69b4-1327-40ec-9741-d74609639f1e', 'Eating Assessment Tool (EAT-10)', 'eat-10', 'Eating Assessment Tool de 10 ítems. Tamizaje rápido de riesgo de disfagia orofaríngea.', (SELECT id FROM public.specialties WHERE slug = 'faringolaringologia-funcionalidad'), (SELECT s.id FROM public.subspecialties s JOIN public.specialties p ON p.id = s.specialty_id WHERE s.slug = 'deglucion-disfagia' AND p.slug = 'faringolaringologia-funcionalidad'), 'sum', 40, 'Belafsky PC et al. Ann Otol Rhinol Laryngol 2008;117(12):919-24.', true, $j${"slug": "eat-10", "items": [{"text": "1. Problemas para deglutir sólidos", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema leve", "value": 1}, {"label": "Problema moderado", "value": 2}, {"label": "Problema grave", "value": 3}]}, {"text": "2. Problemas para deglutir líquidos", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema leve", "value": 1}, {"label": "Problema moderado", "value": 2}, {"label": "Problema grave", "value": 3}]}, {"text": "3. Tos o atragantamiento al comer", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema leve", "value": 1}, {"label": "Problema moderado", "value": 2}, {"label": "Problema grave", "value": 3}]}, {"text": "4. Estridores al respirar", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema leve", "value": 1}, {"label": "Problema moderado", "value": 2}, {"label": "Problema grave", "value": 3}]}, {"text": "5. Dificultad para respirar durante las comidas", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema leve", "value": 1}, {"label": "Problema moderado", "value": 2}, {"label": "Problema grave", "value": 3}]}, {"text": "6. Acumulación de secreciones en la garganta", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema leve", "value": 1}, {"label": "Problema moderado", "value": 2}, {"label": "Problema grave", "value": 3}]}, {"text": "7. Sensación de que los alimentos se atoran", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema leve", "value": 1}, {"label": "Problema moderado", "value": 2}, {"label": "Problema grave", "value": 3}]}, {"text": "8. Dolor al tragar", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema leve", "value": 1}, {"label": "Problema moderado", "value": 2}, {"label": "Problema grave", "value": 3}]}, {"text": "9. Pérdida de peso inexplicada", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema leve", "value": 1}, {"label": "Problema moderado", "value": 2}, {"label": "Problema grave", "value": 3}]}, {"text": "10. Evita ciertos alimentos por dificultad para tragar", "options": [{"label": "Ningún problema", "value": 0}, {"label": "Problema leve", "value": 1}, {"label": "Problema moderado", "value": 2}, {"label": "Problema grave", "value": 3}]}]}$j$::jsonb)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.questions (id, questionnaire_id, text, question_type, order_index, is_required) VALUES
  ('7551f409-e9f1-42c3-9581-3bf8cb896466', 'bf6b69b4-1327-40ec-9741-d74609639f1e', '1. Problemas para deglutir sólidos', 'single_choice', 1, true),
  ('c0457b2e-182a-4edb-8fc0-48cbb23e70b4', 'bf6b69b4-1327-40ec-9741-d74609639f1e', '2. Problemas para deglutir líquidos', 'single_choice', 2, true),
  ('5105c98f-5db1-4539-ac9d-1e0e390dc2af', 'bf6b69b4-1327-40ec-9741-d74609639f1e', '3. Tos o atragantamiento al comer', 'single_choice', 3, true),
  ('43a65109-3cf2-4e21-9f55-d58484955561', 'bf6b69b4-1327-40ec-9741-d74609639f1e', '4. Estridores al respirar', 'single_choice', 4, true),
  ('320a8f98-b3a8-47e8-9c21-70ffb6c0537b', 'bf6b69b4-1327-40ec-9741-d74609639f1e', '5. Dificultad para respirar durante las comidas', 'single_choice', 5, true),
  ('23895287-9599-435b-ad7b-be8d98d34ff4', 'bf6b69b4-1327-40ec-9741-d74609639f1e', '6. Acumulación de secreciones en la garganta', 'single_choice', 6, true),
  ('d601efdc-be1e-4d8b-8c58-a049f723910c', 'bf6b69b4-1327-40ec-9741-d74609639f1e', '7. Sensación de que los alimentos se atoran', 'single_choice', 7, true),
  ('cf117eaa-9d7b-489a-aa42-56e4526f22ac', 'bf6b69b4-1327-40ec-9741-d74609639f1e', '8. Dolor al tragar', 'single_choice', 8, true),
  ('e2ee5a8e-145e-436b-b748-15a5c7c80e0d', 'bf6b69b4-1327-40ec-9741-d74609639f1e', '9. Pérdida de peso inexplicada', 'single_choice', 9, true),
  ('a813979a-f291-4640-bc64-89ab3a4f58c3', 'bf6b69b4-1327-40ec-9741-d74609639f1e', '10. Evita ciertos alimentos por dificultad para tragar', 'single_choice', 10, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.question_options (id, question_id, label, value, order_index) VALUES
  ('bea637af-0345-44b7-b5ff-57d4d1c5848e', '7551f409-e9f1-42c3-9581-3bf8cb896466', 'Ningún problema', 0, 1),
  ('7ac4e45d-a2ff-4e9f-9c16-a51beed32f6a', 'c0457b2e-182a-4edb-8fc0-48cbb23e70b4', 'Ningún problema', 0, 1),
  ('9ec62359-a7fe-4ada-9d69-1bd515392072', '5105c98f-5db1-4539-ac9d-1e0e390dc2af', 'Ningún problema', 0, 1),
  ('45c2e789-ccb9-46f0-8f95-1eeab2cee0f8', '43a65109-3cf2-4e21-9f55-d58484955561', 'Ningún problema', 0, 1),
  ('60946492-1bc3-4b5f-8552-63a06f78c20d', '320a8f98-b3a8-47e8-9c21-70ffb6c0537b', 'Ningún problema', 0, 1),
  ('8e42e219-b4b4-41a7-8c5f-ca5acd9fac3e', '23895287-9599-435b-ad7b-be8d98d34ff4', 'Ningún problema', 0, 1),
  ('37616a16-dfa7-47cc-9203-2b43c04c8040', 'd601efdc-be1e-4d8b-8c58-a049f723910c', 'Ningún problema', 0, 1),
  ('dc3e272d-61c7-419f-9fba-9b6d78405462', 'cf117eaa-9d7b-489a-aa42-56e4526f22ac', 'Ningún problema', 0, 1),
  ('2ae52c82-8e94-429b-bf63-aed50b45dc43', 'e2ee5a8e-145e-436b-b748-15a5c7c80e0d', 'Ningún problema', 0, 1),
  ('bf215a04-16b0-4d84-9da6-779a0a4e0479', 'a813979a-f291-4640-bc64-89ab3a4f58c3', 'Ningún problema', 0, 1),
  ('5e06fcec-010c-4e17-ba37-de4b98a58a3c', '7551f409-e9f1-42c3-9581-3bf8cb896466', 'Problema leve', 1, 2),
  ('9a2817dd-483f-4474-b14b-ced453df3dd0', 'c0457b2e-182a-4edb-8fc0-48cbb23e70b4', 'Problema leve', 1, 2),
  ('ff8b985d-08d0-48c0-8564-7001f396f7f9', '5105c98f-5db1-4539-ac9d-1e0e390dc2af', 'Problema leve', 1, 2),
  ('00cef74e-8633-44d0-82a8-46505e7098fe', '43a65109-3cf2-4e21-9f55-d58484955561', 'Problema leve', 1, 2),
  ('c834147e-34d2-4e3e-b88b-f6f403bc14e4', '320a8f98-b3a8-47e8-9c21-70ffb6c0537b', 'Problema leve', 1, 2),
  ('80c25564-7e9c-4885-b777-a4b06b72f9ae', '23895287-9599-435b-ad7b-be8d98d34ff4', 'Problema leve', 1, 2),
  ('6b3203bb-160a-4ecf-b993-d948aa1b7984', 'd601efdc-be1e-4d8b-8c58-a049f723910c', 'Problema leve', 1, 2),
  ('e6c34cd1-d4b5-496a-88ac-b030413bb223', 'cf117eaa-9d7b-489a-aa42-56e4526f22ac', 'Problema leve', 1, 2),
  ('9bfc41d5-6ae0-4978-934f-01d374bbbb71', 'e2ee5a8e-145e-436b-b748-15a5c7c80e0d', 'Problema leve', 1, 2),
  ('30d3a251-23f5-4543-9a2c-1ee1c2393c41', 'a813979a-f291-4640-bc64-89ab3a4f58c3', 'Problema leve', 1, 2),
  ('08415369-40f7-49d9-b532-5044a1a6fc8a', '7551f409-e9f1-42c3-9581-3bf8cb896466', 'Problema moderado', 2, 3),
  ('ef62ebb0-7302-407a-aba9-73713252af1b', 'c0457b2e-182a-4edb-8fc0-48cbb23e70b4', 'Problema moderado', 2, 3),
  ('2829da41-8e70-4da1-82f0-50f79c4a7a31', '5105c98f-5db1-4539-ac9d-1e0e390dc2af', 'Problema moderado', 2, 3),
  ('42f51b90-73bd-4128-83a0-b9a097c0cf0d', '43a65109-3cf2-4e21-9f55-d58484955561', 'Problema moderado', 2, 3),
  ('63fcdaa9-4c86-4b4d-bdef-a2dfbe657832', '320a8f98-b3a8-47e8-9c21-70ffb6c0537b', 'Problema moderado', 2, 3),
  ('1e79577e-d60e-4a36-9771-a607cb026cfb', '23895287-9599-435b-ad7b-be8d98d34ff4', 'Problema moderado', 2, 3),
  ('6b32d907-df3b-4a7a-bb6b-4ab65d7f431a', 'd601efdc-be1e-4d8b-8c58-a049f723910c', 'Problema moderado', 2, 3),
  ('d1358eab-f66a-45c0-86ce-f0d5ff27b5d4', 'cf117eaa-9d7b-489a-aa42-56e4526f22ac', 'Problema moderado', 2, 3),
  ('16fd1fc7-cdcb-4828-ad2f-eb8d1c43a775', 'e2ee5a8e-145e-436b-b748-15a5c7c80e0d', 'Problema moderado', 2, 3),
  ('abbd7d48-bd22-40a2-b294-4268762ce836', 'a813979a-f291-4640-bc64-89ab3a4f58c3', 'Problema moderado', 2, 3),
  ('9abf1208-8cd5-472a-bb08-0d1f02ea44ec', '7551f409-e9f1-42c3-9581-3bf8cb896466', 'Problema grave', 3, 4),
  ('7bb90aed-c60e-4c50-abc9-4240572f7fbd', 'c0457b2e-182a-4edb-8fc0-48cbb23e70b4', 'Problema grave', 3, 4),
  ('63146ac9-5707-4931-844b-6f531cb09c15', '5105c98f-5db1-4539-ac9d-1e0e390dc2af', 'Problema grave', 3, 4),
  ('e110ad7c-8e92-4c27-a3e5-936ddf64e8a2', '43a65109-3cf2-4e21-9f55-d58484955561', 'Problema grave', 3, 4),
  ('93f919b4-83f5-4407-9f8b-13ae5eb195bc', '320a8f98-b3a8-47e8-9c21-70ffb6c0537b', 'Problema grave', 3, 4),
  ('a2b402e1-a1f8-480a-957e-7322caa654a8', '23895287-9599-435b-ad7b-be8d98d34ff4', 'Problema grave', 3, 4),
  ('129f393d-fc5e-4cd5-a079-587d158cb94f', 'd601efdc-be1e-4d8b-8c58-a049f723910c', 'Problema grave', 3, 4),
  ('c21878a0-1384-4b23-9d19-7d49711cccd6', 'cf117eaa-9d7b-489a-aa42-56e4526f22ac', 'Problema grave', 3, 4),
  ('7fbeeb1d-ec75-4d75-81b1-afdcca4189ab', 'e2ee5a8e-145e-436b-b748-15a5c7c80e0d', 'Problema grave', 3, 4),
  ('5ead967c-8088-4e96-ac0a-bdb9015099d7', 'a813979a-f291-4640-bc64-89ab3a4f58c3', 'Problema grave', 3, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.interpretations (id, questionnaire_id, min_score, max_score, category, description, color) VALUES
  ('167ac42f-aa94-41de-b0bd-61993d67b41c', 'f16fce8d-b520-4e50-a0ab-cdb177ced659', 51, 110, 'Severo', 'Impacto severo. Valorar intervención quirúrgica.', '#ef4444'),
  ('e888505a-465a-43ab-ae34-d7c6c7df6eed', 'f16fce8d-b520-4e50-a0ab-cdb177ced659', 21, 50, 'Moderado', 'Impacto moderado. Considerar tratamiento combinado.', '#eab308'),
  ('e35ab3a8-03a8-43e8-94ba-a2863a6a765e', 'f16fce8d-b520-4e50-a0ab-cdb177ced659', 11, 20, 'Leve', 'Impacto leve. Tratamiento médico habitualmente suficiente.', '#84cc16'),
  ('29fdafdf-04dc-4974-bb87-87f1a2147652', 'f16fce8d-b520-4e50-a0ab-cdb177ced659', 0, 10, 'Muy leve', 'Impacto mínimo en la calidad de vida.', '#22c55e'),
  ('67fd875f-7c77-42bc-b54f-2b7105a98797', '8e1e1e3b-5d0b-4726-97c1-279a82096eaa', 77, 100, 'Severo', 'Handicap severo por acúfenos. Manejo multidisciplinario urgente.', '#ef4444'),
  ('a3b22cc1-96b8-44f0-8d31-3f512200a04f', '8e1e1e3b-5d0b-4726-97c1-279a82096eaa', 57, 76, 'Moderado-severo', 'Handicap moderado-severo. Intervención especializada intensiva.', '#f97316'),
  ('43d34cfe-e3dc-4ecf-9714-8bfb7c2abb96', '8e1e1e3b-5d0b-4726-97c1-279a82096eaa', 37, 56, 'Moderado', 'Handicap moderado. Tratamiento multimodal recomendado.', '#eab308'),
  ('5eb3bd0a-6bc6-4114-bc25-7e70c0e9fd81', '8e1e1e3b-5d0b-4726-97c1-279a82096eaa', 17, 36, 'Leve-moderado', 'Handicap leve a moderado. Terapia de reentrenamiento auditivo recomendada.', '#84cc16'),
  ('28e21934-fb8c-41f0-a4a9-8c052590d218', '8e1e1e3b-5d0b-4726-97c1-279a82096eaa', 0, 16, 'Leve', 'Handicap leve por acúfenos. Manejo conservador adecuado.', '#22c55e'),
  ('dde9c4e6-7453-4670-b041-b2bae77e2cf0', '364111b1-05c8-42b0-a375-7728779dc0f0', 61, 100, 'Severo', 'Handicap severo. Valoración multidisciplinaria y tratamiento intensivo.', '#ef4444'),
  ('46927bed-83e9-4360-a517-783e8066e1b1', '364111b1-05c8-42b0-a375-7728779dc0f0', 31, 60, 'Moderado', 'Handicap moderado. Rehabilitación vestibular estructurada recomendada.', '#eab308'),
  ('55cc84d0-ccda-4094-a69c-7724a5cee7a0', '364111b1-05c8-42b0-a375-7728779dc0f0', 0, 30, 'Leve', 'Handicap leve por vértigo. Rehabilitación vestibular ambulatoria.', '#22c55e'),
  ('518922c5-f842-4ec6-95f6-773878876583', 'bf6b69b4-1327-40ec-9741-d74609639f1e', 3, 40, 'Riesgo', 'Riesgo de disfagia. Se recomienda valoración por especialista.', '#ef4444'),
  ('4dc86988-dd23-4d79-a1a6-ace9769b8cf9', 'bf6b69b4-1327-40ec-9741-d74609639f1e', 0, 2, 'Normal', 'Sin riesgo de disfagia. No se requiere evaluación adicional.', '#22c55e'),
  ('2cb5bbcf-355c-42bf-ad9b-07a1c90b3217', 'f22eab44-804c-49ad-a689-9a697233c768', 61, 120, 'Severa', 'Discapacidad vocal severa. Evaluación laringológica completa.', '#ef4444'),
  ('cd92f88f-5442-47a2-9b8d-f10e652a8bb4', 'f22eab44-804c-49ad-a689-9a697233c768', 31, 60, 'Moderada', 'Discapacidad vocal moderada. Terapia fonoaudiológica indicada.', '#eab308'),
  ('04f3ff74-666e-4938-9dde-e9152dde7a69', 'f22eab44-804c-49ad-a689-9a697233c768', 0, 30, 'Leve', 'Discapacidad vocal leve. Higiene vocal y seguimiento.', '#22c55e'),
  ('880af5aa-523d-49dd-9117-1eabfa54e2d3', 'fea41933-4db7-4a95-9676-1da24f615c7f', 25, 49, 'Severa', 'Disfunción tubárica severa. Valorar tratamiento quirúrgico.', '#ef4444'),
  ('da44cb91-3461-48ff-9394-177043d07beb', 'fea41933-4db7-4a95-9676-1da24f615c7f', 12, 24, 'Moderada', 'Disfunción tubárica moderada. Considerar tratamiento conservador.', '#eab308'),
  ('ddeb34ef-8818-440d-8a0c-aa6b39c97a69', 'fea41933-4db7-4a95-9676-1da24f615c7f', 0, 11, 'Leve', 'Disfunción tubárica leve. Seguimiento ambulatorio.', '#22c55e')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.diagnostic_keywords (id, keyword, questionnaire_id, weight) VALUES
  ('e02fb160-31b7-473f-9ba8-9161beaf168e', 'audición', '8e1e1e3b-5d0b-4726-97c1-279a82096eaa', 1),
  ('a9a14f9b-0cbb-4bee-aa11-510a250d418d', 'hipoacusia', '8e1e1e3b-5d0b-4726-97c1-279a82096eaa', 1),
  ('addc9e8c-e7a4-47f0-aae1-bdec5b571670', 'ruido oído', '8e1e1e3b-5d0b-4726-97c1-279a82096eaa', 2),
  ('e67c594a-7e2d-4030-9b00-8a34dfb1e86e', 'pitidos', '8e1e1e3b-5d0b-4726-97c1-279a82096eaa', 2),
  ('2a5003f6-ad39-4e03-84d8-ce98bd39c68b', 'zumbido', '8e1e1e3b-5d0b-4726-97c1-279a82096eaa', 3),
  ('a8beeaa7-85ad-40d2-8af0-7558417feaa3', 'tinnitus', '8e1e1e3b-5d0b-4726-97c1-279a82096eaa', 3),
  ('e84d7ffe-244b-4f11-9ddd-83ee4abf1130', 'acúfenos', '8e1e1e3b-5d0b-4726-97c1-279a82096eaa', 3),
  ('1339b16d-247b-4763-a0db-80bbdf038389', 'equilibrio', '364111b1-05c8-42b0-a375-7728779dc0f0', 1),
  ('ba6e5e5c-ca6a-4e29-aaa5-cfc57757cc29', 'neuronitis', '364111b1-05c8-42b0-a375-7728779dc0f0', 1),
  ('c0f90e3b-0e2c-49e2-8506-2c170e35a60f', 'laberintitis', '364111b1-05c8-42b0-a375-7728779dc0f0', 1),
  ('05eb0345-3a4d-471e-ba56-73d47dec7cd9', 'vppb', '364111b1-05c8-42b0-a375-7728779dc0f0', 2),
  ('5d95f948-e36e-4116-8aa2-1ddbd983102d', 'vértigo posicional', '364111b1-05c8-42b0-a375-7728779dc0f0', 2),
  ('cd4d1e83-905f-4618-96be-3c0d24e2f13a', 'inestabilidad', '364111b1-05c8-42b0-a375-7728779dc0f0', 2),
  ('9f4b16ac-ce92-4a8b-a033-7a184876a721', 'mareo', '364111b1-05c8-42b0-a375-7728779dc0f0', 3),
  ('4f63c584-2426-4684-8862-09756918ca43', 'vértigo', '364111b1-05c8-42b0-a375-7728779dc0f0', 3),
  ('c9bab095-eaac-4d33-935d-9e20487edac1', 'aspiración', 'bf6b69b4-1327-40ec-9741-d74609639f1e', 1),
  ('173dd15d-861e-4322-b545-73b05445020f', 'estridor', 'bf6b69b4-1327-40ec-9741-d74609639f1e', 1),
  ('4a70e7fa-24b3-447b-ba59-f5021977ea71', 'dolor tragar', 'bf6b69b4-1327-40ec-9741-d74609639f1e', 2),
  ('d737c96c-ba09-4afa-927e-dd897af9f7fc', 'tos al comer', 'bf6b69b4-1327-40ec-9741-d74609639f1e', 2),
  ('e19a58eb-e105-48d1-a97c-1b34ee4f09b2', 'atragantamiento', 'bf6b69b4-1327-40ec-9741-d74609639f1e', 3),
  ('4b7e9550-4a33-4390-87ce-4bf4d518cf43', 'deglución', 'bf6b69b4-1327-40ec-9741-d74609639f1e', 3),
  ('e83da551-87f9-4689-b82d-81b4687373e7', 'disfagia', 'bf6b69b4-1327-40ec-9741-d74609639f1e', 3),
  ('f9e09573-0116-40dc-a7da-eb82fa07256d', 'parálisis', 'f22eab44-804c-49ad-a689-9a697233c768', 1),
  ('558c9ad4-462e-4e14-854b-59df466d1fc1', 'nódulos', 'f22eab44-804c-49ad-a689-9a697233c768', 1),
  ('ead23117-16ca-420c-9250-352eaafe50aa', 'laringe', 'f22eab44-804c-49ad-a689-9a697233c768', 1),
  ('1a740184-fcb8-4fea-a5b3-0fc65b2561a0', 'afonía', 'f22eab44-804c-49ad-a689-9a697233c768', 2),
  ('def8bd79-1e50-4f57-91e7-6f423ec61816', 'voz', 'f22eab44-804c-49ad-a689-9a697233c768', 2),
  ('55d1bbfd-505e-44ae-8fd3-157890c2465b', 'ronquera', 'f22eab44-804c-49ad-a689-9a697233c768', 3),
  ('b6f327aa-8dbe-42a3-8897-2ffe7ecd8f2d', 'disfonía', 'f22eab44-804c-49ad-a689-9a697233c768', 3),
  ('074ba3d1-0338-496d-baae-9a58177d40cc', 'bucear', 'fea41933-4db7-4a95-9676-1da24f615c7f', 1),
  ('1d79b11b-5e12-4427-b1fe-b3b1ddb350f7', 'volar', 'fea41933-4db7-4a95-9676-1da24f615c7f', 1),
  ('509d4d7b-4d04-4f57-ae2d-e62ce3f47f63', 'barotrauma', 'fea41933-4db7-4a95-9676-1da24f615c7f', 1),
  ('ebd09dd6-d9e8-4bca-9c78-e44780329184', 'presión oído', 'fea41933-4db7-4a95-9676-1da24f615c7f', 2),
  ('35d2beca-19a8-4927-8e0d-22c7509fe528', 'oído tapado', 'fea41933-4db7-4a95-9676-1da24f615c7f', 2),
  ('85d53e9b-e139-4e78-8644-194fcc8d2e39', 'disfunción tubárica', 'fea41933-4db7-4a95-9676-1da24f615c7f', 3),
  ('ac498096-a1b9-49ee-8084-0d8718c0b175', 'trompa eustaquio', 'fea41933-4db7-4a95-9676-1da24f615c7f', 3),
  ('8efe0d9c-068d-4005-86c6-776fb851fffd', 'nasal', 'f16fce8d-b520-4e50-a0ab-cdb177ced659', 1),
  ('58707618-62cc-4473-a001-1ffc8ec9ca6f', 'polipos', 'f16fce8d-b520-4e50-a0ab-cdb177ced659', 1),
  ('961a3e17-a63b-434e-a891-6fed6ac5a58d', 'olfato', 'f16fce8d-b520-4e50-a0ab-cdb177ced659', 2),
  ('c008950b-463d-4f00-a9d2-be4f8e6f9100', 'goteo postnasal', 'f16fce8d-b520-4e50-a0ab-cdb177ced659', 2),
  ('be710a5d-4159-47c0-8617-1041731511de', 'secreción nasal', 'f16fce8d-b520-4e50-a0ab-cdb177ced659', 2),
  ('2b331f0c-8ef9-4844-8d18-9016f03e8d1f', 'congestión nasal', 'f16fce8d-b520-4e50-a0ab-cdb177ced659', 2),
  ('149805f1-f6ef-4c90-a1bf-1674255c6613', 'sinusitis', 'f16fce8d-b520-4e50-a0ab-cdb177ced659', 3),
  ('1ced6284-5726-4f9d-877b-a96c8e43164d', 'rinosinusitis', 'f16fce8d-b520-4e50-a0ab-cdb177ced659', 3)
ON CONFLICT (id) DO NOTHING;

-- ===== 20261103000000_snot22_22_items.sql =====
-- SNOT-22: the generic Spanish text stored in the catalogue had 23 items (item 23 repeated
-- "productividad") and its item set did not match the instrument (it had "aclarar los senos
-- paranasales" instead of "secreción nasal espesa" / "despertarse cansado").
-- Replace it with the 22 items of the SNOT-22 (SNOT-20 + nasal obstruction + taste/smell), in
-- the same order as the validated Spanish version (de los Santos et al. 2015), so every variant
-- shares item order. Answer options (0–5) are kept as they were. Idempotent.
UPDATE public.questionnaires q
SET structure = jsonb_set(
  q.structure,
  '{items}',
  (
    SELECT jsonb_agg(jsonb_build_object('text', t.text, 'options', q.structure #> '{items,0,options}') ORDER BY t.n)
    FROM unnest(ARRAY[
      '1. Necesidad de sonarse la nariz',
      '2. Estornudos',
      '3. Goteo nasal',
      '4. Tos',
      '5. Moco que cae hacia la garganta (goteo posterior)',
      '6. Secreción nasal espesa',
      '7. Sensación de oído tapado',
      '8. Mareo',
      '9. Dolor de oído',
      '10. Dolor o presión en la cara',
      '11. Dificultad para conciliar el sueño',
      '12. Despertarse durante la noche',
      '13. No descansar bien por la noche',
      '14. Despertarse cansado',
      '15. Fatiga',
      '16. Disminución de la productividad',
      '17. Disminución de la concentración',
      '18. Sentirse frustrado, inquieto o irritable',
      '19. Sentirse triste',
      '20. Sentirse avergonzado',
      '21. Alteración del gusto o del olfato',
      '22. Congestión u obstrucción nasal'
    ]) WITH ORDINALITY AS t(text, n)
  )
)
WHERE q.slug = 'snot-22';

-- ===== 20261106000000_hearing_init.sql =====
-- ENT Senses Hearing — initial schema (originally Auditone Test).
-- Idempotent: safe on a fresh Supabase project and on a project that already has the ENT Quest /
-- Vocalyzer tables (doctor_profiles and private.doctor_exists are created only if missing, with
-- the same shape).
--
-- Privacy model: patient (remote) results are anonymous and numerical only. Remote results are
-- ALWAYS stored as calibrated = false (informative). Clinical data (report) can only be written by
-- the authenticated doctor.

-- ---------------------------------------------------------------------------------------------
-- Doctor profiles (same columns as ENT Quest / Vocalyzer)
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  country TEXT,
  city TEXT,
  postal_code TEXT,
  license_number TEXT,
  language TEXT NOT NULL DEFAULT 'es',
  terms_accepted_at TIMESTAMPTZ,
  professional_declaration_at TIMESTAMPTZ,
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_profiles TO authenticated;
GRANT ALL ON public.doctor_profiles TO service_role;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doctor_profiles' AND policyname = 'Users read own profile') THEN
    CREATE POLICY "Users read own profile" ON public.doctor_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doctor_profiles' AND policyname = 'Users insert own profile') THEN
    CREATE POLICY "Users insert own profile" ON public.doctor_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doctor_profiles' AND policyname = 'Users update own profile') THEN
    CREATE POLICY "Users update own profile" ON public.doctor_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doctor_profiles' AND policyname = 'Users delete own profile') THEN
    CREATE POLICY "Users delete own profile" ON public.doctor_profiles FOR DELETE TO authenticated USING (auth.uid() = id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------------------------
-- Helper: does a doctor (auth user) exist? Non-exposed schema; used by the anonymous INSERT policy.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.doctor_exists(_doctor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = _doctor_id)
$$;

REVOKE ALL ON FUNCTION private.doctor_exists(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.doctor_exists(uuid) TO anon;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Audiometry sessions
--   source = 'patient' → remote informative test from the QR (never calibrated)
--   source = 'doctor'  → in-clinic session (calibrated only with a valid calibration profile)
CREATE TABLE IF NOT EXISTS public.audiometry_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'patient' CHECK (source IN ('patient', 'doctor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  seen boolean NOT NULL DEFAULT false,
  label text CHECK (label IS NULL OR char_length(label) <= 60),
  sex text NOT NULL DEFAULT 'unspecified' CHECK (sex IN ('male', 'female', 'unspecified')),
  age_group text NOT NULL DEFAULT 'unspecified' CHECK (age_group IN ('<18', '18-39', '40-59', '60+', 'unspecified')),
  language text NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en')),
  app_version text NOT NULL CHECK (char_length(app_version) BETWEEN 1 AND 40),
  calibrated boolean NOT NULL DEFAULT false,
  -- Transducer used (type, wired/wireless, model) and calibration profile reference, if any.
  device jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(device) = 'object' AND octet_length(device::text) < 4000),
  -- Patient questionnaire (symptoms, red flags).
  questionnaire jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(questionnaire) = 'object' AND octet_length(questionnaire::text) < 8000),
  -- Air-conduction thresholds (AudiogramData shape from AudiometricReport).
  audiogram jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(audiogram) = 'object' AND octet_length(audiogram::text) < 20000),
  -- Reliability and quality indicators (retest, false positives, warnings).
  quality jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(quality) = 'object' AND octet_length(quality::text) < 8000),
  -- Doctor-only report data (impedance, speech audiometry, history, diagnosis).
  report jsonb CHECK (report IS NULL OR (jsonb_typeof(report) = 'object' AND octet_length(report::text) < 60000))
);

CREATE INDEX IF NOT EXISTS audiometry_sessions_doctor_created_idx ON public.audiometry_sessions (doctor_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.audiometry_sessions TO authenticated;
GRANT INSERT ON public.audiometry_sessions TO anon;
-- Measurements are immutable once stored; doctors may only change these columns.
REVOKE UPDATE ON public.audiometry_sessions FROM authenticated;
GRANT UPDATE (seen, label, report) ON public.audiometry_sessions TO authenticated;
GRANT ALL ON public.audiometry_sessions TO service_role;

ALTER TABLE public.audiometry_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anonymous patients can submit sessions" ON public.audiometry_sessions;
CREATE POLICY "Anonymous patients can submit sessions"
  ON public.audiometry_sessions
  FOR INSERT
  TO anon
  WITH CHECK (
    doctor_id IS NOT NULL
    AND private.doctor_exists(doctor_id)
    AND source = 'patient'
    AND calibrated = false
    AND seen = false
    AND label IS NULL
    AND report IS NULL
  );

DROP POLICY IF EXISTS "Doctors insert own sessions" ON public.audiometry_sessions;
CREATE POLICY "Doctors insert own sessions"
  ON public.audiometry_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors read own sessions" ON public.audiometry_sessions;
CREATE POLICY "Doctors read own sessions"
  ON public.audiometry_sessions FOR SELECT TO authenticated
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors update own sessions" ON public.audiometry_sessions;
CREATE POLICY "Doctors update own sessions"
  ON public.audiometry_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors delete own sessions" ON public.audiometry_sessions;
CREATE POLICY "Doctors delete own sessions"
  ON public.audiometry_sessions FOR DELETE TO authenticated
  USING (auth.uid() = doctor_id);

-- Live inbox updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'audiometry_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audiometry_sessions;
  END IF;
END $$;

-- ===== 20261107000000_patient_invitations.sql =====
-- Patient invitations: the doctor sends a questionnaire link (by their own e-mail client, a copied
-- link or the share sheet) with the patient's label assigned BEFORE sending. When the patient
-- answers, the response reaches the inbox already labelled.
--
-- Privacy: the patient's e-mail address is never stored (it only pre-fills the doctor's own
-- e-mail client). Only the label the doctor chose (initials / record number) is kept, exactly as
-- with labels added by hand in the inbox. The patient never sees the label.
--
-- Security: the link carries a random single-use token. Anonymous users cannot read this table;
-- they can only look up a token's status and submit through the two SECURITY DEFINER functions
-- below, which copy the label server-side.

CREATE TABLE IF NOT EXISTS public.patient_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  questionnaire_slug text NOT NULL CHECK (char_length(questionnaire_slug) BETWEEN 1 AND 100),
  variant text CHECK (variant IS NULL OR char_length(variant) <= 60),
  label text NOT NULL CHECK (char_length(btrim(label)) BETWEEN 1 AND 60),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '14 days',
  completed_at timestamptz,
  response_id uuid REFERENCES public.patient_responses(id) ON DELETE SET NULL,
  CONSTRAINT patient_invitations_expiry CHECK (expires_at > created_at AND expires_at <= created_at + interval '90 days')
);

CREATE INDEX IF NOT EXISTS patient_invitations_doctor_created_idx
  ON public.patient_invitations (doctor_id, created_at DESC);

-- Doctors may create (only these columns), read and delete their own invitations. The token,
-- completion time and response link are set by the database only.
GRANT SELECT, DELETE ON public.patient_invitations TO authenticated;
GRANT INSERT (doctor_id, questionnaire_slug, variant, label, expires_at) ON public.patient_invitations TO authenticated;
GRANT ALL ON public.patient_invitations TO service_role;

ALTER TABLE public.patient_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors create own invitations" ON public.patient_invitations;
CREATE POLICY "Doctors create own invitations"
  ON public.patient_invitations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors read own invitations" ON public.patient_invitations;
CREATE POLICY "Doctors read own invitations"
  ON public.patient_invitations FOR SELECT TO authenticated
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors delete own invitations" ON public.patient_invitations;
CREATE POLICY "Doctors delete own invitations"
  ON public.patient_invitations FOR DELETE TO authenticated
  USING (auth.uid() = doctor_id);

-- Public lookup: which questionnaire a token opens and whether it can still be answered.
-- Never returns the label or the doctor.
CREATE OR REPLACE FUNCTION public.get_invitation(_token uuid)
RETURNS TABLE (questionnaire_slug text, variant text, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.questionnaire_slug,
         i.variant,
         CASE
           WHEN i.completed_at IS NOT NULL THEN 'completed'
           WHEN i.expires_at <= now() THEN 'expired'
           ELSE 'pending'
         END
  FROM public.patient_invitations i
  WHERE i.token = _token
$$;

REVOKE ALL ON FUNCTION public.get_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation(uuid) TO anon, authenticated;

-- Public submission through an invitation: validates, scores, stores the response with the
-- doctor's label and closes the invitation, atomically. Returns the total score.
CREATE OR REPLACE FUNCTION public.submit_invited_response(_token uuid, _answers integer[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.patient_invitations%ROWTYPE;
  sc record;
  qname text;
  rid uuid;
  n integer := coalesce(array_length(_answers, 1), 0);
BEGIN
  SELECT * INTO inv FROM public.patient_invitations WHERE token = _token FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invitation_not_found';
  END IF;
  IF inv.completed_at IS NOT NULL THEN
    RAISE EXCEPTION 'invitation_completed';
  END IF;
  IF inv.expires_at <= now() THEN
    RAISE EXCEPTION 'invitation_expired';
  END IF;
  IF n = 0 OR n > 200 OR EXISTS (SELECT 1 FROM unnest(_answers) AS v WHERE v IS NULL OR v < 0 OR v > 10) THEN
    RAISE EXCEPTION 'invalid_answers';
  END IF;

  SELECT * INTO sc FROM public.calculate_questionnaire_score(inv.questionnaire_slug, _answers);
  SELECT q.name INTO qname FROM public.questionnaires q WHERE q.slug = inv.questionnaire_slug;

  INSERT INTO public.patient_responses
    (doctor_id, questionnaire_slug, questionnaire_name, answers, total_score, category, description, color, seen, label, source)
  VALUES
    (inv.doctor_id, inv.questionnaire_slug, coalesce(qname, inv.questionnaire_slug), _answers,
     coalesce(sc.total_score, 0), sc.category, sc.description, sc.color, false, btrim(inv.label), 'patient')
  RETURNING id INTO rid;

  UPDATE public.patient_invitations SET completed_at = now(), response_id = rid WHERE id = inv.id;
  RETURN coalesce(sc.total_score, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_invited_response(uuid, integer[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_invited_response(uuid, integer[]) TO anon, authenticated;

-- Live updates for the invitations list
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'patient_invitations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_invitations;
  END IF;
END $$;

-- ===== 20261107000100_hearing_manual_audiogram_edit.sql =====
-- Manual transcriptions may be corrected; recorded measurements may not.
-- A doctor can update the audiogram of a session ONLY when it was typed in by hand
-- (source = 'doctor', calibrated = false, device.entry = 'manual'). Patient checks and calibrated
-- sessions stay exactly as recorded.
GRANT UPDATE (seen, label, report, audiogram) ON public.audiometry_sessions TO authenticated;

CREATE OR REPLACE FUNCTION private.guard_audiogram_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.audiogram IS DISTINCT FROM OLD.audiogram
     AND (OLD.source <> 'doctor' OR OLD.calibrated OR coalesce(OLD.device->>'entry', '') <> 'manual') THEN
    RAISE EXCEPTION 'audiogram_immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_audiogram_update ON public.audiometry_sessions;
CREATE TRIGGER guard_audiogram_update
  BEFORE UPDATE ON public.audiometry_sessions
  FOR EACH ROW EXECUTE FUNCTION private.guard_audiogram_update();

-- ===== 20261108000000_hearing_calibration.sql =====
-- ENT Senses Hearing — calibration profiles and daily checks for the in-clinic audiometer.
--
-- A calibration profile describes one fixed chain (audiometric headphones + audio interface +
-- fixed system volume) and stores, per ear and frequency, the digital level (dBFS) that produces
-- 0 dB HL. It is filled from an objective calibration (sound level meter + artificial ear, by a
-- technician) or entered manually. The audiometer only runs with a valid profile and a daily
-- listening check (ISO 8253-1) recorded on the same day.

CREATE TABLE IF NOT EXISTS public.hearing_calibration_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  transducer_model text CHECK (transducer_model IS NULL OR char_length(transducer_model) <= 80),
  transducer_serial text CHECK (transducer_serial IS NULL OR char_length(transducer_serial) <= 80),
  interface_model text CHECK (interface_model IS NULL OR char_length(interface_model) <= 120),
  technician text CHECK (technician IS NULL OR char_length(technician) <= 120),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  method text NOT NULL DEFAULT 'objective' CHECK (method IN ('objective', 'manual')),
  reference_dbfs numeric NOT NULL DEFAULT -20 CHECK (reference_dbfs BETWEEN -100 AND 0),
  max_dbfs numeric NOT NULL DEFAULT -3 CHECK (max_dbfs BETWEEN -40 AND 0),
  retspl jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(retspl) = 'object' AND octet_length(retspl::text) < 4000),
  measured_spl jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(measured_spl) = 'object' AND octet_length(measured_spl::text) < 8000),
  zero_hl jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(zero_hl) = 'object' AND octet_length(zero_hl::text) < 8000),
  calibrated_at date NOT NULL DEFAULT current_date,
  valid_until date NOT NULL DEFAULT (current_date + 365),
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hearing_calibration_validity CHECK (valid_until >= calibrated_at)
);

CREATE INDEX IF NOT EXISTS hearing_calibration_profiles_doctor_idx
  ON public.hearing_calibration_profiles (doctor_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hearing_calibration_profiles TO authenticated;
GRANT ALL ON public.hearing_calibration_profiles TO service_role;
ALTER TABLE public.hearing_calibration_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors manage own calibration profiles" ON public.hearing_calibration_profiles;
CREATE POLICY "Doctors manage own calibration profiles"
  ON public.hearing_calibration_profiles FOR ALL TO authenticated
  USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);

CREATE OR REPLACE FUNCTION private.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hearing_calibration_touch ON public.hearing_calibration_profiles;
CREATE TRIGGER hearing_calibration_touch
  BEFORE UPDATE ON public.hearing_calibration_profiles
  FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

-- Daily listening checks (ISO 8253-1): a record per check, kept for traceability.
CREATE TABLE IF NOT EXISTS public.hearing_daily_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.hearing_calibration_profiles(id) ON DELETE CASCADE,
  checked_at timestamptz NOT NULL DEFAULT now(),
  ok boolean NOT NULL,
  notes text CHECK (notes IS NULL OR char_length(notes) <= 500)
);

CREATE INDEX IF NOT EXISTS hearing_daily_checks_profile_idx
  ON public.hearing_daily_checks (profile_id, checked_at DESC);

GRANT SELECT, INSERT, DELETE ON public.hearing_daily_checks TO authenticated;
GRANT ALL ON public.hearing_daily_checks TO service_role;
ALTER TABLE public.hearing_daily_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors read own daily checks" ON public.hearing_daily_checks;
CREATE POLICY "Doctors read own daily checks"
  ON public.hearing_daily_checks FOR SELECT TO authenticated
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors record checks of own profiles" ON public.hearing_daily_checks;
CREATE POLICY "Doctors record checks of own profiles"
  ON public.hearing_daily_checks FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = doctor_id
    AND EXISTS (SELECT 1 FROM public.hearing_calibration_profiles p WHERE p.id = profile_id AND p.doctor_id = auth.uid())
  );

DROP POLICY IF EXISTS "Doctors delete own daily checks" ON public.hearing_daily_checks;
CREATE POLICY "Doctors delete own daily checks"
  ON public.hearing_daily_checks FOR DELETE TO authenticated
  USING (auth.uid() = doctor_id);

-- ===== 20261109000000_hearing_biological_calibration.sql =====
-- ENT Senses Hearing — biological calibration.
-- Adds the 'biological' method (0 dB HL estimated from the thresholds, in dBFS, of listeners with
-- normal hearing) and the column that keeps each listener's measurements for traceability.
ALTER TABLE public.hearing_calibration_profiles
  DROP CONSTRAINT IF EXISTS hearing_calibration_profiles_method_check;
ALTER TABLE public.hearing_calibration_profiles
  ADD CONSTRAINT hearing_calibration_profiles_method_check CHECK (method IN ('objective', 'manual', 'biological'));

ALTER TABLE public.hearing_calibration_profiles
  ADD COLUMN IF NOT EXISTS biological jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.hearing_calibration_profiles
  DROP CONSTRAINT IF EXISTS hearing_calibration_biological_shape;
ALTER TABLE public.hearing_calibration_profiles
  ADD CONSTRAINT hearing_calibration_biological_shape CHECK (jsonb_typeof(biological) = 'array' AND octet_length(biological::text) < 20000);

-- ===== 20261113000000_submission_notifications.sql =====
-- E-mail to the doctor when a patient sends a result (questionnaire, voice test, hearing check).
--
-- An AFTER INSERT trigger on the three result tables queues an HTTPS POST (pg_net, asynchronous:
-- the patient never waits for it and a failure never blocks the submission) to the Netlify
-- function netlify/functions/notify-submission.mts, which sends the e-mail.
--
-- Only rows with source = 'patient' notify (QR links and e-mail invitations); results the doctor
-- saves in clinic do not. Each doctor can switch it off in Settings (doctor_profiles.notify_submissions).
--
-- ONE-TIME SET-UP (Supabase → SQL Editor), with the same secret as NOTIFY_SECRET in Netlify:
--   INSERT INTO private.notification_settings (endpoint, secret)
--   VALUES ('https://entsenses.app/.netlify/functions/notify-submission', '<NOTIFY_SECRET>')
--   ON CONFLICT (id) DO UPDATE SET endpoint = excluded.endpoint, secret = excluded.secret;
-- Without that row nothing is sent.

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_net;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'pg_net not available: submission e-mails are disabled (%)', SQLERRM;
END $$;

ALTER TABLE public.doctor_profiles
  ADD COLUMN IF NOT EXISTS notify_submissions boolean NOT NULL DEFAULT true;

-- Endpoint and shared secret (single row). No grants: only the trigger (SECURITY DEFINER) reads it.
CREATE TABLE IF NOT EXISTS private.notification_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  endpoint text NOT NULL CHECK (endpoint ~ '^https://'),
  secret text NOT NULL CHECK (char_length(secret) >= 32)
);
REVOKE ALL ON private.notification_settings FROM PUBLIC, anon, authenticated;

-- Sent notifications, used to cap them per doctor (anonymous inserts must not become an e-mail flood).
CREATE TABLE IF NOT EXISTS private.notification_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id uuid NOT NULL,
  module text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notification_log_doctor_sent ON private.notification_log (doctor_id, sent_at DESC);
REVOKE ALL ON private.notification_log FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.notify_patient_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  max_per_hour CONSTANT integer := 30;
  r jsonb := to_jsonb(NEW);
  cfg record;
  prof record;
  addr text;
  module text;
  detail jsonb := '{}'::jsonb;
BEGIN
  IF r->>'source' IS DISTINCT FROM 'patient' THEN
    RETURN NEW;
  END IF;

  SELECT endpoint, secret INTO cfg FROM private.notification_settings WHERE id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT p.notify_submissions, p.language INTO prof FROM public.doctor_profiles p WHERE p.id = NEW.doctor_id;
  IF prof.notify_submissions IS FALSE THEN
    RETURN NEW;
  END IF;

  SELECT u.email INTO addr FROM auth.users u WHERE u.id = NEW.doctor_id;
  IF addr IS NULL THEN
    RETURN NEW;
  END IF;

  IF (SELECT count(*) FROM private.notification_log l
      WHERE l.doctor_id = NEW.doctor_id AND l.sent_at > now() - interval '1 hour') >= max_per_hour THEN
    RETURN NEW;
  END IF;

  module := CASE TG_TABLE_NAME
    WHEN 'patient_responses' THEN 'quest'
    WHEN 'voice_results' THEN 'voice'
    WHEN 'audiometry_sessions' THEN 'hearing'
  END;
  IF module = 'quest' THEN
    detail := jsonb_build_object(
      'questionnaire', r->>'questionnaire_name',
      'score', r->'total_score',
      'category', r->>'category'
    );
  END IF;

  BEGIN
    EXECUTE 'SELECT net.http_post(url := $1, body := $2, headers := $3, timeout_milliseconds := 10000)'
      USING cfg.endpoint,
        jsonb_build_object(
          'to', addr,
          'lang', coalesce(prof.language, 'es'),
          'module', module,
          'id', r->>'id',
          'label', r->>'label',
          'created_at', r->>'created_at',
          'detail', detail
        ),
        jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', cfg.secret);
    INSERT INTO private.notification_log (doctor_id, module) VALUES (NEW.doctor_id, module);
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_patient_submission: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.notify_patient_submission() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notify_patient_submission ON public.patient_responses;
CREATE TRIGGER notify_patient_submission
  AFTER INSERT ON public.patient_responses
  FOR EACH ROW EXECUTE FUNCTION private.notify_patient_submission();

DROP TRIGGER IF EXISTS notify_patient_submission ON public.voice_results;
CREATE TRIGGER notify_patient_submission
  AFTER INSERT ON public.voice_results
  FOR EACH ROW EXECUTE FUNCTION private.notify_patient_submission();

DROP TRIGGER IF EXISTS notify_patient_submission ON public.audiometry_sessions;
CREATE TRIGGER notify_patient_submission
  AFTER INSERT ON public.audiometry_sessions
  FOR EACH ROW EXECUTE FUNCTION private.notify_patient_submission();
