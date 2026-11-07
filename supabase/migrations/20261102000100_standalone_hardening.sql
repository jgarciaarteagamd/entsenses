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
