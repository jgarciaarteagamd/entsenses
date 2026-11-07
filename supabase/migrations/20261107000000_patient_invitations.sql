-- Patient invitations: the doctor sends a questionnaire link (by their own e-mail client, a copied
-- link or the share sheet) with the patient's label assigned BEFORE sending. When the patient
-- answers, the response reaches the inbox already labelled.
--
-- Privacy: the patient's e-mail address is never stored (it only pre-fills the doctor's own
-- e-mail client). Only the label the doctor chose (initials / record number) is kept, exactly as
-- with labels added by hand in the inbox. The patient never sees the label.
--
-- Security: the link carries a random single-use token. Anonymous users cannot read this table;
-- they can only look up a token's status and submit through the two SECURITY DEFINER functions
-- below, which copy the label server-side.

CREATE TABLE IF NOT EXISTS public.patient_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  questionnaire_slug text NOT NULL CHECK (char_length(questionnaire_slug) BETWEEN 1 AND 100),
  variant text CHECK (variant IS NULL OR char_length(variant) <= 60),
  label text NOT NULL CHECK (char_length(btrim(label)) BETWEEN 1 AND 60),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '14 days',
  completed_at timestamptz,
  response_id uuid REFERENCES public.patient_responses(id) ON DELETE SET NULL,
  CONSTRAINT patient_invitations_expiry CHECK (expires_at > created_at AND expires_at <= created_at + interval '90 days')
);

CREATE INDEX IF NOT EXISTS patient_invitations_doctor_created_idx
  ON public.patient_invitations (doctor_id, created_at DESC);

-- Doctors may create (only these columns), read and delete their own invitations. The token,
-- completion time and response link are set by the database only.
GRANT SELECT, DELETE ON public.patient_invitations TO authenticated;
GRANT INSERT (doctor_id, questionnaire_slug, variant, label, expires_at) ON public.patient_invitations TO authenticated;
GRANT ALL ON public.patient_invitations TO service_role;

ALTER TABLE public.patient_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors create own invitations" ON public.patient_invitations;
CREATE POLICY "Doctors create own invitations"
  ON public.patient_invitations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors read own invitations" ON public.patient_invitations;
CREATE POLICY "Doctors read own invitations"
  ON public.patient_invitations FOR SELECT TO authenticated
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors delete own invitations" ON public.patient_invitations;
CREATE POLICY "Doctors delete own invitations"
  ON public.patient_invitations FOR DELETE TO authenticated
  USING (auth.uid() = doctor_id);

-- Public lookup: which questionnaire a token opens and whether it can still be answered.
-- Never returns the label or the doctor.
CREATE OR REPLACE FUNCTION public.get_invitation(_token uuid)
RETURNS TABLE (questionnaire_slug text, variant text, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.questionnaire_slug,
         i.variant,
         CASE
           WHEN i.completed_at IS NOT NULL THEN 'completed'
           WHEN i.expires_at <= now() THEN 'expired'
           ELSE 'pending'
         END
  FROM public.patient_invitations i
  WHERE i.token = _token
$$;

REVOKE ALL ON FUNCTION public.get_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation(uuid) TO anon, authenticated;

-- Public submission through an invitation: validates, scores, stores the response with the
-- doctor's label and closes the invitation, atomically. Returns the total score.
CREATE OR REPLACE FUNCTION public.submit_invited_response(_token uuid, _answers integer[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.patient_invitations%ROWTYPE;
  sc record;
  qname text;
  rid uuid;
  n integer := coalesce(array_length(_answers, 1), 0);
BEGIN
  SELECT * INTO inv FROM public.patient_invitations WHERE token = _token FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invitation_not_found';
  END IF;
  IF inv.completed_at IS NOT NULL THEN
    RAISE EXCEPTION 'invitation_completed';
  END IF;
  IF inv.expires_at <= now() THEN
    RAISE EXCEPTION 'invitation_expired';
  END IF;
  IF n = 0 OR n > 200 OR EXISTS (SELECT 1 FROM unnest(_answers) AS v WHERE v IS NULL OR v < 0 OR v > 10) THEN
    RAISE EXCEPTION 'invalid_answers';
  END IF;

  SELECT * INTO sc FROM public.calculate_questionnaire_score(inv.questionnaire_slug, _answers);
  SELECT q.name INTO qname FROM public.questionnaires q WHERE q.slug = inv.questionnaire_slug;

  INSERT INTO public.patient_responses
    (doctor_id, questionnaire_slug, questionnaire_name, answers, total_score, category, description, color, seen, label, source)
  VALUES
    (inv.doctor_id, inv.questionnaire_slug, coalesce(qname, inv.questionnaire_slug), _answers,
     coalesce(sc.total_score, 0), sc.category, sc.description, sc.color, false, btrim(inv.label), 'patient')
  RETURNING id INTO rid;

  UPDATE public.patient_invitations SET completed_at = now(), response_id = rid WHERE id = inv.id;
  RETURN coalesce(sc.total_score, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_invited_response(uuid, integer[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_invited_response(uuid, integer[]) TO anon, authenticated;

-- Live updates for the invitations list
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'patient_invitations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_invitations;
  END IF;
END $$;
