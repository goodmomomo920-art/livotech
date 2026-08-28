/*
# Add coupon usage increment function

Creates a SECURITY DEFINER function to atomically increment coupon usage_count.
This is called by the verify-payment edge function after a successful payment.
*/

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.coupons
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE id = coupon_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(uuid) TO authenticated;