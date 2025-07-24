-- Fix lesson_progress student_id foreign key constraint to include CASCADE DELETE
-- This ensures that when a user/profile is deleted, their lesson progress is also deleted

-- Drop the existing constraint
ALTER TABLE "public"."lesson_progress"
DROP CONSTRAINT "lesson_progress_student_id_fkey";

-- Add the constraint back with CASCADE DELETE
ALTER TABLE "public"."lesson_progress"
ADD CONSTRAINT "lesson_progress_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;