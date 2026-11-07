
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
