-- Create a sample multiple choice quiz with proper questions and answers
-- This will replace the test data with a real quiz

DO $$
DECLARE
    quiz_id UUID;
    question1_id UUID;
    question2_id UUID;
    question3_id UUID;
    lesson_id UUID;
BEGIN
    -- Get a lesson ID to associate the quiz with
    SELECT id INTO lesson_id FROM lessons LIMIT 1;

    -- Create the quiz
    INSERT INTO enhanced_quizzes (
        title,
        description,
        scope,
        lesson_id,
        pass_percent,
        max_points,
        feedback_mode,
        sort_order
    ) VALUES (
        'Digital Basics Quiz',
        'Test your knowledge of digital technology basics',
        'lesson',
        lesson_id,
        70,
        100,
        'at_end',
        1
    ) RETURNING id INTO quiz_id;

    -- Question 1: Multiple choice about smartphones
    INSERT INTO quiz_questions (
        quiz_id,
        type,
        question_html,
        explanation_html,
        points,
        sort_order
    ) VALUES (
        quiz_id,
        'multiple',
        'Which of the following are features commonly found in modern smartphones? (Select all that apply)',
        'Modern smartphones typically include GPS navigation, internet connectivity, camera functionality, and touchscreen interfaces.',
        25,
        1
    ) RETURNING id INTO question1_id;

    -- Answers for Question 1
    INSERT INTO quiz_answers (question_id, answer_html, is_correct, sort_order) VALUES
    (question1_id, 'GPS Navigation', TRUE, 1),
    (question1_id, 'Internet Connectivity', TRUE, 2),
    (question1_id, 'Physical Keyboard Only', FALSE, 3),
    (question1_id, 'Camera', TRUE, 4),
    (question1_id, 'Floppy Disk Drive', FALSE, 5);

    -- Question 2: Single choice about email
    INSERT INTO quiz_questions (
        quiz_id,
        type,
        question_html,
        explanation_html,
        points,
        sort_order
    ) VALUES (
        quiz_id,
        'single',
        'What does the "@" symbol in an email address represent?',
        'The "@" symbol separates the username from the domain name in an email address.',
        25,
        2
    ) RETURNING id INTO question2_id;

    -- Answers for Question 2
    INSERT INTO quiz_answers (question_id, answer_html, is_correct, sort_order) VALUES
    (question2_id, 'It separates the username from the domain', TRUE, 1),
    (question2_id, 'It indicates the email is urgent', FALSE, 2),
    (question2_id, 'It shows the email size', FALSE, 3),
    (question2_id, 'It represents the sender location', FALSE, 4);

    -- Question 3: Multiple choice about computer security
    INSERT INTO quiz_questions (
        quiz_id,
        type,
        question_html,
        explanation_html,
        points,
        sort_order
    ) VALUES (
        quiz_id,
        'multiple',
        'Which of these are good practices for creating secure passwords? (Select all that apply)',
        'Secure passwords should be long, contain a mix of characters, be unique for each account, and not contain personal information.',
        25,
        3
    ) RETURNING id INTO question3_id;

    -- Answers for Question 3
    INSERT INTO quiz_answers (question_id, answer_html, is_correct, sort_order) VALUES
    (question3_id, 'Use a mix of uppercase and lowercase letters', TRUE, 1),
    (question3_id, 'Include numbers and special characters', TRUE, 2),
    (question3_id, 'Use your birthday as the password', FALSE, 3),
    (question3_id, 'Make it at least 8 characters long', TRUE, 4),
    (question3_id, 'Use the same password for all accounts', FALSE, 5),
    (question3_id, 'Use a unique password for each account', TRUE, 6);

    RAISE NOTICE 'Created quiz "Digital Basics Quiz" with ID: %', quiz_id;
    RAISE NOTICE 'Added 3 questions with proper multiple choice answers';

END $$;