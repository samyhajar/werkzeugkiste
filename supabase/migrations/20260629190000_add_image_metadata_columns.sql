ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS hero_image_alt text,
  ADD COLUMN IF NOT EXISTS hero_image_public_id text,
  ADD COLUMN IF NOT EXISTS hero_image_width integer,
  ADD COLUMN IF NOT EXISTS hero_image_height integer,
  ADD COLUMN IF NOT EXISTS hero_image_format text;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS hero_image_alt text,
  ADD COLUMN IF NOT EXISTS hero_image_public_id text,
  ADD COLUMN IF NOT EXISTS hero_image_width integer,
  ADD COLUMN IF NOT EXISTS hero_image_height integer,
  ADD COLUMN IF NOT EXISTS hero_image_format text;

ALTER TABLE public.digi_resources
  ADD COLUMN IF NOT EXISTS logo_alt text,
  ADD COLUMN IF NOT EXISTS logo_public_id text,
  ADD COLUMN IF NOT EXISTS logo_width integer,
  ADD COLUMN IF NOT EXISTS logo_height integer,
  ADD COLUMN IF NOT EXISTS logo_format text;

ALTER TABLE public.digi_resource_slides
  ADD COLUMN IF NOT EXISTS image_alt text,
  ADD COLUMN IF NOT EXISTS image_public_id text,
  ADD COLUMN IF NOT EXISTS image_width integer,
  ADD COLUMN IF NOT EXISTS image_height integer,
  ADD COLUMN IF NOT EXISTS image_format text;
