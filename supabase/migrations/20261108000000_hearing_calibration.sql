-- ENT Senses Hearing — calibration profiles and daily checks for the in-clinic audiometer.
--
-- A calibration profile describes one fixed chain (audiometric headphones + audio interface +
-- fixed system volume) and stores, per ear and frequency, the digital level (dBFS) that produces
-- 0 dB HL. It is filled from an objective calibration (sound level meter + artificial ear, by a
-- technician) or entered manually. The audiometer only runs with a valid profile and a daily
-- listening check (ISO 8253-1) recorded on the same day.

CREATE TABLE IF NOT EXISTS public.hearing_calibration_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  transducer_model text CHECK (transducer_model IS NULL OR char_length(transducer_model) <= 80),
  transducer_serial text CHECK (transducer_serial IS NULL OR char_length(transducer_serial) <= 80),
  interface_model text CHECK (interface_model IS NULL OR char_length(interface_model) <= 120),
  technician text CHECK (technician IS NULL OR char_length(technician) <= 120),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  method text NOT NULL DEFAULT 'objective' CHECK (method IN ('objective', 'manual')),
  reference_dbfs numeric NOT NULL DEFAULT -20 CHECK (reference_dbfs BETWEEN -100 AND 0),
  max_dbfs numeric NOT NULL DEFAULT -3 CHECK (max_dbfs BETWEEN -40 AND 0),
  retspl jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(retspl) = 'object' AND octet_length(retspl::text) < 4000),
  measured_spl jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(measured_spl) = 'object' AND octet_length(measured_spl::text) < 8000),
  zero_hl jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(zero_hl) = 'object' AND octet_length(zero_hl::text) < 8000),
  calibrated_at date NOT NULL DEFAULT current_date,
  valid_until date NOT NULL DEFAULT (current_date + 365),
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hearing_calibration_validity CHECK (valid_until >= calibrated_at)
);

CREATE INDEX IF NOT EXISTS hearing_calibration_profiles_doctor_idx
  ON public.hearing_calibration_profiles (doctor_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hearing_calibration_profiles TO authenticated;
GRANT ALL ON public.hearing_calibration_profiles TO service_role;
ALTER TABLE public.hearing_calibration_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors manage own calibration profiles" ON public.hearing_calibration_profiles;
CREATE POLICY "Doctors manage own calibration profiles"
  ON public.hearing_calibration_profiles FOR ALL TO authenticated
  USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);

CREATE OR REPLACE FUNCTION private.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hearing_calibration_touch ON public.hearing_calibration_profiles;
CREATE TRIGGER hearing_calibration_touch
  BEFORE UPDATE ON public.hearing_calibration_profiles
  FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

-- Daily listening checks (ISO 8253-1): a record per check, kept for traceability.
CREATE TABLE IF NOT EXISTS public.hearing_daily_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.hearing_calibration_profiles(id) ON DELETE CASCADE,
  checked_at timestamptz NOT NULL DEFAULT now(),
  ok boolean NOT NULL,
  notes text CHECK (notes IS NULL OR char_length(notes) <= 500)
);

CREATE INDEX IF NOT EXISTS hearing_daily_checks_profile_idx
  ON public.hearing_daily_checks (profile_id, checked_at DESC);

GRANT SELECT, INSERT, DELETE ON public.hearing_daily_checks TO authenticated;
GRANT ALL ON public.hearing_daily_checks TO service_role;
ALTER TABLE public.hearing_daily_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors read own daily checks" ON public.hearing_daily_checks;
CREATE POLICY "Doctors read own daily checks"
  ON public.hearing_daily_checks FOR SELECT TO authenticated
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors record checks of own profiles" ON public.hearing_daily_checks;
CREATE POLICY "Doctors record checks of own profiles"
  ON public.hearing_daily_checks FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = doctor_id
    AND EXISTS (SELECT 1 FROM public.hearing_calibration_profiles p WHERE p.id = profile_id AND p.doctor_id = auth.uid())
  );

DROP POLICY IF EXISTS "Doctors delete own daily checks" ON public.hearing_daily_checks;
CREATE POLICY "Doctors delete own daily checks"
  ON public.hearing_daily_checks FOR DELETE TO authenticated
  USING (auth.uid() = doctor_id);
