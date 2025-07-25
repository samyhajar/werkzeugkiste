-- Add sample quiz answers for testing multiple choice display
-- This migration adds sample answers to questions that currently have no answers

DO $$
DECLARE
    question_record RECORD;
    answer_count INTEGER;
BEGIN
    -- Find questions that have no answers
    FOR question_record IN
        SELECT q.id, q.question_html, q.type
        FROM quiz_questions q
        LEFT JOIN quiz_answers qa ON qa.question_id = q.id
        WHERE qa.id IS NULL
        AND q.type IN ('single', 'multiple')
    LOOP
        -- Add sample answers based on question type
        IF question_record.type = 'multiple' THEN
            -- Add 4 sample answers for multiple choice questions
            INSERT INTO quiz_answers (question_id, answer_html, is_correct, sort_order) VALUES
            (question_record.id, 'Erste richtige Antwort', TRUE, 1),
            (question_record.id, 'Zweite richtige Antwort', TRUE, 2),
            (question_record.id, 'Falsche Antwort 1', FALSE, 3),
            (question_record.id, 'Falsche Antwort 2', FALSE, 4);

            RAISE NOTICE 'Added 4 sample answers for multiple choice question: %', question_record.question_html;

        ELSIF question_record.type = 'single' THEN
            -- Add 3 sample answers for single choice questions
            INSERT INTO quiz_answers (question_id, answer_html, is_correct, sort_order) VALUES
            (question_record.id, 'Richtige Antwort', TRUE, 1),
            (question_record.id, 'Falsche Antwort 1', FALSE, 2),
            (question_record.id, 'Falsche Antwort 2', FALSE, 3);

            RAISE NOTICE 'Added 3 sample answers for single choice question: %', question_record.question_html;
        END IF;
    END LOOP;

    -- Display summary
    SELECT COUNT(*) INTO answer_count FROM quiz_answers;
    RAISE NOTICE 'Migration complete. Total quiz answers in database: %', answer_count;
END $$;