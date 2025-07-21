-- Fix API issues: add missing email field and improve RLS policies
DO $$
BEGIN
    -- Add email field to profiles table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;

        -- Populate email field from auth.users
        UPDATE profiles
        SET email = au.email
        FROM auth.users au
        WHERE profiles.id = au.id
        AND profiles.email IS NULL;

        RAISE NOTICE 'Added email field to profiles table';
    END IF;

    -- Add first_name field to profiles table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'first_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN first_name TEXT;

        -- Try to extract first name from full_name
        UPDATE profiles
        SET first_name = SPLIT_PART(full_name, ' ', 1)
        WHERE first_name IS NULL AND full_name IS NOT NULL;

        RAISE NOTICE 'Added first_name field to profiles table';
    END IF;

    -- Fix quiz_attempts table to match expected schema
    -- Add missing columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quiz_attempts' AND column_name = 'user_id'
    ) THEN
        -- Add user_id column if it doesn't exist
        ALTER TABLE quiz_attempts ADD COLUMN user_id UUID REFERENCES profiles(id);

        -- Copy data from student_id to user_id
        UPDATE quiz_attempts SET user_id = student_id WHERE user_id IS NULL;

        RAISE NOTICE 'Added user_id column to quiz_attempts table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quiz_attempts' AND column_name = 'score_raw'
    ) THEN
        ALTER TABLE quiz_attempts ADD COLUMN score_raw INTEGER;
        RAISE NOTICE 'Added score_raw column to quiz_attempts table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quiz_attempts' AND column_name = 'attempt_number'
    ) THEN
        ALTER TABLE quiz_attempts ADD COLUMN attempt_number INTEGER DEFAULT 1;
        RAISE NOTICE 'Added attempt_number column to quiz_attempts table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quiz_attempts' AND column_name = 'started_at'
    ) THEN
        ALTER TABLE quiz_attempts ADD COLUMN started_at TIMESTAMPTZ;
        RAISE NOTICE 'Added started_at column to quiz_attempts table';
    END IF;

    RAISE NOTICE 'Fixed API issues: added missing fields to tables';

END $$;