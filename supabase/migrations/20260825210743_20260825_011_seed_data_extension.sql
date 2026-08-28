/*
# Seed Data: Product Types, Addons, Plans, Type-Addon Compatibility, Content

## Purpose
Adds missing seed data to complete the catalog foundation:
1. New product types: Template, Tool
2. New addons: Flash Deals, VIP Customers, Abandoned Cart Reports, Homepage Banners, Popup Ads, Doctors
3. Product plans for all existing products (migrating legacy pricing into plans)
4. Product type-addon compatibility mappings
5. Site content seed values (hero title, hero subtitle, etc.)
6. Global site FAQs

## Important Notes
1. All seed data is clearly demo/development data
2. Product plans migrate the existing products.price/billing_interval into structured plans
3. Type-addon compatibility allows add-ons to work across all products of a given type without individual mapping
4. No fake customer purchases or revenue data is created
*/

-- ===== NEW PRODUCT TYPES =====
INSERT INTO public.product_types (name, slug, description, sort_order) VALUES
  ('Template', 'template', 'Website and UI templates for quick deployment', 7),
  ('Tool', 'tool', 'Standalone tools and utilities', 8)
ON CONFLICT (slug) DO NOTHING;

-- ===== NEW CATEGORIES =====
INSERT INTO public.categories (name, slug, description, icon, sort_order) VALUES
  ('SaaS', 'saas', 'Software as a Service products', 'briefcase', 6),
  ('Templates', 'templates', 'Website and UI templates', 'layout', 7),
  ('Tools', 'tools-cat', 'Standalone tools and utilities', 'wrench', 8)
ON CONFLICT (slug) DO NOTHING;

-- ===== NEW ADDONS =====
INSERT INTO public.addons (name, slug, description, price, currency, billing_interval, pricing_model, icon, is_active, sort_order) VALUES
  ('Flash Deals', 'flash-deals', 'Create time-limited flash sale offers for your products', 10.00, 'USD', 'month', 'subscription', 'zap', true, 7),
  ('VIP Customers', 'vip-customers', 'Tiered VIP customer program with exclusive benefits', 12.00, 'USD', 'month', 'subscription', 'crown', true, 8),
  ('Abandoned Cart Reports', 'abandoned-cart-reports', 'Track and recover abandoned shopping carts with detailed reports', 15.00, 'USD', 'month', 'subscription', 'shopping-cart', true, 9),
  ('Homepage Banners', 'homepage-banners', 'Manage promotional banners on your website homepage', 8.00, 'USD', 'month', 'subscription', 'image', true, 10),
  ('Popup Ads', 'popup-ads', 'Display targeted popup advertisements to your visitors', 6.00, 'USD', 'month', 'subscription', 'message-square', true, 11),
  ('Doctors', 'doctors', 'Doctor profiles and scheduling for clinic websites', 10.00, 'USD', 'month', 'subscription', 'stethoscope', true, 12)
ON CONFLICT (slug) DO NOTHING;

-- ===== PRODUCT PLANS (migrate existing product pricing into plans) =====

-- Pharmacy Website: Monthly + Yearly
INSERT INTO public.product_plans (product_id, name, slug, pricing_model, price, currency, billing_interval, compare_at_price, is_active, is_default, sort_order)
SELECT id, 'Monthly', 'monthly', 'subscription', 79.00, 'USD', 'monthly', 99.00, true, true, 1 FROM public.products WHERE slug = 'pharmacy-website'
ON CONFLICT (product_id, slug) DO NOTHING;

INSERT INTO public.product_plans (product_id, name, slug, pricing_model, price, currency, billing_interval, compare_at_price, is_active, is_default, sort_order)
SELECT id, 'Yearly', 'yearly', 'subscription', 790.00, 'USD', 'yearly', 990.00, true, false, 2 FROM public.products WHERE slug = 'pharmacy-website'
ON CONFLICT (product_id, slug) DO NOTHING;

-- Restaurant Website: Monthly + Yearly
INSERT INTO public.product_plans (product_id, name, slug, pricing_model, price, currency, billing_interval, compare_at_price, is_active, is_default, sort_order)
SELECT id, 'Monthly', 'monthly', 'subscription', 69.00, 'USD', 'monthly', 89.00, true, true, 1 FROM public.products WHERE slug = 'restaurant-website'
ON CONFLICT (product_id, slug) DO NOTHING;

