/*
# Product Plans Table

## Purpose
Introduces a dedicated `product_plans` table so a product can have multiple pricing plans (e.g. monthly, yearly, one-time, custom). Legacy pricing fields on `products` are preserved for backward compatibility — they are not removed.

## New Tables
- `product_plans`
  - `id` (uuid, PK)
  - `product_id` (uuid, FK → products, NOT NULL, CASCADE)
  - `name` (text, NOT NULL) — e.g. "Monthly", "Yearly", "One-time"
  - `slug` (text, NOT NULL) — URL-safe identifier
  - `description` (text, nullable)
  - `pricing_model` (text, NOT NULL DEFAULT 'one_time') — one_time | subscription | custom
  - `price` (numeric(10,2), NOT NULL DEFAULT 0, CHECK >= 0)
  - `currency` (text, DEFAULT 'USD')
  - `billing_interval` (text, nullable) — one_time | monthly | yearly (or future intervals)
  - `compare_at_price` (numeric(10,2), nullable, CHECK >= 0) — strikethrough price
  - `is_active` (boolean, DEFAULT true)
  - `is_default` (boolean, DEFAULT false) — marks the default plan shown first
  - `sort_order` (int, DEFAULT 0)
  - `created_at` (timestamptz, DEFAULT now())
  - `updated_at` (timestamptz, DEFAULT now())
  - UNIQUE(product_id, slug)

## Columns Added to Existing Tables
- `customer_products.plan_id` (uuid, nullable, FK → product_plans, SET NULL on delete)
- `order_items.plan_id` (uuid, nullable, FK → product_plans, SET NULL on delete)
- `subscriptions.plan_id` (uuid, nullable, FK → product_plans, SET NULL on delete)
- `websites.plan_id` (uuid, nullable, FK → product_plans, SET NULL on delete)

## Indexes
- idx_product_plans_product ON product_plans(product_id)
- idx_product_plans_default ON product_plans(product_id) WHERE is_default = true

## Triggers
- product_plans_updated_at BEFORE UPDATE trigger

## RLS
- Enable RLS on product_plans
- SELECT: anon + authenticated can read active plans (public catalog data)
- ALL (write): admin only via is_admin()

## Important Notes
1. Legacy `products.price`, `products.is_subscription`, `products.billing_interval` are preserved — not removed
2. plan_id columns on existing tables are nullable so existing rows are not broken
3. All plan_id FKs use ON DELETE SET NULL so deleting a plan does not cascade-delete financial records
*/

-- ===== PRODUCT PLANS TABLE =====
CREATE TABLE IF NOT EXISTS public.product_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  pricing_model text NOT NULL DEFAULT 'one_time' CHECK (pricing_model IN ('one_time', 'subscription', 'custom')),
  price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  currency text DEFAULT 'USD',
  billing_interval text,
  compare_at_price numeric(10,2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_product_plans_product ON public.product_plans(product_id);
CREATE INDEX IF NOT EXISTS idx_product_plans_default ON public.product_plans(product_id) WHERE is_default = true;

-- ===== ADD plan_id TO EXISTING TABLES =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_products' AND column_name = 'plan_id') THEN
    ALTER TABLE public.customer_products ADD COLUMN plan_id uuid REFERENCES public.product_plans(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'plan_id') THEN
    ALTER TABLE public.order_items ADD COLUMN plan_id uuid REFERENCES public.product_plans(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'plan_id') THEN
    ALTER TABLE public.subscriptions ADD COLUMN plan_id uuid REFERENCES public.product_plans(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'websites' AND column_name = 'plan_id') THEN
    ALTER TABLE public.websites ADD COLUMN plan_id uuid REFERENCES public.product_plans(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ===== ADD plan_name_snapshot TO order_items =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'plan_name_snapshot') THEN
    ALTER TABLE public.order_items ADD COLUMN plan_name_snapshot text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'billing_interval_snapshot') THEN
    ALTER TABLE public.order_items ADD COLUMN billing_interval_snapshot text;
  END IF;
END $$;

-- ===== TRIGGER =====
DROP TRIGGER IF EXISTS product_plans_updated_at ON public.product_plans;
CREATE TRIGGER product_plans_updated_at BEFORE UPDATE ON public.product_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== RLS =====
ALTER TABLE public.product_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pp_select_all" ON public.product_plans;
CREATE POLICY "pp_select_all" ON public.product_plans
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "pp_admin_write" ON public.product_plans;
CREATE POLICY "pp_admin_write" ON public.product_plans
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
