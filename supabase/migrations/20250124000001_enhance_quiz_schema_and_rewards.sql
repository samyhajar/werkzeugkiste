-- Enhanced Quiz Schema and Rewards System
-- This migration implements a comprehensive quiz system with proper question types,
-- answers, and a rewards system for lesson progress tracking.

-- 1. Create new quiz-related enums and tables
CREATE TYPE quiz_scope AS ENUM ('course', 'lesson');
CREATE TYPE quiz_feedback_mode AS ENUM ('per_question', 'at_end', 'none');
CREATE TYPE question_type AS ENUM (
  'single', 'multiple', 'true_false', 'free_text',
  'fill_blank', 'sorting', 'matching', 'matrix'
);

-- Enhanced quizzes table
CREATE TABLE IF NOT EXISTS enhanced_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT,                     -- WP quiz_pro_id / post_id
  scope quiz_scope NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  pass_percent NUMERIC(5,2) DEFAULT 0, -- WP sfwd-quiz_passingpercentage
  max_points INT DEFAULT 0,
  feedback_mode quiz_feedback_mode DEFAULT 'at_end',
  sort_order INT DEFAULT 0,
  settings JSONB DEFAULT '{}'::jsonb,  -- dump the rest of those sfwd-quiz_* flags here
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT,               -- WP sfwd-question post_id
  quiz_id UUID NOT NULL REFERENCES enhanced_quizzes(id) ON DELETE CASCADE,
  type question_type NOT NULL,
  question_html TEXT NOT NULL,
  explanation_html TEXT,        -- feedback/explanation
  points INT DEFAULT 1,
  category TEXT,
  sort_order INT DEFAULT 0,
  meta JSONB DEFAULT '{}'::jsonb
);

-- Answers / Choices table
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  legacy_id TEXT,
  answer_html TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  feedback_html TEXT,
  sort_order INT DEFAULT 0,
  value_numeric NUMERIC,        -- for numeric/matrix answers
  value_text TEXT,
  meta JSONB DEFAULT '{}'::jsonb
);

-- Enhanced user attempts table
CREATE TABLE IF NOT EXISTS enhanced_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES enhanced_quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  score_points INT DEFAULT 0,
  score_percent NUMERIC(5,2),
  passed BOOLEAN,
  raw_answers JSONB,            -- for auditing; store what the user picked/typed
  meta JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX quiz_attempts_user_quiz_idx ON enhanced_quiz_attempts (user_id, quiz_id);
CREATE INDEX quiz_questions_quiz_id_idx ON quiz_questions (quiz_id);
CREATE INDEX quiz_answers_question_id_idx ON quiz_answers (question_id);

-- 2. Update lesson_progress for rewards (Option A - simplest approach)
ALTER TABLE lesson_progress
  ADD COLUMN IF NOT EXISTS xp_awarded INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS progress_percent NUMERIC(5,2) DEFAULT 0;

-- 3. Create rewards table for flexible reward tracking (Option B)
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('lesson', 'quiz', 'manual', 'badge')),
  source_id UUID NOT NULL,
  points INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT
);

-- Create index for rewards
CREATE INDEX rewards_user_id_idx ON rewards (user_id);

-- 4. Enable Row Level Security for new tables
ALTER TABLE enhanced_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for new tables

-- Enhanced Quizzes policies
CREATE POLICY "Enhanced quizzes viewable if course published" ON enhanced_quizzes
  FOR SELECT USING (
    (scope = 'course' AND EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = enhanced_quizzes.course_id
      AND courses.status = 'published'
    )) OR
    (scope = 'lesson' AND EXISTS (
      SELECT 1 FROM lessons
      JOIN courses ON courses.id = lessons.course_id
      WHERE lessons.id = enhanced_quizzes.lesson_id
      AND courses.status = 'published'
    ))
  );

CREATE POLICY "Admins can manage enhanced quizzes" ON enhanced_quizzes
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Quiz Questions policies
CREATE POLICY "Quiz questions viewable if quiz is accessible" ON quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enhanced_quizzes
      WHERE enhanced_quizzes.id = quiz_questions.quiz_id
      AND (
        (enhanced_quizzes.scope = 'course' AND EXISTS (
          SELECT 1 FROM courses
          WHERE courses.id = enhanced_quizzes.course_id
          AND courses.status = 'published'
        )) OR
        (enhanced_quizzes.scope = 'lesson' AND EXISTS (
          SELECT 1 FROM lessons
          JOIN courses ON courses.id = lessons.course_id
          WHERE lessons.id = enhanced_quizzes.lesson_id
          AND courses.status = 'published'
        ))
      )
    )
  );

CREATE POLICY "Admins can manage quiz questions" ON quiz_questions
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Quiz Answers policies
CREATE POLICY "Quiz answers viewable if question is accessible" ON quiz_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_questions
      JOIN enhanced_quizzes ON enhanced_quizzes.id = quiz_questions.quiz_id
      WHERE quiz_questions.id = quiz_answers.question_id
      AND (
        (enhanced_quizzes.scope = 'course' AND EXISTS (
          SELECT 1 FROM courses
          WHERE courses.id = enhanced_quizzes.course_id
          AND courses.status = 'published'
        )) OR
        (enhanced_quizzes.scope = 'lesson' AND EXISTS (
          SELECT 1 FROM lessons
          JOIN courses ON courses.id = lessons.course_id
          WHERE lessons.id = enhanced_quizzes.lesson_id
          AND courses.status = 'published'
        ))
      )
    )
  );