INSERT INTO public.product_plans (product_id, name, slug, pricing_model, price, currency, billing_interval, compare_at_price, is_active, is_default, sort_order)
SELECT id, 'Yearly', 'yearly', 'subscription', 690.00, 'USD', 'yearly', 890.00, true, false, 2 FROM public.products WHERE slug = 'restaurant-website'
ON CONFLICT (product_id, slug) DO NOTHING;

-- Dental Clinic Website: Monthly + Yearly
INSERT INTO public.product_plans (product_id, name, slug, pricing_model, price, currency, billing_interval, compare_at_price, is_active, is_default, sort_order)
SELECT id, 'Monthly', 'monthly', 'subscription', 75.00, 'USD', 'monthly', 95.00, true, true, 1 FROM public.products WHERE slug = 'dental-clinic-website'
ON CONFLICT (product_id, slug) DO NOTHING;

INSERT INTO public.product_plans (product_id, name, slug, pricing_model, price, currency, billing_interval, compare_at_price, is_active, is_default, sort_order)
SELECT id, 'Yearly', 'yearly', 'subscription', 750.00, 'USD', 'yearly', 950.00, true, false, 2 FROM public.products WHERE slug = 'dental-clinic-website'
ON CONFLICT (product_id, slug) DO NOTHING;

-- POS System: Monthly + Yearly
INSERT INTO public.product_plans (product_id, name, slug, pricing_model, price, currency, billing_interval, compare_at_price, is_active, is_default, sort_order)
SELECT id, 'Monthly', 'monthly', 'subscription', 79.00, 'USD', 'monthly', 129.00, true, true, 1 FROM public.products WHERE slug = 'pos-system'
ON CONFLICT (product_id, slug) DO NOTHING;

INSERT INTO public.product_plans (product_id, name, slug, pricing_model, price, currency, billing_interval, compare_at_price, is_active, is_default, sort_order)
SELECT id, 'Yearly', 'yearly', 'subscription', 790.00, 'USD', 'yearly', 1290.00, true, false, 2 FROM public.products WHERE slug = 'pos-system'
ON CONFLICT (product_id, slug) DO NOTHING;

-- Inventory System: Monthly + Yearly
INSERT INTO public.product_plans (product_id, name, slug, pricing_model, price, currency, billing_interval, compare_at_price, is_active, is_default, sort_order)
SELECT id, 'Monthly', 'monthly', 'subscription', 59.00, 'USD', 'monthly', 79.00, true, true, 1 FROM public.products WHERE slug = 'inventory-system'
ON CONFLICT (product_id, slug) DO NOTHING;

INSERT INTO public.product_plans (product_id, name, slug, pricing_model, price, currency, billing_interval, compare_at_price, is_active, is_default, sort_order)
SELECT id, 'Yearly', 'yearly', 'subscription', 590.00, 'USD', 'yearly', 790.00, true, false, 2 FROM public.products WHERE slug = 'inventory-system'
ON CONFLICT (product_id, slug) DO NOTHING;

-- E-commerce Template: One-time
INSERT INTO public.product_plans (product_id, name, slug, pricing_model, price, currency, billing_interval, is_active, is_default, sort_order)
SELECT id, 'One-time', 'one-time', 'one_time', 49.00, 'USD', 'one_time', true, true, 1 FROM public.products WHERE slug = 'ecommerce-template'
ON CONFLICT (product_id, slug) DO NOTHING;

-- Digital Business Guide (E-book): One-time
INSERT INTO public.product_plans (product_id, name, slug, pricing_model, price, currency, billing_interval, is_active, is_default, sort_order)
SELECT id, 'One-time', 'one-time', 'one_time', 19.00, 'USD', 'one_time', true, true, 1 FROM public.products WHERE slug = 'digital-business-ebook'
ON CONFLICT (product_id, slug) DO NOTHING;

-- ===== TYPE-ADDON COMPATIBILITY =====

