-- Setup cascade deletes for certificates table
-- This handles both student_id and user_id columns
DO $$
DECLARE
  has_user_id BOOLEAN;
  has_student_id BOOLEAN;
  constraint_name TEXT;
  user_column_name TEXT;
BEGIN
  -- Check which columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'certificates'
    AND column_name = 'user_id'
  ) INTO has_user_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'certificates'
    AND column_name = 'student_id'
  ) INTO has_student_id;

  -- Determine which column to use
  IF has_user_id THEN
    user_column_name := 'user_id';
  ELSIF has_student_id THEN
    user_column_name := 'student_id';
  ELSE
    RAISE NOTICE 'Certificates table has neither user_id nor student_id, skipping constraint update';
    RETURN;
  END IF;

  -- Find and drop ALL existing foreign key constraints on the user/student column
  -- This handles constraints referencing both auth.users and profiles
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.certificates'::regclass
      AND c.contype = 'f'
      AND a.attname = user_column_name
  LOOP
    EXECUTE 'ALTER TABLE public.certificates DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
    RAISE NOTICE 'Dropped existing constraint: %', constraint_name;
  END LOOP;

  -- Check if the constraint we want to create already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.certificates'::regclass
      AND conname = format('certificates_%s_fkey', user_column_name)
  ) THEN
    -- Add the new foreign key constraint with ON DELETE CASCADE
    -- Note: This references auth.users(id) as per the original migration
    EXECUTE format('
      ALTER TABLE public.certificates
      ADD CONSTRAINT certificates_%I_fkey
      FOREIGN KEY (%I)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
    ', user_column_name, user_column_name);
    RAISE NOTICE 'Created new constraint: certificates_%_fkey', user_column_name;
  ELSE
    RAISE NOTICE 'Constraint certificates_%_fkey already exists, skipping', user_column_name;
  END IF;

  RAISE NOTICE 'Updated foreign key constraint for certificates.%I with CASCADE DELETE', user_column_name;
END $$;

-- Repeat for any other tables that reference users
-- For example, if there is a 'progress' table:
-- ALTER TABLE public.progress
-- DROP CONSTRAINT progress_user_id_fkey;
--
-- ALTER TABLE public.progress
-- ADD CONSTRAINT progress_user_id_fkey
-- FOREIGN KEY (user_id)
-- REFERENCES auth.users(id)
-- ON DELETE CASCADE;
