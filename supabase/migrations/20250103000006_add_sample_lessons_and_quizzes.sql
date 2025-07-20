-- Add sample lessons and quizzes for the courses
DO $$
DECLARE
    seo_course_id UUID;
    social_course_id UUID;
    html_course_id UUID;
    js_course_id UUID;
    admin_user_id UUID;
    lesson_id UUID;
BEGIN
    -- Get the first admin user
    SELECT id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;

    -- Get course IDs
    SELECT id INTO seo_course_id FROM courses WHERE title = 'SEO Mastery' LIMIT 1;
    SELECT id INTO social_course_id FROM courses WHERE title = 'Social Media Marketing' LIMIT 1;
    SELECT id INTO html_course_id FROM courses WHERE title = 'HTML & CSS Basics' LIMIT 1;
    SELECT id INTO js_course_id FROM courses WHERE title = 'JavaScript Fundamentals' LIMIT 1;

    -- Only proceed if we have courses
    IF seo_course_id IS NOT NULL THEN
        -- SEO Mastery lessons
        INSERT INTO lessons (id, title, content, course_id, sort_order, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Introduction to SEO', 'Learn the basics of Search Engine Optimization and why it matters for your website.', seo_course_id, 1, NOW(), NOW()),
        (gen_random_uuid(), 'Keyword Research', 'Master the art of finding the right keywords for your content strategy.', seo_course_id, 2, NOW(), NOW()),
        (gen_random_uuid(), 'On-Page Optimization', 'Optimize your web pages for better search engine rankings.', seo_course_id, 3, NOW(), NOW());

        -- Social Media Marketing lessons
        INSERT INTO lessons (id, title, content, course_id, sort_order, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Social Media Strategy', 'Create a winning social media strategy for your brand.', social_course_id, 1, NOW(), NOW()),
        (gen_random_uuid(), 'Content Creation', 'Learn how to create engaging content that drives engagement.', social_course_id, 2, NOW(), NOW());

        -- HTML & CSS Basics lessons
        INSERT INTO lessons (id, title, content, course_id, sort_order, created_at, updated_at) VALUES
        (gen_random_uuid(), 'HTML Structure', 'Learn the basic structure of HTML documents.', html_course_id, 1, NOW(), NOW()),
        (gen_random_uuid(), 'CSS Styling', 'Style your HTML with CSS to make beautiful websites.', html_course_id, 2, NOW(), NOW()),
        (gen_random_uuid(), 'Responsive Design', 'Make your websites work on all devices with responsive design.', html_course_id, 3, NOW(), NOW());

        -- JavaScript Fundamentals lessons
        INSERT INTO lessons (id, title, content, course_id, sort_order, created_at, updated_at) VALUES
        (gen_random_uuid(), 'JavaScript Basics', 'Learn variables, functions, and basic JavaScript syntax.', js_course_id, 1, NOW(), NOW()),
        (gen_random_uuid(), 'DOM Manipulation', 'Interact with web pages using JavaScript and the DOM.', js_course_id, 2, NOW(), NOW());

        -- Add some sample quizzes
        -- Get a lesson ID for quiz creation
        SELECT id INTO lesson_id FROM lessons WHERE title = 'Introduction to SEO' LIMIT 1;
        IF lesson_id IS NOT NULL THEN
            INSERT INTO quizzes (id, title, lesson_id, created_at, updated_at) VALUES
            (gen_random_uuid(), 'SEO Basics Quiz', lesson_id, NOW(), NOW());
        END IF;

        SELECT id INTO lesson_id FROM lessons WHERE title = 'HTML Structure' LIMIT 1;
        IF lesson_id IS NOT NULL THEN
            INSERT INTO quizzes (id, title, lesson_id, created_at, updated_at) VALUES
            (gen_random_uuid(), 'HTML Knowledge Check', lesson_id, NOW(), NOW());
        END IF;

        SELECT id INTO lesson_id FROM lessons WHERE title = 'JavaScript Basics' LIMIT 1;
        IF lesson_id IS NOT NULL THEN
            INSERT INTO quizzes (id, title, lesson_id, created_at, updated_at) VALUES
            (gen_random_uuid(), 'JavaScript Fundamentals Quiz', lesson_id, NOW(), NOW());
        END IF;

        RAISE NOTICE 'Added sample lessons and quizzes successfully';
    ELSE
        RAISE NOTICE 'No courses found, skipping lesson creation';
    END IF;
END $$;