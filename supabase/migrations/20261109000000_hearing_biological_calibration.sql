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
