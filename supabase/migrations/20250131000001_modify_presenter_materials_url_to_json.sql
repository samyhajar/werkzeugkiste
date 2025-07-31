-- Migration to change presenter_materials_url from TEXT to JSONB array to support multiple PDF URLs

-- First, create a new column with JSONB type
ALTER TABLE public.modules
ADD COLUMN presenter_materials_urls JSONB DEFAULT '[]'::jsonb;

-- Migrate existing data: convert single URL to array format
UPDATE public.modules
SET presenter_materials_urls =
  CASE
    WHEN presenter_materials_url IS NOT NULL AND presenter_materials_url != ''
    THEN jsonb_build_array(jsonb_build_object('url', presenter_materials_url, 'title', 'Module Materials'))
    ELSE '[]'::jsonb
  END;

-- Drop the old column
ALTER TABLE public.modules
DROP COLUMN presenter_materials_url;

-- Add a check constraint to ensure the JSONB is an array
ALTER TABLE public.modules
ADD CONSTRAINT presenter_materials_urls_is_array
CHECK (jsonb_typeof(presenter_materials_urls) = 'array');

-- Add a comment to document the structure
COMMENT ON COLUMN public.modules.presenter_materials_urls IS
'Array of PDF objects with structure: [{"url": "https://...", "title": "PDF Title"}]';