-- Digi-Sammlung structured schema: categories and resources

BEGIN;

CREATE TABLE IF NOT EXISTS public.digi_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.digi_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.digi_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NULL,
  url text NOT NULL,
  logo_url text NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Timestamps trigger
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_digi_categories ON public.digi_categories;
CREATE TRIGGER set_timestamp_digi_categories
BEFORE UPDATE ON public.digi_categories
FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_digi_resources ON public.digi_resources;
CREATE TRIGGER set_timestamp_digi_resources
BEFORE UPDATE ON public.digi_resources
FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();

ALTER TABLE public.digi_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digi_resources ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "Public read digi_categories" ON public.digi_categories;
CREATE POLICY "Public read digi_categories" ON public.digi_categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read digi_resources" ON public.digi_resources;
CREATE POLICY "Public read digi_resources" ON public.digi_resources FOR SELECT TO anon, authenticated USING (true);

-- Admin manage
DROP POLICY IF EXISTS "Admins manage digi_categories" ON public.digi_categories;
CREATE POLICY "Admins manage digi_categories"
  ON public.digi_categories FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins manage digi_resources" ON public.digi_resources;
CREATE POLICY "Admins manage digi_resources"
  ON public.digi_resources FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Seed initial categories from existing page defaults
INSERT INTO public.digi_categories (title, slug, sort_order)
VALUES
  ('Erwerbsarbeit', 'erwerbsarbeit', 1),
  ('Kommunikation, Medien & Technisches', 'kommunikation-medien-technisches', 2),
  ('Alltägliches & Verschiedenes', 'alltaegliches-verschiedenes', 3)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
