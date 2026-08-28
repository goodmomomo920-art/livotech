/*
# LivoTech Core Schema — Tables Only

Creates all foundational tables WITHOUT policies. Policies added in migration 002.

## New Tables
- `roles` — RBAC roles (customer, admin, super_admin)
- `profiles` — user profile data linked to auth.users
- `product_types` — product type catalog (website, saas, etc.)
- `categories` — product categories
- `products` — main product catalog
- `product_features` — features per product
- `product_images` — images per product
- `product_faqs` — FAQs per product
- `product_files` — downloadable files per product (private)
- `addons` — add-on catalog
- `product_addons` — product/addon compatibility mapping
- `coupons` — discount coupons
- `orders` — customer orders
- `order_items` — line items per order (with price snapshots)
- `coupon_redemptions` — tracks coupon usage per customer
- `websites` — customer website instances (created before customer_addons due to FK)
- `customer_products` — product ownership records
- `customer_addons` — addon ownership records
- `subscriptions` — recurring billing records
- `payments` — payment records (provider-agnostic)
- `downloads` — download history
- `support_tickets` — customer support tickets
- `support_messages` — messages on support tickets
- `notifications` — user notifications
- `admin_activity_logs` — admin audit trail
- `settings` — platform-wide settings (singleton row)

## Security
- Helper functions is_admin() and is_super_admin() created as SECURITY DEFINER
- Trigger on auth.users creates a profile with 'customer' role on signup
- updated_at triggers on all relevant tables

## Important Notes
1. Profiles are auto-created on signup via trigger; users cannot choose their role
2. Order items store price/name snapshots so historical data survives product changes
3. Product files are private — access controlled by RLS in migration 002
4. websites table created before customer_addons due to FK dependency
*/

-- ROLES
CREATE TABLE IF NOT EXISTS public.roles (id text PRIMARY KEY, name text NOT NULL, description text, created_at timestamptz DEFAULT now());
INSERT INTO public.roles (id, name, description) VALUES ('customer','Customer','Standard customer account'),('admin','Admin','Administrative access'),('super_admin','Super Admin','Full platform control') ON CONFLICT (id) DO NOTHING;

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, full_name text, email text, phone text, company text, role text NOT NULL DEFAULT 'customer' REFERENCES public.roles(id), status text NOT NULL DEFAULT 'active', avatar_url text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());

-- HELPER FUNCTIONS (need profiles to exist)
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')); $$;
CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'); $$;

