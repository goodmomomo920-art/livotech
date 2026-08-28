/*
# Fix: Revoke PUBLIC EXECUTE on SECURITY DEFINER Functions

## Purpose
PostgreSQL grants EXECUTE to PUBLIC by default when functions are created. The previous REVOKE from `anon` had no effect because the PUBLIC grant still applied. This migration revokes EXECUTE from PUBLIC on all SECURITY DEFINER functions, then grants to authenticated only.

## Security Changes
- REVOKE EXECUTE ON ALL SECURITY DEFINER functions FROM PUBLIC
- GRANT EXECUTE to authenticated on user-facing functions only
- Trigger functions (handle_new_user, safe_profile_update, update_updated_at) get no direct grants — they execute via triggers

## Important Notes
1. is_admin() and is_super_admin() are used inside RLS policies — they must be callable by authenticated
2. generate_signed_download_url checks ownership internally — must be callable by authenticated
3. handle_new_user and safe_profile_update are trigger functions — they run via triggers, not direct API calls
4. update_updated_at is SECURITY INVOKER — less concerning but still revoked from PUBLIC for hygiene
*/

-- Revoke from PUBLIC (this is the key fix — PUBLIC grant was overriding the anon revoke)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_signed_download_url(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.safe_profile_update() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC;

-- Also revoke from anon explicitly
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
