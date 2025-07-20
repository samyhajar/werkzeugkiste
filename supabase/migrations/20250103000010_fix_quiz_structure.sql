-- Add course_id column to quizzes table and fix quiz structure
DO $$
DECLARE
    module_id UUID;
    quiz_id UUID;
    question_id UUID;
BEGIN
    -- Add course_id column to quizzes table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quizzes' AND column_name = 'course_id'
    ) THEN
        ALTER TABLE quizzes ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
    END IF;

    -- Get the German module ID
    SELECT id INTO module_id FROM courses WHERE title = 'Modul 1: Einstieg in die digitale Welt' LIMIT 1;

    IF module_id IS NOT NULL THEN
        -- Update existing quizzes to have course_id
        UPDATE quizzes SET course_id = module_id WHERE course_id IS NULL;

        -- Clear existing quizzes for this course to avoid duplicates
        DELETE FROM quizzes WHERE course_id = module_id;

        -- Add the correct quizzes as course-level (not lesson-specific)
        INSERT INTO quizzes (id, title, course_id, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Quiz 1: Elektronische Geräte', module_id, NOW(), NOW()),
        (gen_random_uuid(), 'Quiz 2: Hardware & Software', module_id, NOW(), NOW());

        -- Add questions for Quiz 1: Elektronische Geräte
        SELECT id INTO quiz_id FROM quizzes WHERE title = 'Quiz 1: Elektronische Geräte' AND course_id = module_id LIMIT 1;
        IF quiz_id IS NOT NULL THEN
            INSERT INTO questions (id, quiz_id, question, type, created_at, updated_at) VALUES
            (gen_random_uuid(), quiz_id, 'Was ist ein Smartphone?', 'single', NOW(), NOW())
            RETURNING id INTO question_id;

            INSERT INTO options (question_id, option_text, is_correct) VALUES
            (question_id, 'Ein kleiner Computer mit Telefonfunktion', true),
            (question_id, 'Nur ein Telefon', false),
            (question_id, 'Ein großer Bildschirm', false);
        END IF;

        -- Add questions for Quiz 2: Hardware & Software
        SELECT id INTO quiz_id FROM quizzes WHERE title = 'Quiz 2: Hardware & Software' AND course_id = module_id LIMIT 1;
        IF quiz_id IS NOT NULL THEN
            INSERT INTO questions (id, quiz_id, question, type, created_at, updated_at) VALUES
            (gen_random_uuid(), quiz_id, 'Was ist Hardware?', 'single', NOW(), NOW())
            RETURNING id INTO question_id;

            INSERT INTO options (question_id, option_text, is_correct) VALUES
            (question_id, 'Alles was man anfassen kann', true),
            (question_id, 'Nur Programme', false),
            (question_id, 'Das Internet', false);
        END IF;

        RAISE NOTICE 'Fixed quiz structure and added course_id column for German Digital Module';
    ELSE
        RAISE NOTICE 'German Digital Module not found';
    END IF;
END $$;