-- Fix cascade deletion for modules
-- This migration ensures that when a module is deleted, all related data is properly cascaded

-- First, let's check and fix any missing CASCADE constraints
DO $$
DECLARE
    constraint_exists BOOLEAN;
    delete_rule_value TEXT;
BEGIN
    -- Check if enhanced_quizzes has proper CASCADE constraints
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.constraint_name = 'enhanced_quizzes_course_id_fkey'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        SELECT delete_rule INTO delete_rule_value
        FROM information_schema.referential_constraints
        WHERE constraint_name = 'enhanced_quizzes_course_id_fkey';

        IF delete_rule_value != 'CASCADE' THEN
            ALTER TABLE enhanced_quizzes DROP CONSTRAINT enhanced_quizzes_course_id_fkey;
            ALTER TABLE enhanced_quizzes ADD CONSTRAINT enhanced_quizzes_course_id_fkey
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Check if enhanced_quizzes has proper CASCADE constraints for lesson_id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.constraint_name = 'enhanced_quizzes_lesson_id_fkey'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        SELECT delete_rule INTO delete_rule_value
        FROM information_schema.referential_constraints
        WHERE constraint_name = 'enhanced_quizzes_lesson_id_fkey';

        IF delete_rule_value != 'CASCADE' THEN
            ALTER TABLE enhanced_quizzes DROP CONSTRAINT enhanced_quizzes_lesson_id_fkey;
            ALTER TABLE enhanced_quizzes ADD CONSTRAINT enhanced_quizzes_lesson_id_fkey
                FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Check if quiz_questions has proper CASCADE constraints
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.constraint_name = 'quiz_questions_quiz_id_fkey'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        SELECT delete_rule INTO delete_rule_value
        FROM information_schema.referential_constraints
        WHERE constraint_name = 'quiz_questions_quiz_id_fkey';

        IF delete_rule_value != 'CASCADE' THEN
            ALTER TABLE quiz_questions DROP CONSTRAINT quiz_questions_quiz_id_fkey;
            ALTER TABLE quiz_questions ADD CONSTRAINT quiz_questions_quiz_id_fkey
                FOREIGN KEY (quiz_id) REFERENCES enhanced_quizzes(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Check if quiz_answers has proper CASCADE constraints
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.constraint_name = 'quiz_answers_question_id_fkey'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        SELECT delete_rule INTO delete_rule_value
        FROM information_schema.referential_constraints
        WHERE constraint_name = 'quiz_answers_question_id_fkey';

        IF delete_rule_value != 'CASCADE' THEN
            ALTER TABLE quiz_answers DROP CONSTRAINT quiz_answers_question_id_fkey;
            ALTER TABLE quiz_answers ADD CONSTRAINT quiz_answers_question_id_fkey
                FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Check if enhanced_quiz_attempts has proper CASCADE constraints
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.constraint_name = 'enhanced_quiz_attempts_quiz_id_fkey'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        SELECT delete_rule INTO delete_rule_value
        FROM information_schema.referential_constraints
        WHERE constraint_name = 'enhanced_quiz_attempts_quiz_id_fkey';

        IF delete_rule_value != 'CASCADE' THEN
            ALTER TABLE enhanced_quiz_attempts DROP CONSTRAINT enhanced_quiz_attempts_quiz_id_fkey;
            ALTER TABLE enhanced_quiz_attempts ADD CONSTRAINT enhanced_quiz_attempts_quiz_id_fkey
                FOREIGN KEY (quiz_id) REFERENCES enhanced_quizzes(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Check if lesson_progress has proper CASCADE constraints
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.constraint_name = 'lesson_progress_lesson_id_fkey'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        SELECT delete_rule INTO delete_rule_value
        FROM information_schema.referential_constraints
        WHERE constraint_name = 'lesson_progress_lesson_id_fkey';

        IF delete_rule_value != 'CASCADE' THEN
            ALTER TABLE lesson_progress DROP CONSTRAINT lesson_progress_lesson_id_fkey;
            ALTER TABLE lesson_progress ADD CONSTRAINT lesson_progress_lesson_id_fkey
                FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Check if certificates has proper CASCADE constraints
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.constraint_name = 'certificates_module_id_fkey'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        SELECT delete_rule INTO delete_rule_value
        FROM information_schema.referential_constraints
        WHERE constraint_name = 'certificates_module_id_fkey';

        IF delete_rule_value != 'CASCADE' THEN
            ALTER TABLE certificates DROP CONSTRAINT certificates_module_id_fkey;
            ALTER TABLE certificates ADD CONSTRAINT certificates_module_id_fkey
                FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Check if rewards has proper CASCADE constraints for source_id (this is more complex)
    -- We'll need to handle this differently since rewards can reference different types of content

    RAISE NOTICE 'Cascade deletion constraints have been updated';
END $$;

-- Create a function to safely delete a module with all its related data
CREATE OR REPLACE FUNCTION delete_module_with_cascade(module_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN := TRUE;
BEGIN
    -- Start a transaction
    BEGIN
        -- Delete rewards that reference lessons or quizzes in this module
        DELETE FROM rewards
        WHERE source_type IN ('lesson', 'quiz')
        AND source_id IN (
            SELECT l.id FROM lessons l
            JOIN courses c ON l.course_id = c.id
            WHERE c.module_id = delete_module_with_cascade.module_id
            UNION
            SELECT eq.id FROM enhanced_quizzes eq
            JOIN courses c ON eq.course_id = c.id
            WHERE c.module_id = delete_module_with_cascade.module_id
        );

        -- Delete the module (this will cascade to courses, lessons, quizzes, etc.)
        DELETE FROM modules WHERE id = delete_module_with_cascade.module_id;

        success := TRUE;
    EXCEPTION
        WHEN OTHERS THEN
            success := FALSE;
            RAISE;
    END;

    RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_module_with_cascade(UUID) TO authenticated;

-- Create a policy to allow admins to execute this function
CREATE POLICY "Admins can delete modules with cascade" ON modules
    FOR DELETE USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );