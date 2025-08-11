-- Add optional icon field to digi_categories and seed defaults

BEGIN;

ALTER TABLE public.digi_categories
  ADD COLUMN IF NOT EXISTS icon text NULL;

-- Seed sensible defaults for existing categories
UPDATE public.digi_categories SET icon = 'briefcase' WHERE slug = 'erwerbsarbeit' AND icon IS NULL;
UPDATE public.digi_categories SET icon = 'message-square' WHERE slug = 'kommunikation-medien-technisches' AND icon IS NULL;
UPDATE public.digi_categories SET icon = 'life-buoy' WHERE slug = 'alltaegliches-verschiedenes' AND icon IS NULL;

COMMIT;
