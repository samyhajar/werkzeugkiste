-- Populate enhanced_quizzes table with existing quiz data
-- This migration moves existing quizzes from the old quizzes table to the new enhanced_quizzes table

-- First, let's see what quizzes we have
DO $$
DECLARE
    quiz_record RECORD;
    new_quiz_id UUID;
    course_id UUID;
    lesson_id UUID;
BEGIN
    -- Loop through existing quizzes and migrate them to enhanced_quizzes
    FOR quiz_record IN
                SELECT
            q.id,
            q.title,
            q.pass_pct,
            q.created_at,
            q.updated_at,
            q.course_id,
            q.lesson_id
        FROM quizzes q
    LOOP
        -- Generate new UUID for enhanced_quizzes
        new_quiz_id := gen_random_uuid();

        -- Determine scope based on course_id and lesson_id
        IF quiz_record.lesson_id IS NOT NULL THEN
            -- This is a lesson quiz
            INSERT INTO enhanced_quizzes (
                id,
                title,
                description,
                pass_percent,
                max_points,
                feedback_mode,
                scope,
                course_id,
                lesson_id,
                sort_order,
                created_at,
                updated_at
            ) VALUES (
                new_quiz_id,
                quiz_record.title,
                NULL, -- description (not available in old table)
                COALESCE(quiz_record.pass_pct, 80),
                0, -- max_points default
                'at_end'::quiz_feedback_mode,
                'lesson'::quiz_scope,
                quiz_record.course_id,
                quiz_record.lesson_id,
                0, -- sort_order default
                quiz_record.created_at,
                quiz_record.updated_at
            );
        ELSE
            -- This is a course quiz
            INSERT INTO enhanced_quizzes (
                id,
                title,
                description,
                pass_percent,
                max_points,
                feedback_mode,
                scope,
                course_id,
                lesson_id,
                sort_order,
                created_at,
                updated_at
            ) VALUES (
                new_quiz_id,
                quiz_record.title,
                NULL, -- description (not available in old table)
                COALESCE(quiz_record.pass_pct, 80),
                0, -- max_points default
                'at_end'::quiz_feedback_mode,
                'course'::quiz_scope,
                quiz_record.course_id,
                NULL,
                0, -- sort_order default
                quiz_record.created_at,
                quiz_record.updated_at
            );
        END IF;

        RAISE NOTICE 'Migrated quiz: % -> %', quiz_record.title, new_quiz_id;
    END LOOP;

    RAISE NOTICE 'Migration complete: All quizzes moved to enhanced_quizzes table';
END $$;

-- Now migrate the questions and answers
DO $$
DECLARE
    question_record RECORD;
    answer_record RECORD;
    new_question_id UUID;
    new_answer_id UUID;
    enhanced_quiz_id UUID;
    enhanced_question_id UUID;
BEGIN
    -- Migrate questions from questions table to quiz_questions
    FOR question_record IN
                SELECT
            q.id,
            q.quiz_id,
            q.question,
            q.type,
            q.created_at,
            q.updated_at
        FROM questions q
    LOOP
        -- Find the corresponding enhanced quiz
        SELECT eq.id INTO enhanced_quiz_id
        FROM enhanced_quizzes eq
        JOIN quizzes old_quiz ON old_quiz.title = eq.title
        WHERE old_quiz.id = question_record.quiz_id;

        IF enhanced_quiz_id IS NOT NULL THEN
            -- Generate new UUID for quiz_questions
            new_question_id := gen_random_uuid();

            INSERT INTO quiz_questions (
                id,
                quiz_id,
                type,
                question_html,
                explanation_html,
                points,
                sort_order
            ) VALUES (
                new_question_id,
                enhanced_quiz_id,
                CASE question_record.type
                    WHEN 'single' THEN 'single'::question_type
                    WHEN 'multiple' THEN 'multiple'::question_type
                    ELSE 'single'::question_type
                END,
                question_record.question,
                NULL, -- explanation not available in old table
                1, -- default points
                0 -- default sort_order
            );

                        -- Migrate options for this question
            FOR answer_record IN
                SELECT
                    o.id,
                    o.question_id,
                    o.option_text,
                    o.is_correct,
                    o.created_at,
                    o.updated_at
                FROM options o
                WHERE o.question_id = question_record.id
            LOOP
                -- Generate new UUID for quiz_answers
                new_answer_id := gen_random_uuid();

                INSERT INTO quiz_answers (
                    id,
                    question_id,
                    answer_html,
                    is_correct,
                    sort_order
                ) VALUES (
                    new_answer_id,
                    new_question_id,
                    answer_record.option_text,
                    COALESCE(answer_record.is_correct, FALSE),
                    0 -- default sort_order
                );
            END LOOP;

            RAISE NOTICE 'Migrated question: % -> %', question_record.question, new_question_id;
        END IF;
    END LOOP;

    RAISE NOTICE 'Migration complete: All questions and answers moved to new tables';
END $$;

-- Verify the migration
SELECT
    'enhanced_quizzes' as table_name,
    COUNT(*) as record_count
FROM enhanced_quizzes
UNION ALL
SELECT
    'quiz_questions' as table_name,
    COUNT(*) as record_count
FROM quiz_questions
UNION ALL
SELECT
    'quiz_answers' as table_name,
    COUNT(*) as record_count
FROM quiz_answers;