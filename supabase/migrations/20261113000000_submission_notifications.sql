-- E-mail to the doctor when a patient sends a result (questionnaire, voice test, hearing check).
--
-- An AFTER INSERT trigger on the three result tables queues an HTTPS POST (pg_net, asynchronous:
-- the patient never waits for it and a failure never blocks the submission) to the Netlify
-- function netlify/functions/notify-submission.mts, which sends the e-mail.
--
-- Only rows with source = 'patient' notify (QR links and e-mail invitations); results the doctor
-- saves in clinic do not. Each doctor can switch it off in Settings (doctor_profiles.notify_submissions).
--
-- ONE-TIME SET-UP (Supabase → SQL Editor), with the same secret as NOTIFY_SECRET in Netlify:
--   INSERT INTO private.notification_settings (endpoint, secret)
--   VALUES ('https://entsenses.app/.netlify/functions/notify-submission', '<NOTIFY_SECRET>')
--   ON CONFLICT (id) DO UPDATE SET endpoint = excluded.endpoint, secret = excluded.secret;
-- Without that row nothing is sent.

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_net;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'pg_net not available: submission e-mails are disabled (%)', SQLERRM;
END $$;

ALTER TABLE public.doctor_profiles
  ADD COLUMN IF NOT EXISTS notify_submissions boolean NOT NULL DEFAULT true;

-- Endpoint and shared secret (single row). No grants: only the trigger (SECURITY DEFINER) reads it.
CREATE TABLE IF NOT EXISTS private.notification_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  endpoint text NOT NULL CHECK (endpoint ~ '^https://'),
  secret text NOT NULL CHECK (char_length(secret) >= 32)
);
REVOKE ALL ON private.notification_settings FROM PUBLIC, anon, authenticated;

-- Sent notifications, used to cap them per doctor (anonymous inserts must not become an e-mail flood).
CREATE TABLE IF NOT EXISTS private.notification_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id uuid NOT NULL,
  module text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notification_log_doctor_sent ON private.notification_log (doctor_id, sent_at DESC);
REVOKE ALL ON private.notification_log FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.notify_patient_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  max_per_hour CONSTANT integer := 30;
  r jsonb := to_jsonb(NEW);
  cfg record;
  prof record;
  addr text;
  module text;
  detail jsonb := '{}'::jsonb;
BEGIN
  IF r->>'source' IS DISTINCT FROM 'patient' THEN
    RETURN NEW;
  END IF;

  SELECT endpoint, secret INTO cfg FROM private.notification_settings WHERE id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT p.notify_submissions, p.language INTO prof FROM public.doctor_profiles p WHERE p.id = NEW.doctor_id;
  IF prof.notify_submissions IS FALSE THEN
    RETURN NEW;
  END IF;

  SELECT u.email INTO addr FROM auth.users u WHERE u.id = NEW.doctor_id;
  IF addr IS NULL THEN
    RETURN NEW;
  END IF;

  IF (SELECT count(*) FROM private.notification_log l
      WHERE l.doctor_id = NEW.doctor_id AND l.sent_at > now() - interval '1 hour') >= max_per_hour THEN
    RETURN NEW;
  END IF;

  module := CASE TG_TABLE_NAME
    WHEN 'patient_responses' THEN 'quest'
    WHEN 'voice_results' THEN 'voice'
    WHEN 'audiometry_sessions' THEN 'hearing'
  END;
  IF module = 'quest' THEN
    detail := jsonb_build_object(
      'questionnaire', r->>'questionnaire_name',
      'score', r->'total_score',
      'category', r->>'category'
    );
  END IF;

  BEGIN
    EXECUTE 'SELECT net.http_post(url := $1, body := $2, headers := $3, timeout_milliseconds := 10000)'
      USING cfg.endpoint,
        jsonb_build_object(
          'to', addr,
          'lang', coalesce(prof.language, 'es'),
          'module', module,
          'id', r->>'id',
          'label', r->>'label',
          'created_at', r->>'created_at',
          'detail', detail
        ),
        jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', cfg.secret);
    INSERT INTO private.notification_log (doctor_id, module) VALUES (NEW.doctor_id, module);
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_patient_submission: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.notify_patient_submission() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notify_patient_submission ON public.patient_responses;
CREATE TRIGGER notify_patient_submission
  AFTER INSERT ON public.patient_responses
  FOR EACH ROW EXECUTE FUNCTION private.notify_patient_submission();

DROP TRIGGER IF EXISTS notify_patient_submission ON public.voice_results;
CREATE TRIGGER notify_patient_submission
  AFTER INSERT ON public.voice_results
  FOR EACH ROW EXECUTE FUNCTION private.notify_patient_submission();

DROP TRIGGER IF EXISTS notify_patient_submission ON public.audiometry_sessions;
CREATE TRIGGER notify_patient_submission
  AFTER INSERT ON public.audiometry_sessions
  FOR EACH ROW EXECUTE FUNCTION private.notify_patient_submission();
