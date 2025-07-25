-- Add order column to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS order INTEGER DEFAULT 0;

-- Update existing courses with order values based on their creation date
WITH ordered_courses AS (
  SELECT id, ROW_NUMBER() OVER(PARTITION BY module_id ORDER BY created_at) - 1 as new_order
  FROM courses
  WHERE module_id IS NOT NULL
)
UPDATE courses
SET order = ordered_courses.new_order
FROM ordered_courses
WHERE courses.id = ordered_courses.id;

-- Set order to 0 for courses without a module_id
UPDATE courses SET order = 0 WHERE module_id IS NULL AND order IS NULL;