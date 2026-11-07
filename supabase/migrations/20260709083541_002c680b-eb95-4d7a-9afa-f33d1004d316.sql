-- Revoke EXECUTE on internal SECURITY DEFINER functions (only used by triggers).
-- (The Lovable email-queue functions that were also hardened here were removed together with the
-- email infrastructure: auth emails are now sent by Supabase Auth directly.)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
