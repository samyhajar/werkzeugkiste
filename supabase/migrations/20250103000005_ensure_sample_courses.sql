-- Ensure sample courses are properly inserted
-- First, let's check if courses exist and insert them if they don't

DO $$
DECLARE
    admin_user_id UUID;
    course_count INTEGER;
BEGIN
    -- Get the first admin user (or create one if needed)
    SELECT id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;

    -- If no admin user exists, we'll use NULL for admin_id
    IF admin_user_id IS NULL THEN
        admin_user_id := NULL;
    END IF;

    -- Check how many courses exist
    SELECT COUNT(*) INTO course_count FROM courses;

    -- Only insert if no courses exist
    IF course_count = 0 THEN
        INSERT INTO courses (id, title, description, status, admin_id, created_at, updated_at) VALUES
        (
            gen_random_uuid(),
            'SEO Mastery',
            'Complete guide to Search Engine Optimization',
            'published',
            admin_user_id,
            NOW(),
            NOW()
        ),
        (
            gen_random_uuid(),
            'Social Media Marketing',
            'Learn to market effectively on social platforms',
            'published',
            admin_user_id,
            NOW(),
            NOW()
        ),
        (
            gen_random_uuid(),
            'HTML & CSS Basics',
            'Build your first website with HTML and CSS',
            'published',
            admin_user_id,
            NOW(),
            NOW()
        ),
        (
            gen_random_uuid(),
            'JavaScript Fundamentals',
            'Learn programming with JavaScript',
            'published',
            admin_user_id,
            NOW(),
            NOW()
        );

        RAISE NOTICE 'Inserted % sample courses', 4;
    ELSE
        RAISE NOTICE 'Courses already exist (count: %), skipping insertion', course_count;
    END IF;
END $$;