-- PRODUCT TYPES
CREATE TABLE IF NOT EXISTS public.product_types (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, slug text NOT NULL UNIQUE, description text, sort_order int DEFAULT 0, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, slug text NOT NULL UNIQUE, description text, icon text, image_url text, sort_order int DEFAULT 0, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, slug text NOT NULL UNIQUE, short_description text, description text, product_type_id uuid REFERENCES public.product_types(id), category_id uuid REFERENCES public.categories(id), thumbnail text, status text NOT NULL DEFAULT 'active', price numeric(10,2) DEFAULT 0 CHECK (price >= 0), compare_at_price numeric(10,2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0), currency text DEFAULT 'USD', pricing_model text DEFAULT 'one_time', billing_interval text, is_subscription boolean DEFAULT false, is_downloadable boolean DEFAULT false, is_featured boolean DEFAULT false, sort_order int DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(product_type_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- PRODUCT FEATURES / IMAGES / FAQS / FILES
CREATE TABLE IF NOT EXISTS public.product_features (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE, feature text NOT NULL, sort_order int DEFAULT 0, created_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_product_features_product ON public.product_features(product_id);
CREATE TABLE IF NOT EXISTS public.product_images (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE, url text NOT NULL, alt_text text, sort_order int DEFAULT 0, is_primary boolean DEFAULT false, created_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE TABLE IF NOT EXISTS public.product_faqs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE, question text NOT NULL, answer text NOT NULL, sort_order int DEFAULT 0, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_product_faqs_product ON public.product_faqs(product_id);
CREATE TABLE IF NOT EXISTS public.product_files (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE, file_name text NOT NULL, storage_path text NOT NULL, file_size bigint, mime_type text, version text DEFAULT '1.0', is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_product_files_product ON public.product_files(product_id);

-- ADDONS + PRODUCT ADDONS
CREATE TABLE IF NOT EXISTS public.addons (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, slug text NOT NULL UNIQUE, description text, price numeric(10,2) DEFAULT 0 CHECK (price >= 0), compare_at_price numeric(10,2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0), currency text DEFAULT 'USD', billing_interval text, pricing_model text DEFAULT 'one_time', icon text, image_url text, is_active boolean DEFAULT true, sort_order int DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.product_addons (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE, addon_id uuid NOT NULL REFERENCES public.addons(id) ON DELETE CASCADE, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), UNIQUE(product_id, addon_id));
CREATE INDEX IF NOT EXISTS idx_product_addons_product ON public.product_addons(product_id);
CREATE INDEX IF NOT EXISTS idx_product_addons_addon ON public.product_addons(addon_id);

-- COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, discount_type text NOT NULL DEFAULT 'percentage', value numeric(10,2) NOT NULL DEFAULT 0 CHECK (value >= 0), minimum_order numeric(10,2) DEFAULT 0 CHECK (minimum_order >= 0), maximum_discount numeric(10,2) CHECK (maximum_discount IS NULL OR maximum_discount >= 0), starts_at timestamptz DEFAULT now(), expires_at timestamptz, usage_limit int CHECK (usage_limit IS NULL OR usage_limit >= 0), per_customer_limit int DEFAULT 1 CHECK (per_customer_limit >= 0), usage_count int DEFAULT 0 CHECK (usage_count >= 0), is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_number text NOT NULL UNIQUE, user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE, status text NOT NULL DEFAULT 'pending', payment_status text NOT NULL DEFAULT 'pending', currency text DEFAULT 'USD', subtotal numeric(10,2) DEFAULT 0 CHECK (subtotal >= 0), discount numeric(10,2) DEFAULT 0 CHECK (discount >= 0), tax numeric(10,2) DEFAULT 0 CHECK (tax >= 0), total numeric(10,2) DEFAULT 0 CHECK (total >= 0), payment_method text, coupon_id uuid REFERENCES public.coupons(id), created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE, product_id uuid REFERENCES public.products(id), addon_id uuid REFERENCES public.addons(id), product_name_snapshot text NOT NULL, product_type_snapshot text, quantity int DEFAULT 1 CHECK (quantity > 0), unit_price numeric(10,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0), discount numeric(10,2) DEFAULT 0 CHECK (discount >= 0), total numeric(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0), created_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- COUPON REDEMPTIONS
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE, order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE, user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE, discount_amount numeric(10,2) NOT NULL DEFAULT 0, redeemed_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON public.coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON public.coupon_redemptions(coupon_id);

-- WEBSITES (before customer_addons due to FK)
CREATE TABLE IF NOT EXISTS public.websites (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE, name text NOT NULL, product_id uuid REFERENCES public.products(id), domain text, deployment_url text, custom_domain text, status text NOT NULL DEFAULT 'pending', plan text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_websites_user ON public.websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_status ON public.websites(status);

-- CUSTOMER PRODUCTS
CREATE TABLE IF NOT EXISTS public.customer_products (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE, product_id uuid NOT NULL REFERENCES public.products(id), order_id uuid, status text NOT NULL DEFAULT 'active', plan text, purchase_date timestamptz DEFAULT now(), activation_date timestamptz, expiration_date timestamptz, subscription_id uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_customer_products_user ON public.customer_products(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_products_product ON public.customer_products(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_products_status ON public.customer_products(status);

-- CUSTOMER ADDONS
CREATE TABLE IF NOT EXISTS public.customer_addons (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE, addon_id uuid NOT NULL REFERENCES public.addons(id), product_id uuid REFERENCES public.products(id), website_id uuid REFERENCES public.websites(id), order_id uuid, subscription_id uuid, status text NOT NULL DEFAULT 'active', start_date timestamptz DEFAULT now(), renewal_date timestamptz, cancelled_date timestamptz, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_customer_addons_user ON public.customer_addons(user_id);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE, product_id uuid REFERENCES public.products(id), addon_id uuid REFERENCES public.addons(id), order_id uuid REFERENCES public.orders(id), plan text, status text NOT NULL DEFAULT 'active', price numeric(10,2) DEFAULT 0 CHECK (price >= 0), currency text DEFAULT 'USD', billing_interval text, start_date timestamptz DEFAULT now(), next_billing_date timestamptz, cancelled_date timestamptz, expiration_date timestamptz, provider text, provider_subscription_id text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL, subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL, user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE, provider text, provider_payment_id text, transaction_reference text, amount numeric(10,2) NOT NULL DEFAULT 0 CHECK (amount >= 0), currency text DEFAULT 'USD', status text NOT NULL DEFAULT 'pending', payment_method text, metadata jsonb, paid_at timestamptz, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- DOWNLOADS
CREATE TABLE IF NOT EXISTS public.downloads (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE, product_id uuid REFERENCES public.products(id), product_file_id uuid REFERENCES public.product_files(id), file_name text, ip_address text, user_agent text, created_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_downloads_user ON public.downloads(user_id);

-- SUPPORT TICKETS + MESSAGES
CREATE TABLE IF NOT EXISTS public.support_tickets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE, subject text NOT NULL, category text, priority text DEFAULT 'normal', status text NOT NULL DEFAULT 'open', assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), closed_at timestamptz);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE TABLE IF NOT EXISTS public.support_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE, user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE, message text NOT NULL, attachment_path text, is_staff boolean DEFAULT false, created_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE, type text, title text NOT NULL, message text, is_read boolean DEFAULT false, link text, created_at timestamptz DEFAULT now(), read_at timestamptz);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- ADMIN ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, action text NOT NULL, resource text, resource_id text, metadata jsonb, created_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON public.admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_activity_logs(created_at DESC);

-- SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (id text PRIMARY KEY DEFAULT 'default', brand_name text DEFAULT 'LivoTech', tagline text DEFAULT 'Digital products, tools & solutions.', logo_url text, favicon_url text, currency text DEFAULT 'USD', contact_email text DEFAULT 'contact@livotech.com', support_email text DEFAULT 'support@livotech.com', social_links jsonb DEFAULT '{}', maintenance_mode boolean DEFAULT false, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
INSERT INTO public.settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN INSERT INTO public.profiles (id, email, full_name, role, status) VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'customer', 'active'); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE OR REPLACE FUNCTION public.update_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS product_types_updated_at ON public.product_types;
CREATE TRIGGER product_types_updated_at BEFORE UPDATE ON public.product_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS addons_updated_at ON public.addons;
CREATE TRIGGER addons_updated_at BEFORE UPDATE ON public.addons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS customer_products_updated_at ON public.customer_products;
CREATE TRIGGER customer_products_updated_at BEFORE UPDATE ON public.customer_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS customer_addons_updated_at ON public.customer_addons;
CREATE TRIGGER customer_addons_updated_at BEFORE UPDATE ON public.customer_addons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS websites_updated_at ON public.websites;
CREATE TRIGGER websites_updated_at BEFORE UPDATE ON public.websites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS settings_updated_at ON public.settings;
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
