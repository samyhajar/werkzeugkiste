-- Fix missing created_at and updated_at values for existing records
-- This migration ensures all existing records have proper timestamps

-- Update modules table
UPDATE modules
SET
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL OR updated_at IS NULL;

-- Update courses table
UPDATE courses
SET
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL OR updated_at IS NULL;

-- Update lessons table
UPDATE lessons
SET
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL OR updated_at IS NULL;

-- Update enhanced_quizzes table
UPDATE enhanced_quizzes
SET
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL OR updated_at IS NULL;

-- Update profiles table
UPDATE profiles
SET
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL OR updated_at IS NULL;

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Fixed missing timestamps for existing records';
END $$;