/*
# Content Foundation

## Purpose
Adds lightweight content architecture for global FAQs, announcements, and homepage content. This is NOT a full CMS — just a clean foundation that can be expanded later.

## New Tables

### site_faqs
- `id` (uuid, PK)
- `question` (text, NOT NULL)
- `answer` (text, NOT NULL)
- `category` (text, nullable) — grouping field, e.g. "general", "billing", "products"
- `sort_order` (int, DEFAULT 0)
- `is_active` (boolean, DEFAULT true)
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

### announcements
- `id` (uuid, PK)
- `title` (text, NOT NULL)
- `content` (text, nullable)
- `type` (text, DEFAULT 'info') — info | warning | promotion | maintenance
- `is_active` (boolean, DEFAULT true)
- `starts_at` (timestamptz, DEFAULT now())
- `ends_at` (timestamptz, nullable)
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

### site_content
- `id` (text, PK) — key-based, e.g. "hero_title", "hero_subtitle", "about_text"
- `value` (text, nullable)
- `description` (text, nullable) — what this content key controls
- `updated_by` (uuid, nullable, FK → auth.users, SET NULL)
- `updated_at` (timestamptz, DEFAULT now())

## RLS
- site_faqs: public read (anon + authenticated), admin write
- announcements: public read (anon + authenticated), admin write
- site_content: public read (anon + authenticated), admin write

## Important Notes
1. Only active FAQs and announcements are publicly visible
2. site_content uses a key-value approach for flexible content management
3. All three tables are intentionally simple — no complex CMS features
*/

-- ===== SITE FAQs =====
CREATE TABLE IF NOT EXISTS public.site_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS site_faqs_updated_at ON public.site_faqs;
CREATE TRIGGER site_faqs_updated_at BEFORE UPDATE ON public.site_faqs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.site_faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sf_select_all" ON public.site_faqs;
CREATE POLICY "sf_select_all" ON public.site_faqs
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "sf_admin_write" ON public.site_faqs;
CREATE POLICY "sf_admin_write" ON public.site_faqs
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ===== ANNOUNCEMENTS =====
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  type text DEFAULT 'info',
  is_active boolean DEFAULT true,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS announcements_updated_at ON public.announcements;
CREATE TRIGGER announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ann_select_all" ON public.announcements;
CREATE POLICY "ann_select_all" ON public.announcements
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "ann_admin_write" ON public.announcements;
CREATE POLICY "ann_admin_write" ON public.announcements
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ===== SITE CONTENT =====
CREATE TABLE IF NOT EXISTS public.site_content (
  id text PRIMARY KEY,
  value text,
  description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS site_content_updated_at ON public.site_content;
CREATE TRIGGER site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sc_select_all" ON public.site_content;
CREATE POLICY "sc_select_all" ON public.site_content
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "sc_admin_write" ON public.site_content;
CREATE POLICY "sc_admin_write" ON public.site_content
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
