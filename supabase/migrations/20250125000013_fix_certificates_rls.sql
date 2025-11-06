-- Add RLS policies for certificates table
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;
DROP POLICY IF EXISTS "Users can insert own certificates" ON certificates;
DROP POLICY IF EXISTS "Admins can view all certificates" ON certificates;

-- Determine which column exists (student_id or user_id) and create policies accordingly
DO $$
DECLARE
  has_user_id BOOLEAN;
  has_student_id BOOLEAN;
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
    RAISE EXCEPTION 'Certificates table must have either user_id or student_id column';
  END IF;

  -- Create policies using the correct column name
  EXECUTE format('
    CREATE POLICY "Users can view own certificates" ON certificates
      FOR SELECT USING (auth.uid() = %I);
  ', user_column_name);

  EXECUTE format('
    CREATE POLICY "Users can insert own certificates" ON certificates
      FOR INSERT WITH CHECK (auth.uid() = %I);
  ', user_column_name);
END $$;

-- Allow admins to view all certificates
CREATE POLICY "Admins can view all certificates" ON certificates
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Add a comment about the certificates table
COMMENT ON TABLE certificates IS 'Certificates table - stores generated PDF certificates for completed modules';