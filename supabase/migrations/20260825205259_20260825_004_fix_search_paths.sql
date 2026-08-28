/*
# Fix Function Search Paths

## Security Changes
- Sets explicit `search_path = public` on all SECURITY DEFINER functions to prevent search path injection
- Also sets search_path on the update_updated_at trigger function for consistency

## Important Notes
1. This addresses the Supabase security advisor warnings about mutable search paths
2. Functions with fixed search_path are immune to search path manipulation attacks
*/

ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.is_super_admin() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_updated_at() SET search_path = public;
ALTER FUNCTION public.generate_signed_download_url(uuid) SET search_path = public;
