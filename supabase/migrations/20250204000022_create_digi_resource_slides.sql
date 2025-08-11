-- Slides for each digi resource (for carousel content)

BEGIN;

CREATE TABLE IF NOT EXISTS public.digi_resource_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES public.digi_resources(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NULL,
  link_url text NULL,
  image_url text NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.digi_resource_slides ENABLE ROW LEVEL SECURITY;

-- Public can read slides
DROP POLICY IF EXISTS "Public read digi_resource_slides" ON public.digi_resource_slides;
CREATE POLICY "Public read digi_resource_slides" ON public.digi_resource_slides FOR SELECT TO anon, authenticated USING (true);

-- Admins can manage slides
DROP POLICY IF EXISTS "Admins manage digi_resource_slides" ON public.digi_resource_slides;
CREATE POLICY "Admins manage digi_resource_slides" ON public.digi_resource_slides FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_digi_resource_slides ON public.digi_resource_slides;
CREATE TRIGGER set_timestamp_digi_resource_slides
BEFORE UPDATE ON public.digi_resource_slides
FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();

COMMIT;
