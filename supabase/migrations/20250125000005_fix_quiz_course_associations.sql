-- Fix quiz course associations
-- Update quizzes that have lesson_id but missing course_id

UPDATE enhanced_quizzes
SET course_id = (
  SELECT l.course_id
  FROM lessons l
  WHERE l.id = enhanced_quizzes.lesson_id
)
WHERE enhanced_quizzes.lesson_id IS NOT NULL
  AND enhanced_quizzes.course_id IS NULL;

-- Also update quizzes that have scope = 'course' but no course_id
-- These should be associated with the first course in their module
UPDATE enhanced_quizzes
SET course_id = (
  SELECT c.id
  FROM courses c
  JOIN modules m ON c.module_id = m.id
  WHERE m.id = (
    SELECT DISTINCT c2.module_id
    FROM courses c2
    WHERE c2.id IN (
      SELECT DISTINCT course_id
      FROM enhanced_quizzes
      WHERE course_id IS NOT NULL
    )
    LIMIT 1
  )
  ORDER BY c.created_at
  LIMIT 1
)
WHERE enhanced_quizzes.scope = 'course'
  AND enhanced_quizzes.course_id IS NULL
  AND enhanced_quizzes.lesson_id IS NULL;

-- Verify the fix
SELECT
  eq.id as quiz_id,
  eq.title as quiz_title,
  eq.scope,
  eq.course_id,
  eq.lesson_id,
  c.title as course_title
FROM enhanced_quizzes eq
LEFT JOIN courses c ON eq.course_id = c.id
WHERE eq.course_id IS NOT NULL
ORDER BY eq.title;