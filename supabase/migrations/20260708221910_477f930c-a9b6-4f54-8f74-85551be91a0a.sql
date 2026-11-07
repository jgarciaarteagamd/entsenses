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
