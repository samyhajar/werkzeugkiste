-- Fix: Remove status fields from all tables by first dropping dependent policies
DO $$
BEGIN
    -- Drop RLS policies that depend on the status column first

    -- Drop policies on modules table
    DROP POLICY IF EXISTS "Published modules are viewable by all" ON modules;
    DROP POLICY IF EXISTS "Users can view their own modules" ON modules;
    DROP POLICY IF EXISTS "Admins can manage all modules" ON modules;

    -- Drop policies on courses table
    DROP POLICY IF EXISTS "Published courses are viewable by all" ON courses;
    DROP POLICY IF EXISTS "Users can view their own courses" ON courses;
    DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;

    -- Drop policies on lessons table
    DROP POLICY IF EXISTS "Lessons viewable if course published" ON lessons;
    DROP POLICY IF EXISTS "Users can view their own lessons" ON lessons;
    DROP POLICY IF EXISTS "Admins can manage all lessons" ON lessons;

    -- Drop policies on quizzes table
    DROP POLICY IF EXISTS "Quizzes viewable if course published" ON quizzes;
    DROP POLICY IF EXISTS "Users can view their own quizzes" ON quizzes;
    DROP POLICY IF EXISTS "Admins can manage all quizzes" ON quizzes;

    -- Drop policies on questions table
    DROP POLICY IF EXISTS "Questions viewable if course published" ON questions;
    DROP POLICY IF EXISTS "Users can view their own questions" ON questions;
    DROP POLICY IF EXISTS "Admins can manage all questions" ON questions;

    -- Drop policies on options table
    DROP POLICY IF EXISTS "Options viewable if course published" ON options;
    DROP POLICY IF EXISTS "Users can view their own options" ON options;
    DROP POLICY IF EXISTS "Admins can manage all options" ON options;

    -- Drop policies on enhanced_quizzes table
    DROP POLICY IF EXISTS "Enhanced quizzes viewable if course published" ON enhanced_quizzes;
    DROP POLICY IF EXISTS "Users can view their own enhanced quizzes" ON enhanced_quizzes;
    DROP POLICY IF EXISTS "Admins can manage all enhanced quizzes" ON enhanced_quizzes;

    -- Drop policies on quiz_questions table
    DROP POLICY IF EXISTS "Quiz questions viewable if quiz is accessible" ON quiz_questions;
    DROP POLICY IF EXISTS "Users can view their own quiz questions" ON quiz_questions;
    DROP POLICY IF EXISTS "Admins can manage all quiz questions" ON quiz_questions;

    -- Drop policies on quiz_answers table
    DROP POLICY IF EXISTS "Quiz answers viewable if question is accessible" ON quiz_answers;
    DROP POLICY IF EXISTS "Users can view their own quiz answers" ON quiz_answers;
    DROP POLICY IF EXISTS "Admins can manage all quiz answers" ON quiz_answers;

    RAISE NOTICE 'Dropped all RLS policies that depend on status columns';

    -- Now remove status columns
    -- Remove status column from courses table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'courses' AND column_name = 'status'
    ) THEN
        ALTER TABLE courses DROP COLUMN status;
        RAISE NOTICE 'Removed status column from courses table';
    END IF;

    -- Remove status column from modules table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'modules' AND column_name = 'status'
    ) THEN
        ALTER TABLE modules DROP COLUMN status;
        RAISE NOTICE 'Removed status column from modules table';
    END IF;

    -- Remove status column from lessons table if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'lessons' AND column_name = 'status'
    ) THEN
        ALTER TABLE lessons DROP COLUMN status;
        RAISE NOTICE 'Removed status column from lessons table';
    END IF;

    -- Remove status column from quizzes table if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quizzes' AND column_name = 'status'
    ) THEN
        ALTER TABLE quizzes DROP COLUMN status;
        RAISE NOTICE 'Removed status column from quizzes table';
    END IF;

    -- Remove status column from enhanced_quizzes table if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'enhanced_quizzes' AND column_name = 'status'
    ) THEN
        ALTER TABLE enhanced_quizzes DROP COLUMN status;
        RAISE NOTICE 'Removed status column from enhanced_quizzes table';
    END IF;

    RAISE NOTICE 'All status fields have been removed from the database';
END $$;