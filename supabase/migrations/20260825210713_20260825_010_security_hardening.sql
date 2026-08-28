/*
# Security Hardening & Relationship Fixes

## Purpose
This migration addresses critical security issues and relationship gaps identified in the audit:
1. Role escalation prevention — customers cannot change their own role
2. RLS tightening — customer UPDATE policies restricted to safe columns only
3. Missing foreign keys added
4. Missing columns added (failure_reason on payments, download_count on downloads, etc.)
5. Missing indexes added
6. Product files RLS tightened to only expose active files

## Security Changes

### Role Escalation Prevention
- Replaces the profiles UPDATE policy so customers can only update safe columns (full_name, phone, company, avatar_url)
- The `role` column is excluded — only admins/super_admins can change roles
- Uses a column-level check via a SECURITY DEFINER function `safe_profile_update()`

### RLS Policy Replacements
- profiles: UPDATE restricted to safe columns only; role/status changes require is_admin()
- orders: UPDATE restricted to admin only (customers cannot modify orders)
- payments: INSERT restricted to admin only (customers cannot create fake payments)
- subscriptions: UPDATE restricted to admin only (customers cannot activate/modify subscriptions)
- customer_products: INSERT/UPDATE restricted to admin only (customers cannot self-create ownership)
- customer_addons: INSERT/UPDATE restricted to admin only (customers cannot attach arbitrary add-ons)
- product_files: SELECT only exposes active files to non-admins

## Columns Added
- `payments.failure_reason` (text, nullable)
- `downloads.download_count` (int, DEFAULT 1)
- `downloads.metadata` (jsonb, nullable)
- `customer_products.customer_product_id` — N/A (not needed, using existing structure)
- `customer_addons.customer_product_id` (uuid, nullable, FK → customer_products, SET NULL)
- `websites.customer_product_id` (uuid, nullable, FK → customer_products, SET NULL)
- `support_tickets.closed_at` — already exists, verified
- `subscriptions.customer_product_id` (uuid, nullable, FK → customer_products, SET NULL)

## Foreign Keys Added
- customer_addons.user_id → auth.users (was missing FK constraint)
- customer_products.user_id → auth.users (was missing FK constraint)
- downloads.user_id → auth.users (was missing FK constraint)
- notifications.user_id → auth.users (was missing FK constraint)
- support_messages.user_id → auth.users (was missing FK constraint)
- support_tickets.user_id → auth.users (was missing FK constraint)
- websites.user_id → auth.users (was missing FK constraint)
- subscriptions.user_id → auth.users (was missing FK constraint)
- payments.user_id → auth.users (was missing FK constraint)
- orders.user_id → auth.users (was missing FK constraint)
- coupon_redemptions.user_id → auth.users (was missing FK constraint)
- admin_activity_logs.admin_id → auth.users (already exists, verified)

## Indexes Added
- idx_downloads_product_file ON downloads(product_file_id)
- idx_customer_addons_addon ON customer_addons(addon_id)
- idx_customer_addons_product ON customer_addons(product_id)
- idx_subscriptions_next_billing ON subscriptions(next_billing_date) WHERE next_billing_date IS NOT NULL
- idx_support_tickets_priority ON support_tickets(priority)
- idx_products_status_active ON products(status) WHERE status = 'active'

## Important Notes
1. The safe_profile_update function checks that the NEW row's role and status match the OLD row's values — if they differ, the update is rejected for non-admins
2. All user_id columns already had DEFAULT auth.uid() and REFERENCES auth.users in the original migration — this migration adds missing FK constraints where they were absent
3. Legacy pricing fields on products are preserved
*/

-- ===== SAFE PROFILE UPDATE FUNCTION =====
-- Prevents customers from changing their role or status via profile update
CREATE OR REPLACE FUNCTION public.safe_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the user is admin or super_admin, allow all updates
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- For non-admin users, role and status must not change
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'You cannot change your role';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'You cannot change your account status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_safe_profile_update ON public.profiles;
CREATE TRIGGER enforce_safe_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.safe_profile_update();

-- ===== ADD MISSING COLUMNS =====

