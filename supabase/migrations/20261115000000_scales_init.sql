-- ENT Senses Scales — clinician-rated scales (endoscopy, imaging, staging).
-- One row per assessment (a visit): the doctor opens a pack (e.g. rhinology), rates the scales
-- examined that day and saves them together, with the patient's label.
--
-- Privacy model: no anonymous access at all (patients never submit to Scales); no free text, only
-- the label. Definitions and scoring live in the app (src/modules/scales/lib); `summary` keeps the
-- computed scores so the inbox and the follow-up chart do not have to recompute them.

CREATE TABLE IF NOT EXISTS public.scale_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  assessed_on date NOT NULL DEFAULT current_date
    CHECK (assessed_on BETWEEN DATE '1990-01-01' AND current_date + 1),
  label text CHECK (label IS NULL OR char_length(label) <= 60),
  pack text NOT NULL CHECK (pack ~ '^[a-z][a-z0-9_]{1,29}$'),
  pack_version text NOT NULL CHECK (char_length(pack_version) BETWEEN 1 AND 40),
  scales jsonb NOT NULL CHECK (jsonb_typeof(scales) = 'object' AND octet_length(scales::text) < 20000),
  summary jsonb NOT NULL CHECK (jsonb_typeof(summary) = 'object' AND octet_length(summary::text) < 10000)
);

CREATE INDEX IF NOT EXISTS scale_assessments_doctor_date_idx
  ON public.scale_assessments (doctor_id, assessed_on DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS scale_assessments_doctor_label_idx
  ON public.scale_assessments (doctor_id, label);

-- Keeps updated_at current on every edit.
CREATE OR REPLACE FUNCTION public.scale_assessments_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS scale_assessments_touch ON public.scale_assessments;
CREATE TRIGGER scale_assessments_touch
  BEFORE UPDATE ON public.scale_assessments
  FOR EACH ROW EXECUTE FUNCTION public.scale_assessments_touch();

REVOKE ALL ON public.scale_assessments FROM anon;
GRANT SELECT, INSERT, DELETE ON public.scale_assessments TO authenticated;
-- The owner and the pack of a row never change; everything the doctor rated can be corrected.
REVOKE UPDATE ON public.scale_assessments FROM authenticated;
GRANT UPDATE (assessed_on, label, pack_version, scales, summary) ON public.scale_assessments TO authenticated;
GRANT ALL ON public.scale_assessments TO service_role;

ALTER TABLE public.scale_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors read own assessments" ON public.scale_assessments;
CREATE POLICY "Doctors read own assessments"
  ON public.scale_assessments FOR SELECT TO authenticated
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors insert own assessments" ON public.scale_assessments;
CREATE POLICY "Doctors insert own assessments"
  ON public.scale_assessments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors update own assessments" ON public.scale_assessments;
CREATE POLICY "Doctors update own assessments"
  ON public.scale_assessments FOR UPDATE TO authenticated
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors delete own assessments" ON public.scale_assessments;
CREATE POLICY "Doctors delete own assessments"
  ON public.scale_assessments FOR DELETE TO authenticated
  USING (auth.uid() = doctor_id);
