
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
