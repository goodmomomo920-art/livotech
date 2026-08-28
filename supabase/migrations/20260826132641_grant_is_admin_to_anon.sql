-- Grant EXECUTE on is_admin() and is_super_admin() to anon so that public
-- SELECT policies (which call is_admin() to decide whether to show inactive
-- rows) work for logged-out visitors. Without this, anon queries fail with
-- "permission denied for function is_admin" and return no rows at all.
-- Both functions are SECURITY DEFINER and return false when there is no
-- authenticated user, so exposing them to anon is safe.
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon;