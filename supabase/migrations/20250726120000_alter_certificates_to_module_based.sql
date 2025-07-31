-- Alter certificates table to be module-based
-- This script is now idempotent and can be run safely even if partially applied.

-- Add module_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='certificates' AND column_name='module_id') THEN
    ALTER TABLE public.certificates ADD COLUMN module_id UUID REFERENCES modules(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop course_id column if it exists
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='certificates' AND column_name='course_id') THEN
    ALTER TABLE public.certificates DROP COLUMN course_id;
  END IF;
END $$;

-- Recreate primary key if it doesn't match the new structure
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.certificates'::regclass
    AND contype = 'p';

  IF constraint_name IS NOT NULL AND constraint_name != 'certificates_pkey' THEN
    EXECUTE 'ALTER TABLE public.certificates DROP CONSTRAINT ' || quote_ident(constraint_name);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.certificates'::regclass
      AND conname = 'certificates_pkey'
  ) THEN
    ALTER TABLE public.certificates ADD PRIMARY KEY (user_id, module_id);
  END IF;
END $$;
