
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
