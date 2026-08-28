/*
# Fix RLS on roles table + restrict SECURITY DEFINER function execution

## Security Changes
- Enable RLS on `public.roles` table (was missing — flagged as ERROR by advisor)
- Add SELECT policy on roles allowing anon+authenticated read (roles are reference data, not sensitive)
- Revoke EXECUTE on SECURITY DEFINER functions from anon role, grant to authenticated only

## Important Notes
1. The roles table is reference data — customers need to see role names, but cannot modify them
2. SECURITY DEFINER functions (is_admin, is_super_admin, handle_new_user, generate_signed_download_url) should only be callable by authenticated users, not anon
3. handle_new_user is a trigger function — it runs via the trigger, not direct execution, so revoking anon EXECUTE is safe
*/

-- Enable RLS on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_select_all" ON public.roles;
CREATE POLICY "roles_select_all" ON public.roles FOR SELECT TO anon, authenticated USING (true);

-- Revoke EXECUTE from anon on all SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_signed_download_url(uuid) FROM anon;

-- Grant EXECUTE to authenticated
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_signed_download_url(uuid) TO authenticated;
