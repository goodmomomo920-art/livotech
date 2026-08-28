/*
# Product Type Addon Compatibility

## Purpose
Adds a `product_type_addons` table so add-ons can be marked compatible at the product-type level (e.g. "Loyalty Points" is compatible with all "Website" products), without manually attaching it to every individual product.

## New Tables
- `product_type_addons`
  - `id` (uuid, PK)
  - `product_type_id` (uuid, FK → product_types, NOT NULL, CASCADE)
  - `addon_id` (uuid, FK → addons, NOT NULL, CASCADE)
  - `is_active` (boolean, DEFAULT true)
  - `created_at` (timestamptz, DEFAULT now())
  - UNIQUE(product_type_id, addon_id)

## Indexes
- idx_pta_type ON product_type_addons(product_type_id)
- idx_pta_addon ON product_type_addons(addon_id)

## RLS
- Enable RLS on product_type_addons
- SELECT: anon + authenticated can read (public catalog data)
- ALL (write): admin only via is_admin()

## Important Notes
1. This complements the existing `product_addons` table — individual product compatibility still works
2. The frontend can union both product_addons and product_type_addons to determine full compatibility
3. This avoids manually attaching every add-on to every product of a given type
*/

CREATE TABLE IF NOT EXISTS public.product_type_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type_id uuid NOT NULL REFERENCES public.product_types(id) ON DELETE CASCADE,
  addon_id uuid NOT NULL REFERENCES public.addons(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_type_id, addon_id)
);

CREATE INDEX IF NOT EXISTS idx_pta_type ON public.product_type_addons(product_type_id);
CREATE INDEX IF NOT EXISTS idx_pta_addon ON public.product_type_addons(addon_id);

ALTER TABLE public.product_type_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pta_select_all" ON public.product_type_addons;
CREATE POLICY "pta_select_all" ON public.product_type_addons
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "pta_admin_write" ON public.product_type_addons;
CREATE POLICY "pta_admin_write" ON public.product_type_addons
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
