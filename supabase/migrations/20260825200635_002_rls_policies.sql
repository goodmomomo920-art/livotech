/*
# LivoTech RLS Policies — Phase 1 Part 2

Enables RLS on all tables and creates all access policies.
- Public catalog tables: anon+authenticated read, admin write
- Customer tables: owner-scoped CRUD via auth.uid()
- Admin-only tables: is_admin() check
- Product files: only visible to owners of that product
*/

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- PRODUCT TYPES
DROP POLICY IF EXISTS "pt_select_all" ON public.product_types;
CREATE POLICY "pt_select_all" ON public.product_types FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "pt_admin_write" ON public.product_types;
CREATE POLICY "pt_admin_write" ON public.product_types FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- CATEGORIES
DROP POLICY IF EXISTS "cat_select_all" ON public.categories;
CREATE POLICY "cat_select_all" ON public.categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "cat_admin_write" ON public.categories;
CREATE POLICY "cat_admin_write" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PRODUCTS
DROP POLICY IF EXISTS "prod_select_all" ON public.products;
CREATE POLICY "prod_select_all" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true OR public.is_admin());
DROP POLICY IF EXISTS "prod_admin_write" ON public.products;
CREATE POLICY "prod_admin_write" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PRODUCT FEATURES
DROP POLICY IF EXISTS "pf_select_all" ON public.product_features;
CREATE POLICY "pf_select_all" ON public.product_features FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "pf_admin_write" ON public.product_features;
CREATE POLICY "pf_admin_write" ON public.product_features FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PRODUCT IMAGES
DROP POLICY IF EXISTS "pi_select_all" ON public.product_images;
CREATE POLICY "pi_select_all" ON public.product_images FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "pi_admin_write" ON public.product_images;
CREATE POLICY "pi_admin_write" ON public.product_images FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PRODUCT FAQS
DROP POLICY IF EXISTS "pq_select_all" ON public.product_faqs;
CREATE POLICY "pq_select_all" ON public.product_faqs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "pq_admin_write" ON public.product_faqs;
CREATE POLICY "pq_admin_write" ON public.product_faqs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PRODUCT FILES (owner-only)
DROP POLICY IF EXISTS "pfile_select_owner" ON public.product_files;
CREATE POLICY "pfile_select_owner" ON public.product_files FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.customer_products WHERE customer_products.product_id = product_files.product_id AND customer_products.user_id = auth.uid() AND customer_products.status = 'active')
);
DROP POLICY IF EXISTS "pfile_admin_write" ON public.product_files;
CREATE POLICY "pfile_admin_write" ON public.product_files FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ADDONS
DROP POLICY IF EXISTS "addon_select_all" ON public.addons;
CREATE POLICY "addon_select_all" ON public.addons FOR SELECT TO anon, authenticated USING (is_active = true OR public.is_admin());
DROP POLICY IF EXISTS "addon_admin_write" ON public.addons;
CREATE POLICY "addon_admin_write" ON public.addons FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PRODUCT ADDONS
DROP POLICY IF EXISTS "pa_select_all" ON public.product_addons;
CREATE POLICY "pa_select_all" ON public.product_addons FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "pa_admin_write" ON public.product_addons;
CREATE POLICY "pa_admin_write" ON public.product_addons FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- COUPONS (admin-only)
DROP POLICY IF EXISTS "coupon_select_admin" ON public.coupons;
CREATE POLICY "coupon_select_admin" ON public.coupons FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "coupon_admin_write" ON public.coupons;
CREATE POLICY "coupon_admin_write" ON public.coupons FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ORDERS
DROP POLICY IF EXISTS "order_select_own" ON public.orders;
CREATE POLICY "order_select_own" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "order_insert_own" ON public.orders;
CREATE POLICY "order_insert_own" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "order_update_own" ON public.orders;
CREATE POLICY "order_update_own" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "order_delete_own" ON public.orders;
CREATE POLICY "order_delete_own" ON public.orders FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_admin());

-- ORDER ITEMS
DROP POLICY IF EXISTS "oi_select_own" ON public.order_items;
CREATE POLICY "oi_select_own" ON public.order_items FOR SELECT TO authenticated USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
DROP POLICY IF EXISTS "oi_insert_own" ON public.order_items;
CREATE POLICY "oi_insert_own" ON public.order_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = (SELECT user_id FROM public.orders WHERE orders.id = order_items.order_id));
DROP POLICY IF EXISTS "oi_update_admin" ON public.order_items;
CREATE POLICY "oi_update_admin" ON public.order_items FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "oi_delete_admin" ON public.order_items;
CREATE POLICY "oi_delete_admin" ON public.order_items FOR DELETE TO authenticated USING (public.is_admin());

