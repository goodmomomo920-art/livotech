-- Add video_url and image columns to addons table
ALTER TABLE addons ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE addons ADD COLUMN IF NOT EXISTS image text;

-- Storage bucket for addon images (reuses product-images bucket for simplicity,
-- but addon videos go in product-videos bucket which already exists)
