-- Manual transcriptions may be corrected; recorded measurements may not.
-- A doctor can update the audiogram of a session ONLY when it was typed in by hand
-- (source = 'doctor', calibrated = false, device.entry = 'manual'). Patient checks and calibrated
-- sessions stay exactly as recorded.
GRANT UPDATE (seen, label, report, audiogram) ON public.audiometry_sessions TO authenticated;

CREATE OR REPLACE FUNCTION private.guard_audiogram_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.audiogram IS DISTINCT FROM OLD.audiogram
     AND (OLD.source <> 'doctor' OR OLD.calibrated OR coalesce(OLD.device->>'entry', '') <> 'manual') THEN
    RAISE EXCEPTION 'audiogram_immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_audiogram_update ON public.audiometry_sessions;
CREATE TRIGGER guard_audiogram_update
  BEFORE UPDATE ON public.audiometry_sessions
  FOR EACH ROW EXECUTE FUNCTION private.guard_audiogram_update();
