-- Adds support for a product intro/explainer video, and a storage bucket to
-- host uploaded video files (public read, admin write — same pattern as
-- product-images).

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url text;

INSERT INTO storage.buckets (id, name, public) VALUES
  ('product-videos', 'product-videos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product_videos_public_read" ON storage.objects;
CREATE POLICY "product_videos_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "product_videos_admin_write" ON storage.objects;
CREATE POLICY "product_videos_admin_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-videos' AND public.is_admin());

DROP POLICY IF EXISTS "product_videos_admin_delete" ON storage.objects;
CREATE POLICY "product_videos_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-videos' AND public.is_admin());

-- product-images only had an INSERT policy for admins before — add DELETE too
-- so the admin UI can actually remove a gallery image, not just add one.
DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());
