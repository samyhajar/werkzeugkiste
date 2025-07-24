-- Fix any remaining RLS policies that still reference the status column
DO $$
BEGIN
    -- Drop and recreate all RLS policies that might still reference status columns

    -- Enhanced quizzes policies
    DROP POLICY IF EXISTS "Enhanced quizzes viewable if course published" ON enhanced_quizzes;
    DROP POLICY IF EXISTS "Enhanced quizzes viewable if lesson published" ON enhanced_quizzes;
    DROP POLICY IF EXISTS "Enhanced quizzes viewable if course published" ON enhanced_quizzes;
    DROP POLICY IF EXISTS "Enhanced quizzes viewable if lesson published" ON enhanced_quizzes;

    -- Quiz questions policies
    DROP POLICY IF EXISTS "Quiz questions viewable if quiz is accessible" ON quiz_questions;
    DROP POLICY IF EXISTS "Quiz questions viewable if course published" ON quiz_questions;
    DROP POLICY IF EXISTS "Quiz questions viewable if lesson published" ON quiz_questions;

    -- Quiz answers policies
    DROP POLICY IF EXISTS "Quiz answers viewable if question is accessible" ON quiz_answers;
    DROP POLICY IF EXISTS "Quiz answers viewable if course published" ON quiz_answers;
    DROP POLICY IF EXISTS "Quiz answers viewable if lesson published" ON quiz_answers;

    -- Lessons policies
    DROP POLICY IF EXISTS "Lessons viewable if course published" ON lessons;

    -- Quizzes policies
    DROP POLICY IF EXISTS "Quizzes viewable if course published" ON quizzes;
    DROP POLICY IF EXISTS "Quizzes viewable if lesson published" ON quizzes;

    -- Questions policies
    DROP POLICY IF EXISTS "Questions viewable if course published" ON questions;
    DROP POLICY IF EXISTS "Questions viewable if lesson published" ON questions;

    -- Options policies
    DROP POLICY IF EXISTS "Options viewable if course published" ON options;
    DROP POLICY IF EXISTS "Options viewable if lesson published" ON options;

    -- Courses policies
    DROP POLICY IF EXISTS "Published courses are viewable by all" ON courses;

    -- Modules policies
    DROP POLICY IF EXISTS "Published modules are viewable by all" ON modules;

    RAISE NOTICE 'Dropped all RLS policies that might reference status columns';

        -- Recreate policies without status references (only if they don't exist)
    DROP POLICY IF EXISTS "Enhanced quizzes are viewable by all" ON enhanced_quizzes;
    CREATE POLICY "Enhanced quizzes are viewable by all" ON enhanced_quizzes
      FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Quiz questions are viewable by all" ON quiz_questions;
    CREATE POLICY "Quiz questions are viewable by all" ON quiz_questions
      FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Quiz answers are viewable by all" ON quiz_answers;
    CREATE POLICY "Quiz answers are viewable by all" ON quiz_answers
      FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Lessons are viewable by all" ON lessons;
    CREATE POLICY "Lessons are viewable by all" ON lessons
      FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Quizzes are viewable by all" ON quizzes;
    CREATE POLICY "Quizzes are viewable by all" ON quizzes
      FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Questions are viewable by all" ON questions;
    CREATE POLICY "Questions are viewable by all" ON questions
      FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Options are viewable by all" ON options;
    CREATE POLICY "Options are viewable by all" ON options
      FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Courses are viewable by all" ON courses;
    CREATE POLICY "Courses are viewable by all" ON courses
      FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Modules are viewable by all" ON modules;
    CREATE POLICY "Modules are viewable by all" ON modules
      FOR SELECT USING (true);

    RAISE NOTICE 'Recreated all RLS policies without status references';

END $$;