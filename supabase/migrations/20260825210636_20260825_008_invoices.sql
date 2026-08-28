/*
# Invoices Table

## Purpose
Adds a basic invoice architecture so the platform can generate invoices for orders. Customers can only see their own invoices; admins can see all.

## New Tables
- `invoices`
  - `id` (uuid, PK)
  - `invoice_number` (text, NOT NULL, UNIQUE) — human-readable invoice number
  - `user_id` (uuid, NOT NULL, DEFAULT auth.uid(), FK → auth.users, CASCADE)
  - `order_id` (uuid, nullable, FK → orders, SET NULL)
  - `currency` (text, DEFAULT 'USD')
  - `subtotal` (numeric(10,2), DEFAULT 0, CHECK >= 0)
  - `discount` (numeric(10,2), DEFAULT 0, CHECK >= 0)
  - `tax` (numeric(10,2), DEFAULT 0, CHECK >= 0)
  - `total` (numeric(10,2), DEFAULT 0, CHECK >= 0)
  - `status` (text, NOT NULL DEFAULT 'draft') — draft | issued | paid | void | cancelled
  - `issued_at` (timestamptz, nullable)
  - `due_at` (timestamptz, nullable)
  - `paid_at` (timestamptz, nullable)
  - `metadata` (jsonb, nullable)
  - `created_at` (timestamptz, DEFAULT now())
  - `updated_at` (timestamptz, DEFAULT now())

## Indexes
- idx_invoices_user ON invoices(user_id)
- idx_invoices_order ON invoices(order_id)
- idx_invoices_status ON invoices(status)
- idx_invoices_number ON invoices(invoice_number)

## Triggers
- invoices_updated_at BEFORE UPDATE trigger

## RLS
- Enable RLS on invoices
- SELECT: owner or admin
- INSERT: owner only (auth.uid() = user_id)
- UPDATE: admin only (customers cannot modify invoice status/totals)
- DELETE: admin only

## Important Notes
1. Customers can view their invoices but cannot modify them — only admins can change status or totals
2. Invoice numbers are unique
3. order_id is nullable to support standalone invoices if needed in the future
*/

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  currency text DEFAULT 'USD',
  subtotal numeric(10,2) DEFAULT 0 CHECK (subtotal >= 0),
  discount numeric(10,2) DEFAULT 0 CHECK (discount >= 0),
  tax numeric(10,2) DEFAULT 0 CHECK (tax >= 0),
  total numeric(10,2) DEFAULT 0 CHECK (total >= 0),
  status text NOT NULL DEFAULT 'draft',
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);

DROP TRIGGER IF EXISTS invoices_updated_at ON public.invoices;
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inv_select_own" ON public.invoices;
CREATE POLICY "inv_select_own" ON public.invoices
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "inv_insert_own" ON public.invoices;
CREATE POLICY "inv_insert_own" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "inv_update_admin" ON public.invoices;
CREATE POLICY "inv_update_admin" ON public.invoices
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "inv_delete_admin" ON public.invoices;
CREATE POLICY "inv_delete_admin" ON public.invoices
  FOR DELETE TO authenticated
  USING (public.is_admin());
