-- Migration to change presenter_materials_url from TEXT to JSONB array to support multiple PDF URLs

DO $$
BEGIN
  -- First, create a new column with JSONB type if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'modules'
    AND column_name = 'presenter_materials_urls'
  ) THEN
    ALTER TABLE public.modules
    ADD COLUMN presenter_materials_urls JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Migrate existing data: convert single URL to array format (only if old column exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'modules'
    AND column_name = 'presenter_materials_url'
  ) THEN
    UPDATE public.modules
    SET presenter_materials_urls =
      CASE
        WHEN presenter_materials_url IS NOT NULL AND presenter_materials_url != ''
        THEN jsonb_build_array(jsonb_build_object('url', presenter_materials_url, 'title', 'Module Materials'))
        ELSE COALESCE(presenter_materials_urls, '[]'::jsonb)
      END
    WHERE presenter_materials_urls IS NULL OR presenter_materials_urls = '[]'::jsonb;

    -- Drop the old column
    ALTER TABLE public.modules
    DROP COLUMN presenter_materials_url;
  END IF;

  -- Add a check constraint to ensure the JSONB is an array (if it doesn't exist)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
    AND table_name = 'modules'
    AND constraint_name = 'presenter_materials_urls_is_array'
  ) THEN
    ALTER TABLE public.modules
    ADD CONSTRAINT presenter_materials_urls_is_array
    CHECK (jsonb_typeof(presenter_materials_urls) = 'array');
  END IF;

  -- Add a comment to document the structure
  COMMENT ON COLUMN public.modules.presenter_materials_urls IS
  'Array of PDF objects with structure: [{"url": "https://...", "title": "PDF Title"}]';
END $$;