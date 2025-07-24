-- Fix lesson_progress foreign key constraint to include CASCADE DELETE
-- This will allow modules to be deleted properly by cascading through courses -> lessons -> lesson_progress

-- Drop the existing constraint
ALTER TABLE "public"."lesson_progress"
DROP CONSTRAINT "lesson_progress_lesson_id_fkey";

-- Add the constraint back with CASCADE DELETE
ALTER TABLE "public"."lesson_progress"
ADD CONSTRAINT "lesson_progress_lesson_id_fkey"
FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;