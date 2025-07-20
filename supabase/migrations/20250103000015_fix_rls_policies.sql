-- Fix RLS policies for lesson_progress and modules
DO $$
BEGIN
    -- Add missing UPDATE policy for lesson_progress (needed for UPSERT operations)
    DROP POLICY IF EXISTS "Users can update own progress" ON lesson_progress;
    CREATE POLICY "Users can update own progress" ON lesson_progress
      FOR UPDATE USING (student_id = auth.uid())
      WITH CHECK (student_id = auth.uid());

    -- Add RLS policies for modules table (missing from original schema)
    ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

    -- Allow everyone to read published modules
    DROP POLICY IF EXISTS "Published modules are viewable by all" ON modules;
    CREATE POLICY "Published modules are viewable by all" ON modules
      FOR SELECT USING (status = 'published' OR status IS NULL);

    -- Allow admins to manage all modules
    DROP POLICY IF EXISTS "Admins can manage modules" ON modules;
    CREATE POLICY "Admins can manage modules" ON modules
      FOR ALL USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
      );

    -- Fix quizzes RLS policy to support course-level quizzes (not just lesson-level)
    DROP POLICY IF EXISTS "Quizzes viewable if course published" ON quizzes;
    CREATE POLICY "Quizzes viewable if course published" ON quizzes
      FOR SELECT USING (
        -- Course-level quizzes
        (course_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM courses
          WHERE courses.id = quizzes.course_id
          AND courses.status = 'published'
        ))
        OR
        -- Lesson-level quizzes
        (lesson_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM lessons
          JOIN courses ON courses.id = lessons.course_id
          WHERE lessons.id = quizzes.lesson_id
          AND courses.status = 'published'
        ))
      );

    -- Fix questions RLS policy to support course-level quizzes
    DROP POLICY IF EXISTS "Questions viewable if course published" ON questions;
    CREATE POLICY "Questions viewable if course published" ON questions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM quizzes
          WHERE quizzes.id = questions.quiz_id
          AND (
            -- Course-level quizzes
            (quizzes.course_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM courses
              WHERE courses.id = quizzes.course_id
              AND courses.status = 'published'
            ))
            OR
            -- Lesson-level quizzes
            (quizzes.lesson_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM lessons
              JOIN courses ON courses.id = lessons.course_id
              WHERE lessons.id = quizzes.lesson_id
              AND courses.status = 'published'
            ))
          )
        )
      );

    -- Fix options RLS policy to support course-level quizzes
    DROP POLICY IF EXISTS "Options viewable if course published" ON options;
    CREATE POLICY "Options viewable if course published" ON options
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM questions
          JOIN quizzes ON quizzes.id = questions.quiz_id
          WHERE questions.id = options.question_id
          AND (
            -- Course-level quizzes
            (quizzes.course_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM courses
              WHERE courses.id = quizzes.course_id
              AND courses.status = 'published'
            ))
            OR
            -- Lesson-level quizzes
            (quizzes.lesson_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM lessons
              JOIN courses ON courses.id = lessons.course_id
              WHERE lessons.id = quizzes.lesson_id
              AND courses.status = 'published'
            ))
          )
        )
      );

    RAISE NOTICE 'Fixed RLS policies for lesson_progress, modules, and quiz-related tables';

END $$;