/*
# LivoTech Extended Schema — Permissions, Staff, Storage, Seed Data

## New Tables
- `permissions` — individual permission definitions (slug-based)
- `role_permissions` — maps permissions to roles (many-to-many)
- `staff` — staff member records linked to auth.users with role assignment

## Storage Buckets
- `product-images` — public bucket for product thumbnails/images
- `product-files` — private bucket for paid downloadable files
- `customer-attachments` — private bucket for support ticket attachments
- `website-assets` — public bucket for website deployment assets

## Seed Data
- Product types: website, saas, business_system, digital_product, ebook, other
- Categories: websites, business-systems, digital-products, tools, ebooks
- Demo products: Pharmacy Website, Restaurant Website, Dental Clinic Website, POS System, Inventory System, E-commerce Template, E-book
- Demo add-ons: Loyalty Points, Coupons, Reviews, Wishlist, Push Notifications, Delivery
- Product-addon compatibility mappings

## Database Functions
- `generate_signed_download_url` — SECURITY DEFINER function that verifies ownership before returning a signed URL to a private product file

## Important Notes
1. Permissions table uses slug-based lookups for flexible RBAC
2. Staff table is admin-managed only — users cannot self-assign staff status
3. Product files bucket is PRIVATE — downloads require ownership verification
4. All seed data is clearly demo data, no fake purchases or revenue
*/

-- ===== PERMISSIONS =====
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id text NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

