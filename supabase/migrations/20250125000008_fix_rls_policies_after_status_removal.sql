-- Fix RLS policies after status column removal
DO $$
BEGIN
    -- Fix modules RLS policy (remove status reference)
    DROP POLICY IF EXISTS "Published modules are viewable by all" ON modules;
    CREATE POLICY "Modules are viewable by all" ON modules
      FOR SELECT USING (true);

    -- Fix courses RLS policy (remove status reference)
    DROP POLICY IF EXISTS "Published courses are viewable by all" ON courses;
    CREATE POLICY "Courses are viewable by all" ON courses
      FOR SELECT USING (true);

    -- Fix lessons RLS policy (remove status reference)
    DROP POLICY IF EXISTS "Lessons viewable if course published" ON lessons;
    CREATE POLICY "Lessons are viewable by all" ON lessons
      FOR SELECT USING (true);

    -- Fix quizzes RLS policy (remove status reference)
    DROP POLICY IF EXISTS "Quizzes viewable if course published" ON quizzes;
    CREATE POLICY "Quizzes are viewable by all" ON quizzes
      FOR SELECT USING (true);

    -- Fix questions RLS policy (remove status reference)
    DROP POLICY IF EXISTS "Questions viewable if course published" ON questions;
    CREATE POLICY "Questions are viewable by all" ON questions
      FOR SELECT USING (true);

    -- Fix options RLS policy (remove status reference)
    DROP POLICY IF EXISTS "Options viewable if course published" ON options;
    CREATE POLICY "Options are viewable by all" ON options
      FOR SELECT USING (true);

    -- Fix enhanced_quizzes RLS policy (remove status reference)
    DROP POLICY IF EXISTS "Enhanced quizzes viewable if course published" ON enhanced_quizzes;
    CREATE POLICY "Enhanced quizzes are viewable by all" ON enhanced_quizzes
      FOR SELECT USING (true);

    -- Fix quiz_questions RLS policy (remove status reference)
    DROP POLICY IF EXISTS "Quiz questions viewable if quiz is accessible" ON quiz_questions;
    CREATE POLICY "Quiz questions are viewable by all" ON quiz_questions
      FOR SELECT USING (true);

    -- Fix quiz_answers RLS policy (remove status reference)
    DROP POLICY IF EXISTS "Quiz answers viewable if question is accessible" ON quiz_answers;
    CREATE POLICY "Quiz answers are viewable by all" ON quiz_answers
      FOR SELECT USING (true);

    RAISE NOTICE 'Fixed all RLS policies to remove status column references';

END $$;