-- COUPON REDEMPTIONS
DROP POLICY IF EXISTS "cr_select_own" ON public.coupon_redemptions;
CREATE POLICY "cr_select_own" ON public.coupon_redemptions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "cr_insert_own" ON public.coupon_redemptions;
CREATE POLICY "cr_insert_own" ON public.coupon_redemptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- CUSTOMER PRODUCTS
DROP POLICY IF EXISTS "cp_select_own" ON public.customer_products;
CREATE POLICY "cp_select_own" ON public.customer_products FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "cp_insert_own" ON public.customer_products;
CREATE POLICY "cp_insert_own" ON public.customer_products FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "cp_update_own" ON public.customer_products;
CREATE POLICY "cp_update_own" ON public.customer_products FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "cp_delete_own" ON public.customer_products;
CREATE POLICY "cp_delete_own" ON public.customer_products FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_admin());

-- CUSTOMER ADDONS
DROP POLICY IF EXISTS "ca_select_own" ON public.customer_addons;
CREATE POLICY "ca_select_own" ON public.customer_addons FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "ca_insert_own" ON public.customer_addons;
CREATE POLICY "ca_insert_own" ON public.customer_addons FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "ca_update_own" ON public.customer_addons;
CREATE POLICY "ca_update_own" ON public.customer_addons FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "ca_delete_own" ON public.customer_addons;
CREATE POLICY "ca_delete_own" ON public.customer_addons FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_admin());

-- WEBSITES
DROP POLICY IF EXISTS "web_select_own" ON public.websites;
CREATE POLICY "web_select_own" ON public.websites FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "web_insert_own" ON public.websites;
CREATE POLICY "web_insert_own" ON public.websites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "web_update_own" ON public.websites;
CREATE POLICY "web_update_own" ON public.websites FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "web_delete_own" ON public.websites;
CREATE POLICY "web_delete_own" ON public.websites FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_admin());

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "sub_select_own" ON public.subscriptions;
CREATE POLICY "sub_select_own" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "sub_insert_own" ON public.subscriptions;
CREATE POLICY "sub_insert_own" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "sub_update_own" ON public.subscriptions;
CREATE POLICY "sub_update_own" ON public.subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "sub_delete_own" ON public.subscriptions;
CREATE POLICY "sub_delete_own" ON public.subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_admin());

-- PAYMENTS
DROP POLICY IF EXISTS "pay_select_own" ON public.payments;
CREATE POLICY "pay_select_own" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "pay_insert_own" ON public.payments;
CREATE POLICY "pay_insert_own" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "pay_update_admin" ON public.payments;
CREATE POLICY "pay_update_admin" ON public.payments FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- DOWNLOADS
DROP POLICY IF EXISTS "dl_select_own" ON public.downloads;
CREATE POLICY "dl_select_own" ON public.downloads FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "dl_insert_own" ON public.downloads;
CREATE POLICY "dl_insert_own" ON public.downloads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "dl_delete_admin" ON public.downloads;
CREATE POLICY "dl_delete_admin" ON public.downloads FOR DELETE TO authenticated USING (public.is_admin());

-- SUPPORT TICKETS
DROP POLICY IF EXISTS "st_select_own" ON public.support_tickets;
CREATE POLICY "st_select_own" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "st_insert_own" ON public.support_tickets;
CREATE POLICY "st_insert_own" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "st_update_own" ON public.support_tickets;
CREATE POLICY "st_update_own" ON public.support_tickets FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- SUPPORT MESSAGES
DROP POLICY IF EXISTS "sm_select_own" ON public.support_messages;
CREATE POLICY "sm_select_own" ON public.support_messages FOR SELECT TO authenticated USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.support_tickets WHERE support_tickets.id = support_messages.ticket_id AND support_tickets.user_id = auth.uid()));
DROP POLICY IF EXISTS "sm_insert_own" ON public.support_messages;
CREATE POLICY "sm_insert_own" ON public.support_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "nt_select_own" ON public.notifications;
CREATE POLICY "nt_select_own" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "nt_insert_own" ON public.notifications;
CREATE POLICY "nt_insert_own" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "nt_update_own" ON public.notifications;
CREATE POLICY "nt_update_own" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "nt_delete_own" ON public.notifications;
CREATE POLICY "nt_delete_own" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_admin());

-- ADMIN LOGS
DROP POLICY IF EXISTS "al_select_admin" ON public.admin_activity_logs;
CREATE POLICY "al_select_admin" ON public.admin_activity_logs FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "al_insert_admin" ON public.admin_activity_logs;
CREATE POLICY "al_insert_admin" ON public.admin_activity_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- SETTINGS
DROP POLICY IF EXISTS "set_select_all" ON public.settings;
CREATE POLICY "set_select_all" ON public.settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "set_admin_write" ON public.settings;
CREATE POLICY "set_admin_write" ON public.settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
