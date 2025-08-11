-- Add optional image_url for digi_categories for media library selection

BEGIN;

ALTER TABLE public.digi_categories
  ADD COLUMN IF NOT EXISTS image_url text NULL;

COMMIT;