-- Website type: gets loyalty, reviews, wishlist, push-notifications, flash-deals, vip-customers, homepage-banners, popup-ads, doctors (for clinic)
INSERT INTO public.product_type_addons (product_type_id, addon_id)
SELECT pt.id, a.id FROM public.product_types pt, public.addons a
WHERE pt.slug = 'website'
  AND a.slug IN ('loyalty-points', 'reviews', 'wishlist', 'push-notifications', 'flash-deals', 'vip-customers', 'homepage-banners', 'popup-ads', 'doctors', 'coupons', 'delivery-management')
ON CONFLICT (product_type_id, addon_id) DO NOTHING;

-- Business System type: gets all operational add-ons
INSERT INTO public.product_type_addons (product_type_id, addon_id)
SELECT pt.id, a.id FROM public.product_types pt, public.addons a
WHERE pt.slug = 'business_system'
  AND a.slug IN ('loyalty-points', 'coupons', 'reviews', 'wishlist', 'push-notifications', 'delivery-management', 'abandoned-cart-reports', 'flash-deals', 'vip-customers', 'homepage-banners')
ON CONFLICT (product_type_id, addon_id) DO NOTHING;

-- SaaS type: gets reviews, push-notifications, abandoned-cart-reports
INSERT INTO public.product_type_addons (product_type_id, addon_id)
SELECT pt.id, a.id FROM public.product_types pt, public.addons a
WHERE pt.slug = 'saas'
  AND a.slug IN ('reviews', 'push-notifications', 'abandoned-cart-reports')
ON CONFLICT (product_type_id, addon_id) DO NOTHING;

-- Digital Product type: gets reviews
INSERT INTO public.product_type_addons (product_type_id, addon_id)
SELECT pt.id, a.id FROM public.product_types pt, public.addons a
WHERE pt.slug = 'digital_product'
  AND a.slug IN ('reviews', 'wishlist')
ON CONFLICT (product_type_id, addon_id) DO NOTHING;

-- ===== SITE CONTENT SEED =====
INSERT INTO public.site_content (id, value, description) VALUES
  ('hero_title', 'Digital products, tools & solutions.', 'Main hero section title'),
  ('hero_subtitle', 'Everything you need to build, launch and grow your digital presence — from ready-made websites and business systems to digital products and tools.', 'Main hero section subtitle'),
  ('hero_badge', 'Built for modern teams', 'Pill badge text in hero'),
  ('about_title', 'We build digital products, tools & solutions.', 'About page title'),
  ('about_subtitle', 'LivoTech is a multi-product digital platform designed to help businesses discover, purchase, and manage the tools they need to grow.', 'About page subtitle'),
  ('cta_title', 'Ready to build something better?', 'Main CTA title'),
  ('cta_subtitle', 'Explore LivoTech and find the digital products, tools and solutions you need.', 'Main CTA subtitle')
ON CONFLICT (id) DO NOTHING;

-- ===== GLOBAL SITE FAQS =====
INSERT INTO public.site_faqs (question, answer, category, sort_order, is_active) VALUES
  ('What is LivoTech?', 'LivoTech is a multi-product digital platform that offers ready-made websites, business systems, SaaS products, add-ons, digital products, and e-books — all in one place.', 'general', 1, true),
  ('How do I get started?', 'Simply create an account, browse our product catalog, and choose the product and plan that fits your needs. You can add compatible add-ons at any time.', 'general', 2, true),
  ('Can I own multiple products?', 'Yes! A single LivoTech account can hold multiple products — websites, POS systems, inventory systems, e-books, and more — all managed from one dashboard.', 'products', 1, true),
  ('Are the products customizable?', 'Yes, all our websites and systems are fully customizable. You can change colors, fonts, layout, and content to match your brand.', 'products', 2, true),
  ('What payment methods do you accept?', 'We are preparing integration with multiple payment providers. Payment options will be available once the payment system is fully activated.', 'billing', 1, true),
  ('Is there a money-back guarantee?', 'Yes, we offer a 14-day money-back guarantee on most products. If you are not satisfied, contact support for a full refund.', 'billing', 2, true),
  ('Can I cancel my subscription?', 'Yes, you can cancel your subscription at any time from your dashboard. Your product will remain active until the end of your billing period.', 'billing', 3, true),
  ('Do you offer support?', 'Yes, all plans include support. You can create a support ticket from your dashboard and our team will respond promptly.', 'general', 3, true),
  ('What are product plans?', 'Each product can have multiple pricing plans — monthly, yearly, or one-time. You can choose the plan that best fits your needs and budget.', 'products', 3, true),
  ('Can I use add-ons with any product?', 'Add-ons are compatible with specific products or product types. You will only see add-ons that are compatible with the product you own.', 'products', 4, true)
