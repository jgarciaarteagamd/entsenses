-- ENT Senses Hearing — initial schema (originally Auditone Test).
-- Idempotent: safe on a fresh Supabase project and on a project that already has the ENT Quest /
-- Vocalyzer tables (doctor_profiles and private.doctor_exists are created only if missing, with
-- the same shape).
--
-- Privacy model: patient (remote) results are anonymous and numerical only. Remote results are
-- ALWAYS stored as calibrated = false (informative). Clinical data (report) can only be written by
-- the authenticated doctor.

-- ---------------------------------------------------------------------------------------------
-- Doctor profiles (same columns as ENT Quest / Vocalyzer)
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  country TEXT,
  city TEXT,
  postal_code TEXT,
  license_number TEXT,
  language TEXT NOT NULL DEFAULT 'es',
  terms_accepted_at TIMESTAMPTZ,
  professional_declaration_at TIMESTAMPTZ,
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_profiles TO authenticated;
GRANT ALL ON public.doctor_profiles TO service_role;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doctor_profiles' AND policyname = 'Users read own profile') THEN
    CREATE POLICY "Users read own profile" ON public.doctor_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doctor_profiles' AND policyname = 'Users insert own profile') THEN
    CREATE POLICY "Users insert own profile" ON public.doctor_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doctor_profiles' AND policyname = 'Users update own profile') THEN
    CREATE POLICY "Users update own profile" ON public.doctor_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doctor_profiles' AND policyname = 'Users delete own profile') THEN
    CREATE POLICY "Users delete own profile" ON public.doctor_profiles FOR DELETE TO authenticated USING (auth.uid() = id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------------------------
-- Helper: does a doctor (auth user) exist? Non-exposed schema; used by the anonymous INSERT policy.
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

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Audiometry sessions
--   source = 'patient' → remote informative test from the QR (never calibrated)
--   source = 'doctor'  → in-clinic session (calibrated only with a valid calibration profile)
CREATE TABLE IF NOT EXISTS public.audiometry_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'patient' CHECK (source IN ('patient', 'doctor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  seen boolean NOT NULL DEFAULT false,
  label text CHECK (label IS NULL OR char_length(label) <= 60),
  sex text NOT NULL DEFAULT 'unspecified' CHECK (sex IN ('male', 'female', 'unspecified')),
  age_group text NOT NULL DEFAULT 'unspecified' CHECK (age_group IN ('<18', '18-39', '40-59', '60+', 'unspecified')),
  language text NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en')),
  app_version text NOT NULL CHECK (char_length(app_version) BETWEEN 1 AND 40),
  calibrated boolean NOT NULL DEFAULT false,
  -- Transducer used (type, wired/wireless, model) and calibration profile reference, if any.
  device jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(device) = 'object' AND octet_length(device::text) < 4000),
  -- Patient questionnaire (symptoms, red flags).
  questionnaire jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(questionnaire) = 'object' AND octet_length(questionnaire::text) < 8000),
  -- Air-conduction thresholds (AudiogramData shape from AudiometricReport).
  audiogram jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(audiogram) = 'object' AND octet_length(audiogram::text) < 20000),
  -- Reliability and quality indicators (retest, false positives, warnings).
  quality jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(quality) = 'object' AND octet_length(quality::text) < 8000),
  -- Doctor-only report data (impedance, speech audiometry, history, diagnosis).
  report jsonb CHECK (report IS NULL OR (jsonb_typeof(report) = 'object' AND octet_length(report::text) < 60000))
);

CREATE INDEX IF NOT EXISTS audiometry_sessions_doctor_created_idx ON public.audiometry_sessions (doctor_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.audiometry_sessions TO authenticated;
GRANT INSERT ON public.audiometry_sessions TO anon;
-- Measurements are immutable once stored; doctors may only change these columns.
REVOKE UPDATE ON public.audiometry_sessions FROM authenticated;
GRANT UPDATE (seen, label, report) ON public.audiometry_sessions TO authenticated;
GRANT ALL ON public.audiometry_sessions TO service_role;

ALTER TABLE public.audiometry_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anonymous patients can submit sessions" ON public.audiometry_sessions;
CREATE POLICY "Anonymous patients can submit sessions"
  ON public.audiometry_sessions
  FOR INSERT
  TO anon
  WITH CHECK (
    doctor_id IS NOT NULL
    AND private.doctor_exists(doctor_id)
    AND source = 'patient'
    AND calibrated = false
    AND seen = false
    AND label IS NULL
    AND report IS NULL
  );

DROP POLICY IF EXISTS "Doctors insert own sessions" ON public.audiometry_sessions;
CREATE POLICY "Doctors insert own sessions"
  ON public.audiometry_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors read own sessions" ON public.audiometry_sessions;
CREATE POLICY "Doctors read own sessions"
  ON public.audiometry_sessions FOR SELECT TO authenticated
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors update own sessions" ON public.audiometry_sessions;
CREATE POLICY "Doctors update own sessions"
  ON public.audiometry_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors delete own sessions" ON public.audiometry_sessions;
CREATE POLICY "Doctors delete own sessions"
  ON public.audiometry_sessions FOR DELETE TO authenticated
  USING (auth.uid() = doctor_id);

-- Live inbox updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'audiometry_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audiometry_sessions;
  END IF;
END $$;
