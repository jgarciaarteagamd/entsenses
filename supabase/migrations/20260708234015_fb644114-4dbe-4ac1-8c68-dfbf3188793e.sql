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