ON CONFLICT DO NOTHING;

-- ===== ADD MORE PRODUCT FEATURES FOR NEW PRODUCTS =====
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Product catalog', 1 FROM public.products WHERE slug = 'ecommerce-template'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Shopping cart', 2 FROM public.products WHERE slug = 'ecommerce-template'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Secure checkout', 3 FROM public.products WHERE slug = 'ecommerce-template'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Order management', 4 FROM public.products WHERE slug = 'ecommerce-template'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Responsive design', 5 FROM public.products WHERE slug = 'ecommerce-template'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, '200+ pages of actionable content', 1 FROM public.products WHERE slug = 'digital-business-ebook'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Case studies and examples', 2 FROM public.products WHERE slug = 'digital-business-ebook'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Checklists and templates', 3 FROM public.products WHERE slug = 'digital-business-ebook'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_features (product_id, feature, sort_order)
SELECT id, 'Instant download', 4 FROM public.products WHERE slug = 'digital-business-ebook'
ON CONFLICT DO NOTHING;

-- ===== ADD MORE PRODUCT FAQS =====
INSERT INTO public.product_faqs (product_id, question, answer, sort_order)
SELECT id, 'Can I use this template for multiple stores?', 'Each purchase includes a license for one store. Contact us for multi-store licensing options.', 1 FROM public.products WHERE slug = 'ecommerce-template'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_faqs (product_id, question, answer, sort_order)
SELECT id, 'What format is the e-book in?', 'The e-book is delivered as a PDF file, which can be read on any device. You will receive a download link after purchase.', 1 FROM public.products WHERE slug = 'digital-business-ebook'
ON CONFLICT DO NOTHING;

-- ===== ADD MORE PERMISSIONS =====
INSERT INTO public.permissions (name, slug, description) VALUES
  ('View Products', 'products_view', 'View product catalog'),
  ('Create Products', 'products_create', 'Create new products'),
  ('Update Products', 'products_update', 'Update existing products'),
  ('Delete Products', 'products_delete', 'Delete/archive products'),
  ('View Add-ons', 'addons_view', 'View add-on catalog'),
  ('Create Add-ons', 'addons_create', 'Create new add-ons'),
  ('Update Add-ons', 'addons_update', 'Update existing add-ons'),
  ('View Orders', 'orders_view', 'View all orders'),
  ('Update Orders', 'orders_update', 'Update order status'),
  ('View Customers', 'customers_view', 'View customer accounts'),
  ('Update Customers', 'customers_update', 'Update customer accounts'),
  ('View Subscriptions', 'subscriptions_view', 'View all subscriptions'),
  ('Update Subscriptions', 'subscriptions_update', 'Update subscription status'),
  ('View Payments', 'payments_view', 'View payment records'),
  ('Manage Support', 'support_manage', 'Manage support tickets'),
  ('Manage Staff', 'staff_manage', 'Manage staff accounts and roles'),
  ('Manage Roles', 'roles_manage', 'Manage roles and permissions'),
  ('Manage Settings', 'settings_manage', 'Update platform settings'),
  ('View Invoices', 'invoices_view', 'View all invoices'),
  ('Manage Invoices', 'invoices_manage', 'Create and update invoices')
ON CONFLICT (slug) DO NOTHING;

-- Grant new granular permissions to super_admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'super_admin', id FROM public.permissions
WHERE slug NOT IN ('manage_permissions')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Grant most new permissions to admin (except roles_manage, staff_manage)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'admin', id FROM public.permissions
WHERE slug NOT IN ('roles_manage', 'staff_manage', 'manage_permissions')
ON CONFLICT (role_id, permission_id) DO NOTHING;
