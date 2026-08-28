/*
# Fix: Revoke authenticated EXECUTE on trigger-only SECURITY DEFINER Functions

## Purpose
handle_new_user and safe_profile_update are trigger functions — they execute via database triggers, not via direct API calls. Revoking EXECUTE from authenticated prevents them from being called via the REST API while still allowing the trigger to fire.

## Security Changes
- REVOKE EXECUTE on handle_new_user() and safe_profile_update() FROM authenticated
- These functions still work via their triggers (triggers execute with the table owner's privileges)

## Remaining Advisor Warnings (Expected)
- is_admin(), is_super_admin() — intentionally callable by authenticated (used in RLS policies)
- generate_signed_download_url(uuid) — intentionally callable by authenticated (checks ownership internally)
These 3 warnings are by design and not security risks.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.safe_profile_update() FROM authenticated;
