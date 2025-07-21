-- Fix RLS policies for lesson_progress table to support UPSERT operations
DO $$
BEGIN
    -- Drop existing policies for lesson_progress
    DROP POLICY IF EXISTS "Users can view own progress" ON lesson_progress;
    DROP POLICY IF EXISTS "Users can insert own progress" ON lesson_progress;
    DROP POLICY IF EXISTS "Users can update own progress" ON lesson_progress;
    DROP POLICY IF EXISTS "Admins can view all progress" ON lesson_progress;

    -- Create comprehensive policies for lesson_progress

    -- Allow users to SELECT their own progress
    CREATE POLICY "Users can view own progress" ON lesson_progress
      FOR SELECT USING (student_id = auth.uid());

    -- Allow users to INSERT their own progress
    CREATE POLICY "Users can insert own progress" ON lesson_progress
      FOR INSERT WITH CHECK (student_id = auth.uid());

    -- Allow users to UPDATE their own progress
    CREATE POLICY "Users can update own progress" ON lesson_progress
      FOR UPDATE USING (student_id = auth.uid())
      WITH CHECK (student_id = auth.uid());

    -- Allow admins to manage all progress records
    CREATE POLICY "Admins can manage all progress" ON lesson_progress
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    RAISE NOTICE 'Fixed RLS policies for lesson_progress table to support UPSERT operations';

END $$;