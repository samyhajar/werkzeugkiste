-- Alter certificates table to be module-based
-- This script is now idempotent and can be run safely even if partially applied.

-- Rename student_id to user_id if it exists and user_id doesn't
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='certificates' AND column_name='student_id')
     AND NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='certificates' AND column_name='user_id') THEN
    ALTER TABLE public.certificates RENAME COLUMN student_id TO user_id;
    RAISE NOTICE 'Renamed student_id to user_id in certificates table';
  END IF;
END $$;

-- Add module_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='certificates' AND column_name='module_id') THEN
    ALTER TABLE public.certificates ADD COLUMN module_id UUID REFERENCES modules(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop course_id column if it exists
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='certificates' AND column_name='course_id') THEN
    ALTER TABLE public.certificates DROP COLUMN course_id;
  END IF;
END $$;

-- Recreate primary key if it doesn't match the new structure
DO $$
DECLARE
  constraint_name text;
  null_count INTEGER;
BEGIN
  -- Clean up invalid certificates (those with NULL module_id) before creating primary key
  -- These are old certificates from the course-based schema that can't be migrated
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='certificates' AND column_name='module_id') THEN
    SELECT COUNT(*) INTO null_count
    FROM public.certificates
    WHERE module_id IS NULL;

    IF null_count > 0 THEN
      DELETE FROM public.certificates WHERE module_id IS NULL;
      RAISE NOTICE 'Deleted % invalid certificates with NULL module_id', null_count;
    END IF;
  END IF;

  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.certificates'::regclass
    AND contype = 'p';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.certificates DROP CONSTRAINT ' || quote_ident(constraint_name);
  END IF;

  -- Only create primary key if both user_id and module_id exist and there are no NULL values
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='certificates' AND column_name='user_id')
     AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='certificates' AND column_name='module_id')
     AND NOT EXISTS(SELECT 1 FROM public.certificates WHERE user_id IS NULL OR module_id IS NULL) THEN
    ALTER TABLE public.certificates ADD PRIMARY KEY (user_id, module_id);
    RAISE NOTICE 'Created primary key on (user_id, module_id)';
  ELSIF EXISTS(SELECT 1 FROM public.certificates WHERE user_id IS NULL OR module_id IS NULL) THEN
    RAISE WARNING 'Cannot create primary key: certificates table contains NULL values in user_id or module_id';
  END IF;
END $$;
