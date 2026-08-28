/*
# Fix: Revoke anon EXECUTE on SECURITY DEFINER Functions

## Purpose
The previous REVOKE statements did not fully take effect. This migration re-revokes EXECUTE from the anon role on all SECURITY DEFINER functions and grants to authenticated only.

## Security Changes
- REVOKE EXECUTE on all SECURITY DEFINER functions from anon
- GRANT EXECUTE on user-facing functions to authenticated
- handle_new_user and safe_profile_update are trigger functions — they don't need direct execution grants, but revoking from anon is still important for defense-in-depth

## Important Notes
1. is_admin() and is_super_admin() are used in RLS policies — they must be callable by authenticated
2. generate_signed_download_url must be callable by authenticated (it checks ownership internally)
3. handle_new_user is a trigger function — it runs via the trigger, not direct execution
4. safe_profile_update is a trigger function — it runs via the trigger, not direct execution
5. update_updated_at is SECURITY INVOKER (not DEFINER) so it's not a concern, but we revoke from anon anyway
*/

-- Revoke EXECUTE from anon on ALL security-relevant functions
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_signed_download_url(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.safe_profile_update() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon;

-- Grant EXECUTE to authenticated on user-facing functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_signed_download_url(uuid) TO authenticated;

-- Trigger functions don't need direct execution grants, but grant to authenticated for completeness
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_profile_update() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at() TO authenticated;