-- ===== STAFF =====
CREATE TABLE IF NOT EXISTS public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id text NOT NULL REFERENCES public.roles(id),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- RLS policies for permissions (admin-only)
DROP POLICY IF EXISTS "perm_select_admin" ON public.permissions;
CREATE POLICY "perm_select_admin" ON public.permissions FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "perm_admin_write" ON public.permissions;
CREATE POLICY "perm_admin_write" ON public.permissions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- RLS policies for role_permissions (admin-only)
DROP POLICY IF EXISTS "rp_select_admin" ON public.role_permissions;
CREATE POLICY "rp_select_admin" ON public.role_permissions FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "rp_admin_write" ON public.role_permissions;
CREATE POLICY "rp_admin_write" ON public.role_permissions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- RLS policies for staff (admin-only)
DROP POLICY IF EXISTS "staff_select_admin" ON public.staff;
CREATE POLICY "staff_select_admin" ON public.staff FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "staff_admin_write" ON public.staff;
CREATE POLICY "staff_admin_write" ON public.staff FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Trigger for staff updated_at
DROP TRIGGER IF EXISTS staff_updated_at ON public.staff;
CREATE TRIGGER staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== STORAGE BUCKETS =====
INSERT INTO storage.buckets (id, name, public) VALUES
  ('product-images', 'product-images', true),
  ('product-files', 'product-files', false),
  ('customer-attachments', 'customer-attachments', false),
  ('website-assets', 'website-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: product-images (public read, admin write)
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_admin_write" ON storage.objects;
CREATE POLICY "product_images_admin_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

-- Storage policies: product-files (private, owner-only via signed URLs, admin upload)
DROP POLICY IF EXISTS "product_files_admin_read" ON storage.objects;
CREATE POLICY "product_files_admin_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'product-files' AND public.is_admin());

DROP POLICY IF EXISTS "product_files_admin_write" ON storage.objects;
CREATE POLICY "product_files_admin_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-files' AND public.is_admin());

-- Storage policies: customer-attachments (private, owner-only)
DROP POLICY IF EXISTS "customer_attachments_owner_read" ON storage.objects;
CREATE POLICY "customer_attachments_owner_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'customer-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "customer_attachments_owner_write" ON storage.objects;
CREATE POLICY "customer_attachments_owner_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'customer-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: website-assets (public read, owner write)
DROP POLICY IF EXISTS "website_assets_public_read" ON storage.objects;
CREATE POLICY "website_assets_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'website-assets');

DROP POLICY IF EXISTS "website_assets_owner_write" ON storage.objects;
CREATE POLICY "website_assets_owner_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'website-assets' AND (public.is_admin() OR auth.uid()::text = (storage.foldername(name))[1]));

-- ===== SECURE DOWNLOAD FUNCTION =====
CREATE OR REPLACE FUNCTION public.generate_signed_download_url(p_product_file_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_storage_path text;
  v_owns_product boolean;
BEGIN
  -- Get the file's storage path
  SELECT storage_path INTO v_storage_path
  FROM public.product_files
  WHERE id = p_product_file_id AND is_active = true;

  IF v_storage_path IS NULL THEN
    RAISE EXCEPTION 'File not found or inactive';
  END IF;

  -- Check ownership: does the current user have an active customer_products record for this file's product?
  SELECT EXISTS(
    SELECT 1 FROM public.customer_products
    WHERE product_id = (SELECT product_id FROM public.product_files WHERE id = p_product_file_id)
    AND user_id = auth.uid()
    AND status = 'active'
  ) INTO v_owns_product;

  -- Admins can download any file
  IF NOT v_owns_product AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'You do not have access to this file';
  END IF;

  -- Record the download
  INSERT INTO public.downloads (user_id, product_id, product_file_id, file_name)
  SELECT auth.uid(), pf.product_id, pf.id, pf.file_name
  FROM public.product_files pf
  WHERE pf.id = p_product_file_id;

  -- Return the storage path (frontend uses supabase.storage.from('product-files').createSignedUrl)
  RETURN v_storage_path;
END;
$$;

-- ===== SEED DATA: PRODUCT TYPES =====
INSERT INTO public.product_types (name, slug, description, sort_order) VALUES
  ('Website', 'website', 'Ready-to-launch websites for any business', 1),
  ('SaaS', 'saas', 'Software as a Service products', 2),
  ('Business System', 'business_system', 'Complete systems to run your business (POS, inventory, etc.)', 3),
  ('Digital Product', 'digital_product', 'Templates, tools, and digital resources', 4),
  ('E-book', 'ebook', 'Guides, handbooks, and educational material', 5),
  ('Other', 'other', 'Other product types', 6)
ON CONFLICT (slug) DO NOTHING;

-- ===== SEED DATA: CATEGORIES =====
INSERT INTO public.categories (name, slug, description, icon, sort_order) VALUES
  ('Websites', 'websites', 'Beautiful, ready-to-launch websites for any business', 'globe', 1),
  ('Business Systems', 'business-systems', 'Complete systems to run your business — POS, inventory, and more', 'bar-chart', 2),
  ('Digital Products', 'digital-products', 'Templates, tools, guides and digital resources', 'file-text', 3),
  ('Tools', 'tools', 'Utilities and tools to help you work faster', 'settings', 4),
  ('E-books', 'ebooks', 'Guides, handbooks, and educational material', 'book-open', 5)
ON CONFLICT (slug) DO NOTHING;

-- ===== SEED DATA: PRODUCTS =====
-- Get category and type IDs via subqueries
INSERT INTO public.products (name, slug, short_description, description, product_type_id, category_id, price, compare_at_price, currency, pricing_model, billing_interval, is_subscription, is_downloadable, is_featured, status, is_active, sort_order)
SELECT
  'Pharmacy Website', 'pharmacy-website',
  'A complete website for pharmacies with online ordering and prescription management.',
  'A full-featured pharmacy website with online ordering, prescription management, delivery integration, and a modern, responsive design. Includes product catalog, search, and customer account management.',
  pt.id, c.id, 79.00, 99.00, 'USD', 'subscription', 'month', true, false, true, 'active', true, 1
FROM public.product_types pt, public.categories c
WHERE pt.slug = 'website' AND c.slug = 'websites'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, short_description, description, product_type_id, category_id, price, compare_at_price, currency, pricing_model, billing_interval, is_subscription, is_downloadable, is_featured, status, is_active, sort_order)
SELECT
  'Restaurant Website', 'restaurant-website',
  'A modern restaurant website with menu display and online ordering.',
  'A beautiful restaurant website with menu display, table reservations, online ordering, and a responsive design. Includes photo galleries, special offers, and customer reviews.',
  pt.id, c.id, 69.00, 89.00, 'USD', 'subscription', 'month', true, false, true, 'active', true, 2
FROM public.product_types pt, public.categories c
WHERE pt.slug = 'website' AND c.slug = 'websites'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, short_description, description, product_type_id, category_id, price, compare_at_price, currency, pricing_model, billing_interval, is_subscription, is_downloadable, is_featured, status, is_active, sort_order)
SELECT
  'Dental Clinic Website', 'dental-clinic-website',
  'A professional website for dental clinics with appointment booking.',
  'A professional dental clinic website with appointment booking, doctor profiles, service descriptions, patient reviews, and a clean, modern design.',
  pt.id, c.id, 75.00, 95.00, 'USD', 'subscription', 'month', true, false, false, 'active', true, 3