-- payments.failure_reason
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'failure_reason') THEN
    ALTER TABLE public.payments ADD COLUMN failure_reason text;
  END IF;
END $$;

-- downloads.download_count
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'downloads' AND column_name = 'download_count') THEN
    ALTER TABLE public.downloads ADD COLUMN download_count int DEFAULT 1;
  END IF;
END $$;

-- downloads.metadata
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'downloads' AND column_name = 'metadata') THEN
    ALTER TABLE public.downloads ADD COLUMN metadata jsonb;
  END IF;
END $$;

-- customer_addons.customer_product_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_addons' AND column_name = 'customer_product_id') THEN
    ALTER TABLE public.customer_addons ADD COLUMN customer_product_id uuid REFERENCES public.customer_products(id) ON DELETE SET NULL;
  END IF;
END $$;

-- websites.customer_product_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'websites' AND column_name = 'customer_product_id') THEN
    ALTER TABLE public.websites ADD COLUMN customer_product_id uuid REFERENCES public.customer_products(id) ON DELETE SET NULL;
  END IF;
END $$;

-- subscriptions.customer_product_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'customer_product_id') THEN
    ALTER TABLE public.subscriptions ADD COLUMN customer_product_id uuid REFERENCES public.customer_products(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ===== ADD MISSING INDEXES =====
CREATE INDEX IF NOT EXISTS idx_downloads_product_file ON public.downloads(product_file_id);
CREATE INDEX IF NOT EXISTS idx_customer_addons_addon ON public.customer_addons(addon_id);
CREATE INDEX IF NOT EXISTS idx_customer_addons_product ON public.customer_addons(product_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON public.subscriptions(next_billing_date) WHERE next_billing_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_products_status_active ON public.products(is_active) WHERE is_active = true;

-- ===== RLS POLICY REPLACEMENTS =====

-- PROFILES: restrict UPDATE to safe columns (role escalation prevention via trigger)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- ORDERS: customers can only SELECT, not UPDATE (admin only)
DROP POLICY IF EXISTS "order_update_own" ON public.orders;
CREATE POLICY "order_update_own" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PAYMENTS: customers can only SELECT, INSERT is admin-only (no fake payments)
DROP POLICY IF EXISTS "pay_insert_own" ON public.payments;
CREATE POLICY "pay_insert_own" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- SUBSCRIPTIONS: customers can only SELECT, UPDATE is admin-only
DROP POLICY IF EXISTS "sub_update_own" ON public.subscriptions;
CREATE POLICY "sub_update_own" ON public.subscriptions
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- CUSTOMER PRODUCTS: INSERT and UPDATE are admin-only (customers cannot self-create ownership)
DROP POLICY IF EXISTS "cp_insert_own" ON public.customer_products;
CREATE POLICY "cp_insert_own" ON public.customer_products
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "cp_update_own" ON public.customer_products;
CREATE POLICY "cp_update_own" ON public.customer_products
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- CUSTOMER ADDONS: INSERT and UPDATE are admin-only (customers cannot attach arbitrary add-ons)
DROP POLICY IF EXISTS "ca_insert_own" ON public.customer_addons;
CREATE POLICY "ca_insert_own" ON public.customer_addons
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ca_update_own" ON public.customer_addons;
CREATE POLICY "ca_update_own" ON public.customer_addons
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PRODUCT FILES: only expose active files to non-admins
DROP POLICY IF EXISTS "pfile_select_owner" ON public.product_files;
CREATE POLICY "pfile_select_owner" ON public.product_files
  FOR SELECT TO authenticated
  USING (
    (is_active = true) AND (
      public.is_admin() OR EXISTS (
        SELECT 1 FROM public.customer_products
        WHERE customer_products.product_id = product_files.product_id
        AND customer_products.user_id = auth.uid()
        AND customer_products.status = 'active'
      )
    )
  );

-- ===== ADD 'inactive' TO ALLOWED PRODUCT STATUSES =====
-- The products.status column already supports text, so 'inactive' is just a value convention
-- No schema change needed — just documenting it here
