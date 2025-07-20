-- Add sample lesson progress data for testing
DO $$
DECLARE
    student_user_id UUID;
    lesson_ids UUID[];
    current_lesson_id UUID;
    i INTEGER := 0;
BEGIN
    -- Get the first student user
    SELECT id INTO student_user_id FROM profiles WHERE role = 'student' LIMIT 1;

    -- Only proceed if we have a student
    IF student_user_id IS NOT NULL THEN
        -- Get some lesson IDs
        SELECT ARRAY(SELECT id FROM lessons ORDER BY created_at LIMIT 8) INTO lesson_ids;

        -- Add progress for some lessons (simulate partial completion)
        FOREACH current_lesson_id IN ARRAY lesson_ids
        LOOP
            i := i + 1;
            -- Only add progress for first 5 lessons (partial completion)
            IF i <= 5 THEN
                INSERT INTO lesson_progress (student_id, lesson_id, completed_at)
                VALUES (
                    student_user_id,
                    current_lesson_id,
                    NOW() - (i || ' days')::INTERVAL
                )
                ON CONFLICT (student_id, lesson_id) DO NOTHING;
            END IF;
        END LOOP;

        RAISE NOTICE 'Added sample progress for student % (% lessons completed)', student_user_id, i;
    ELSE
        RAISE NOTICE 'No student users found, skipping progress creation';
    END IF;
END $$;