FROM public.product_types pt, public.categories c
WHERE pt.slug = 'website' AND c.slug = 'websites'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, short_description, description, product_type_id, category_id, price, compare_at_price, currency, pricing_model, billing_interval, is_subscription, is_downloadable, is_featured, status, is_active, sort_order)
SELECT
  'POS System', 'pos-system',
  'A powerful point-of-sale system for retail and hospitality.',
  'A complete POS system with sales tracking, inventory management, staff permissions, receipt printing, and real-time reporting. Works on any device.',
  pt.id, c.id, 79.00, 129.00, 'USD', 'subscription', 'month', true, false, true, 'active', true, 1
FROM public.product_types pt, public.categories c
WHERE pt.slug = 'business_system' AND c.slug = 'business-systems'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, short_description, description, product_type_id, category_id, price, compare_at_price, currency, pricing_model, billing_interval, is_subscription, is_downloadable, is_featured, status, is_active, sort_order)
SELECT
  'Inventory System', 'inventory-system',
  'Real-time inventory management with stock tracking and alerts.',
  'A comprehensive inventory management system with stock tracking, low-stock alerts, supplier management, barcode scanning, and detailed reporting. Perfect for retail, pharmacies, and warehouses.',
  pt.id, c.id, 59.00, 79.00, 'USD', 'subscription', 'month', true, false, true, 'active', true, 2
FROM public.product_types pt, public.categories c
WHERE pt.slug = 'business_system' AND c.slug = 'business-systems'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, short_description, description, product_type_id, category_id, price, currency, pricing_model, billing_interval, is_subscription, is_downloadable, is_featured, status, is_active, sort_order)
SELECT
  'E-commerce Template', 'ecommerce-template',
  'A production-ready e-commerce template with cart, checkout, and product catalog.',
  'A complete e-commerce website template with product catalog, shopping cart, secure checkout, order management, and a modern, responsive design. Fully customizable to match your brand.',
  pt.id, c.id, 49.00, 'USD', 'one_time', null, false, true, true, 'active', true, 1
FROM public.product_types pt, public.categories c
WHERE pt.slug = 'digital_product' AND c.slug = 'digital-products'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, short_description, description, product_type_id, category_id, price, currency, pricing_model, billing_interval, is_subscription, is_downloadable, is_featured, status, is_active, sort_order)
SELECT
  'Digital Business Guide', 'digital-business-ebook',
  'A comprehensive guide to building and scaling your digital business.',
  'A 200-page e-book covering everything from choosing the right digital tools to scaling your business online. Includes case studies, checklists, and actionable strategies.',
  pt.id, c.id, 19.00, 'USD', 'one_time', null, false, true, false, 'active', true, 1
FROM public.product_types pt, public.categories c
WHERE pt.slug = 'ebook' AND c.slug = 'ebooks'
ON CONFLICT (slug) DO NOTHING;

-- ===== SEED DATA: ADDONS =====
INSERT INTO public.addons (name, slug, description, price, currency, billing_interval, pricing_model, icon, is_active, sort_order) VALUES
  ('Loyalty Points', 'loyalty-points', 'Reward your customers with a points-based loyalty program', 10.00, 'USD', 'month', 'subscription', 'sparkles', true, 1),
  ('Coupons', 'coupons', 'Create and manage discount coupons for your products', 8.00, 'USD', 'month', 'subscription', 'ticket', true, 2),
  ('Reviews', 'reviews', 'Let customers leave reviews and ratings on your products', 8.00, 'USD', 'month', 'subscription', 'star', true, 3),
  ('Wishlist', 'wishlist', 'Allow customers to save products to a wishlist', 6.00, 'USD', 'month', 'subscription', 'heart', true, 4),
  ('Push Notifications', 'push-notifications', 'Send push notifications to your customers', 8.00, 'USD', 'month', 'subscription', 'bell', true, 5),
  ('Delivery Management', 'delivery-management', 'Manage delivery routes, drivers, and tracking', 12.00, 'USD', 'month', 'subscription', 'truck', true, 6)
ON CONFLICT (slug) DO NOTHING;

-- ===== SEED DATA: PRODUCT ADDON COMPATIBILITY =====
-- All add-ons are compatible with POS System and Inventory System
INSERT INTO public.product_addons (product_id, addon_id)
SELECT p.id, a.id FROM public.products p, public.addons a
WHERE p.slug IN ('pos-system', 'inventory-system') AND a.is_active = true
ON CONFLICT (product_id, addon_id) DO NOTHING;

-- Website-type products get loyalty, reviews, wishlist, push notifications
INSERT INTO public.product_addons (product_id, addon_id)
SELECT p.id, a.id FROM public.products p, public.addons a
WHERE p.slug IN ('pharmacy-website', 'restaurant-website', 'dental-clinic-website')
  AND a.slug IN ('loyalty-points', 'reviews', 'wishlist', 'push-notifications')
