
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
