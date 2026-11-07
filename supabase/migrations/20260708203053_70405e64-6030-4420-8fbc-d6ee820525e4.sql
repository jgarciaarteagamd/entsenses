
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