ON CONFLICT (product_id, addon_id) DO NOTHING;

-- ===== SEED DATA: PRODUCT FEATURES =====
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Online ordering system', 1 FROM public.products WHERE slug = 'pharmacy-website'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Prescription management', 2 FROM public.products WHERE slug = 'pharmacy-website'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Delivery integration', 3 FROM public.products WHERE slug = 'pharmacy-website'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Responsive design', 4 FROM public.products WHERE slug = 'pharmacy-website'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Menu display', 1 FROM public.products WHERE slug = 'restaurant-website'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Table reservations', 2 FROM public.products WHERE slug = 'restaurant-website'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Online ordering', 3 FROM public.products WHERE slug = 'restaurant-website'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Appointment booking', 1 FROM public.products WHERE slug = 'dental-clinic-website'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Doctor profiles', 2 FROM public.products WHERE slug = 'dental-clinic-website'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Patient reviews', 3 FROM public.products WHERE slug = 'dental-clinic-website'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Sales tracking', 1 FROM public.products WHERE slug = 'pos-system'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Inventory management', 2 FROM public.products WHERE slug = 'pos-system'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Staff permissions', 3 FROM public.products WHERE slug = 'pos-system'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Receipt printing', 4 FROM public.products WHERE slug = 'pos-system'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Real-time reporting', 5 FROM public.products WHERE slug = 'pos-system'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Stock tracking', 1 FROM public.products WHERE slug = 'inventory-system'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Low-stock alerts', 2 FROM public.products WHERE slug = 'inventory-system'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Supplier management', 3 FROM public.products WHERE slug = 'inventory-system'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Barcode scanning', 4 FROM public.products WHERE slug = 'inventory-system'
ON CONFLICT DO NOTHING;

-- ===== SEED DATA: PRODUCT FAQS =====
INSERT INTO public.product_faqs (product_id, question, answer, sort_order)
SELECT id, 'Can I customize the website design?', 'Yes, all our websites are fully customizable. You can change colors, fonts, layout, and content to match your brand.', 1 FROM public.products WHERE slug = 'pharmacy-website'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_faqs (product_id, question, answer, sort_order)
SELECT id, 'Does it support online ordering?', 'Yes, the pharmacy website includes a complete online ordering system with prescription management and delivery integration.', 2 FROM public.products WHERE slug = 'pharmacy-website'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_faqs (product_id, question, answer, sort_order)
SELECT id, 'Is there a free trial?', 'Yes, we offer a 14-day money-back guarantee. If you are not satisfied, contact support for a full refund.', 1 FROM public.products WHERE slug = 'pos-system'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_faqs (product_id, question, answer, sort_order)
SELECT id, 'Can I use it on multiple devices?', 'Yes, the POS system works on any device with a web browser — desktop, tablet, or mobile.', 2 FROM public.products WHERE slug = 'pos-system'
ON CONFLICT DO NOTHING;

-- ===== SEED DATA: PERMISSIONS =====
INSERT INTO public.permissions (name, slug, description) VALUES
  ('Manage Products', 'manage_products', 'Create, update, and delete products'),
  ('Manage Add-ons', 'manage_addons', 'Create, update, and delete add-ons'),
  ('Manage Customers', 'manage_customers', 'View and manage customer accounts'),
  ('Manage Orders', 'manage_orders', 'View and manage all orders'),
  ('Manage Payments', 'manage_payments', 'View and manage payments'),
  ('Manage Subscriptions', 'manage_subscriptions', 'View and manage subscriptions'),
  ('Manage Coupons', 'manage_coupons', 'Create, update, and delete coupons'),
  ('Manage Support', 'manage_support', 'View and respond to support tickets'),
  ('Manage Staff', 'manage_staff', 'Manage staff accounts and roles'),
  ('Manage Settings', 'manage_settings', 'Update platform settings'),
  ('View Audit Logs', 'view_audit_logs', 'View admin activity logs'),
  ('Manage Permissions', 'manage_permissions', 'Manage roles and permissions')
ON CONFLICT (slug) DO NOTHING;

-- Grant all permissions to super_admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'super_admin', id FROM public.permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Grant most permissions to admin (except manage_permissions and manage_staff)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'admin', id FROM public.permissions
WHERE slug NOT IN ('manage_permissions', 'manage_staff')
ON CONFLICT (role_id, permission_id) DO NOTHING;
