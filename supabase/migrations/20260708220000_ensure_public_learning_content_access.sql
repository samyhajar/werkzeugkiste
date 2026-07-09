-- Ensure anonymous visitors can read the learning content needed to start modules.
-- Writes remain governed by the existing admin/authenticated policies.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON TABLE
  public.modules,
  public.courses,
  public.lessons,
  public.enhanced_quizzes,
  public.quiz_questions,
  public.quiz_answers
TO anon, authenticated;

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read learning modules" ON public.modules;
CREATE POLICY "Public read learning modules"
  ON public.modules
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read learning courses" ON public.courses;
CREATE POLICY "Public read learning courses"
  ON public.courses
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read learning lessons" ON public.lessons;
CREATE POLICY "Public read learning lessons"
  ON public.lessons
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read learning quizzes" ON public.enhanced_quizzes;
CREATE POLICY "Public read learning quizzes"
  ON public.enhanced_quizzes
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read learning quiz questions" ON public.quiz_questions;
CREATE POLICY "Public read learning quiz questions"
  ON public.quiz_questions
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read learning quiz answers" ON public.quiz_answers;
CREATE POLICY "Public read learning quiz answers"
  ON public.quiz_answers
  FOR SELECT
  TO anon, authenticated
  USING (true);