CREATE POLICY "Admins can manage quiz answers" ON quiz_answers
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Enhanced Quiz Attempts policies
CREATE POLICY "Users can view own enhanced quiz attempts" ON enhanced_quiz_attempts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all enhanced quiz attempts" ON enhanced_quiz_attempts
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can insert own enhanced quiz attempts" ON enhanced_quiz_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Rewards policies
CREATE POLICY "Users can view own rewards" ON rewards
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all rewards" ON rewards
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can insert own rewards" ON rewards
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 6. Create helper functions for reward calculations

-- Function to calculate total XP for a user
CREATE OR REPLACE FUNCTION get_user_total_xp(user_uuid UUID)
RETURNS INT AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(points)
    FROM rewards
    WHERE user_id = user_uuid
  ), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award XP for lesson completion
CREATE OR REPLACE FUNCTION award_lesson_xp(
  user_uuid UUID,
  lesson_uuid UUID,
  xp_amount INT DEFAULT 10,
  reason TEXT DEFAULT 'Lesson completion'
)
RETURNS VOID AS $$
BEGIN
  -- Insert reward record
  INSERT INTO rewards (user_id, source_type, source_id, points, note)
  VALUES (user_uuid, 'lesson', lesson_uuid, xp_amount, reason);

  -- Update lesson_progress with XP awarded
  UPDATE lesson_progress
  SET xp_awarded = xp_amount,
      reward_reason = reason
  WHERE student_id = user_uuid AND lesson_id = lesson_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award XP for quiz completion
CREATE OR REPLACE FUNCTION award_quiz_xp(
  user_uuid UUID,
  quiz_uuid UUID,
  xp_amount INT DEFAULT 5,
  reason TEXT DEFAULT 'Quiz completion'
)
RETURNS VOID AS $$
BEGIN
  -- Insert reward record
  INSERT INTO rewards (user_id, source_type, source_id, points, note)
  VALUES (user_uuid, 'quiz', quiz_uuid, xp_amount, reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create staging tables for CSV imports (as suggested)

-- Raw staging table for quizzes
CREATE TABLE IF NOT EXISTS wp_quizzes_raw (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  course_id TEXT,
  lesson_id TEXT,
  pass_percent NUMERIC(5,2),
  max_points INT,
  feedback_mode TEXT,
  sort_order INT,
  settings JSONB
);

-- Raw staging table for questions
CREATE TABLE IF NOT EXISTS wp_questions_raw (
  id TEXT PRIMARY KEY,
  quiz_id TEXT,
  question_html TEXT,
  explanation_html TEXT,
  type TEXT,
  points INT,
  category TEXT,
  sort_order INT,
  meta JSONB
);

-- Raw staging table for answers
CREATE TABLE IF NOT EXISTS wp_answers_raw (
  id TEXT PRIMARY KEY,
  question_id TEXT,
  answer_html TEXT,
  is_correct BOOLEAN,
  feedback_html TEXT,
  sort_order INT,
  value_numeric NUMERIC,
  value_text TEXT,
  meta JSONB
);

-- 8. Create views for easier data access

-- View for quiz details with course/lesson info
CREATE OR REPLACE VIEW quiz_details AS
SELECT
  eq.id,
  eq.title,
  eq.description,
  eq.scope,
  eq.course_id,
  eq.lesson_id,
  eq.pass_percent,
  eq.max_points,
  eq.feedback_mode,
  c.title as course_title,
  l.title as lesson_title,
  COUNT(qq.id) as question_count
FROM enhanced_quizzes eq
LEFT JOIN courses c ON c.id = eq.course_id
LEFT JOIN lessons l ON l.id = eq.lesson_id
LEFT JOIN quiz_questions qq ON qq.quiz_id = eq.id
GROUP BY eq.id, eq.title, eq.description, eq.scope, eq.course_id, eq.lesson_id,
         eq.pass_percent, eq.max_points, eq.feedback_mode, c.title, l.title;

-- View for user progress with rewards
CREATE OR REPLACE VIEW user_progress_with_rewards AS
SELECT
  lp.student_id,
  lp.lesson_id,
  lp.completed_at,
  lp.xp_awarded,
  lp.reward_reason,
  lp.last_viewed_at,
  lp.progress_percent,
  l.title as lesson_title,
  c.title as course_title,
  get_user_total_xp(lp.student_id) as total_xp
FROM lesson_progress lp
JOIN lessons l ON l.id = lp.lesson_id
JOIN courses c ON c.id = l.course_id;

-- 9. Add comments for documentation
COMMENT ON TABLE enhanced_quizzes IS 'Enhanced quizzes table supporting both course and lesson scoped quizzes';
COMMENT ON TABLE quiz_questions IS 'Questions for quizzes with support for multiple question types';
COMMENT ON TABLE quiz_answers IS 'Answer choices for quiz questions';
COMMENT ON TABLE enhanced_quiz_attempts IS 'User attempts at quizzes with detailed scoring';
COMMENT ON TABLE rewards IS 'Flexible reward system for tracking all types of user achievements';
COMMENT ON FUNCTION get_user_total_xp IS 'Calculate total XP earned by a user across all sources';
COMMENT ON FUNCTION award_lesson_xp IS 'Award XP for lesson completion and update progress';
COMMENT ON FUNCTION award_quiz_xp IS 'Award XP for quiz completion';