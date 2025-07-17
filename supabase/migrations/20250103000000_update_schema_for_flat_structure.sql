-- Migration to update schema for flat structure
-- Make foreign keys nullable and add missing fields

-- 1. Update lessons table to make course_id nullable
ALTER TABLE lessons ALTER COLUMN course_id DROP NOT NULL;

-- 2. Update quizzes table to make lesson_id nullable and add description
ALTER TABLE quizzes ALTER COLUMN lesson_id DROP NOT NULL;
ALTER TABLE quizzes ADD COLUMN description text;

-- 3. Add content column to lessons (aliasing markdown for backward compatibility)
ALTER TABLE lessons ADD COLUMN content text;

-- 4. Update existing lessons to copy markdown content to content field
UPDATE lessons SET content = markdown WHERE markdown IS NOT NULL;

-- 5. Add pass_percentage column to quizzes (aliasing pass_pct for backward compatibility)
ALTER TABLE quizzes ADD COLUMN pass_percentage int DEFAULT 70;

-- 6. Update existing quizzes to copy pass_pct to pass_percentage
UPDATE quizzes SET pass_percentage = pass_pct WHERE pass_pct IS NOT NULL;

-- 7. Update RLS policies to handle nullable foreign keys

-- Drop existing policies that assume non-null relationships
DROP POLICY IF EXISTS "Students can read lessons of published courses" ON lessons;
DROP POLICY IF EXISTS "Students can read quizzes of published courses" ON quizzes;
DROP POLICY IF EXISTS "Students can read questions of published courses" ON questions;
DROP POLICY IF EXISTS "Students can read options of published courses" ON options;

-- Create new policies that handle nullable relationships
CREATE POLICY "Students can read lessons of published courses or standalone lessons" ON lessons
  FOR select USING (
    course_id IS NULL OR
    EXISTS (
      SELECT 1 FROM courses WHERE id = lessons.course_id AND status = 'published'
    )
  );

CREATE POLICY "Students can read quizzes of published courses or standalone quizzes" ON quizzes
  FOR select USING (
    lesson_id IS NULL OR
    EXISTS (
      SELECT 1 FROM lessons l
      LEFT JOIN courses c ON c.id = l.course_id
      WHERE l.id = quizzes.lesson_id AND (c.status = 'published' OR l.course_id IS NULL)
    )
  );

CREATE POLICY "Students can read questions of published courses or standalone quizzes" ON questions
  FOR select USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      LEFT JOIN lessons l ON l.id = q.lesson_id
      LEFT JOIN courses c ON c.id = l.course_id
      WHERE q.id = questions.quiz_id AND (
        q.lesson_id IS NULL OR
        l.course_id IS NULL OR
        c.status = 'published'
      )
    )
  );

CREATE POLICY "Students can read options of published courses or standalone content" ON options
  FOR select USING (
    EXISTS (
      SELECT 1 FROM questions q
      JOIN quizzes qz ON qz.id = q.quiz_id
      LEFT JOIN lessons l ON l.id = qz.lesson_id
      LEFT JOIN courses c ON c.id = l.course_id
      WHERE q.id = options.question_id AND (
        qz.lesson_id IS NULL OR
        l.course_id IS NULL OR
        c.status = 'published'
      )
    )
  );

-- 8. Update function to handle nullable relationships in certificate generation
CREATE OR REPLACE FUNCTION can_issue_certificate(course_id_param uuid, student_id_param uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if student has completed all lessons in the course
  RETURN NOT EXISTS (
    SELECT 1 FROM lessons l
    WHERE l.course_id = course_id_param
    AND NOT EXISTS (
      SELECT 1 FROM lesson_progress lp
      WHERE lp.lesson_id = l.id AND lp.student_id = student_id_param
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Add indexes for the new nullable foreign key patterns
CREATE INDEX IF NOT EXISTS idx_lessons_course_id_null ON lessons(course_id) WHERE course_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id_null ON quizzes(lesson_id) WHERE lesson_id IS NULL;

-- 10. Update triggers to handle the new content field
CREATE OR REPLACE FUNCTION sync_lesson_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Keep markdown and content fields in sync
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.content IS NOT NULL AND NEW.content != OLD.content THEN
      NEW.markdown = NEW.content;
    END IF;
    IF NEW.markdown IS NOT NULL AND NEW.markdown != OLD.markdown THEN
      NEW.content = NEW.markdown;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_lesson_content_trigger
  BEFORE INSERT OR UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION sync_lesson_content();

-- 11. Update triggers to handle the new pass_percentage field
CREATE OR REPLACE FUNCTION sync_quiz_pass_percentage()
RETURNS TRIGGER AS $$
BEGIN
  -- Keep pass_pct and pass_percentage fields in sync
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.pass_percentage IS NOT NULL AND NEW.pass_percentage != OLD.pass_percentage THEN
      NEW.pass_pct = NEW.pass_percentage;
    END IF;
    IF NEW.pass_pct IS NOT NULL AND NEW.pass_pct != OLD.pass_pct THEN
      NEW.pass_percentage = NEW.pass_pct;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_quiz_pass_percentage_trigger
  BEFORE INSERT OR UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION sync_quiz_pass_percentage();