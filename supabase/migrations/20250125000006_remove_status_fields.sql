-- Remove status fields from all tables
DO $$
BEGIN
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