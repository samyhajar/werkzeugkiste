CREATE OR REPLACE FUNCTION check_module_completion(
    p_student_id UUID,
    p_module_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    total_lessons INT;
    completed_lessons INT;
    total_quizzes INT;
    passed_quizzes INT;
BEGIN
    -- Get the total number of lessons in the module
    SELECT COUNT(*)
    INTO total_lessons
    FROM lessons l
    JOIN courses c ON l.course_id = c.id
    WHERE c.module_id = p_module_id;

    -- Get the number of completed lessons for the student in the module
    SELECT COUNT(*)
    INTO completed_lessons
    FROM lesson_progress lp
    JOIN lessons l ON lp.lesson_id = l.id
    JOIN courses c ON l.course_id = c.id
    WHERE lp.student_id = p_student_id
    AND c.module_id = p_module_id;

    -- Get the total number of quizzes in the module
    SELECT COUNT(*)
    INTO total_quizzes
    FROM quizzes q
    JOIN courses c ON q.course_id = c.id
    WHERE c.module_id = p_module_id;

    -- Get the number of passed quizzes for the student in the module
    SELECT COUNT(DISTINCT q.id)
    INTO passed_quizzes
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    JOIN courses c ON q.course_id = c.id
    WHERE qa.student_id = p_student_id
    AND c.module_id = p_module_id
    AND qa.passed = TRUE;

    -- Check if all lessons are completed and all quizzes are passed
    RETURN total_lessons = completed_lessons AND total_quizzes = passed_quizzes;
END;
$$ LANGUAGE plpgsql;