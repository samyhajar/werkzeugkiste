-- Quiz Data Transformation Functions
-- Helper functions and procedures for transforming WordPress/LearnDash quiz data
-- into the new enhanced quiz schema

-- Function to determine quiz scope based on course_id and lesson_id
CREATE OR REPLACE FUNCTION determine_quiz_scope(
  course_id_text TEXT,
  lesson_id_text TEXT
)
RETURNS quiz_scope AS $$
BEGIN
  IF lesson_id_text IS NOT NULL AND lesson_id_text != '' THEN
    RETURN 'lesson';
  ELSE
    RETURN 'course';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to normalize question types from LearnDash to our enum
CREATE OR REPLACE FUNCTION normalize_question_type(ld_type TEXT)
RETURNS question_type AS $$
BEGIN
  CASE LOWER(ld_type)
    WHEN 'single', 'single_choice', 'sfwd-question_single' THEN
      RETURN 'single';
    WHEN 'multiple', 'multiple_choice', 'sfwd-question_multiple' THEN
      RETURN 'multiple';
    WHEN 'true_false', 'truefalse', 'sfwd-question_true_false' THEN
      RETURN 'true_false';
    WHEN 'free_text', 'freetext', 'sfwd-question_free_text' THEN
      RETURN 'free_text';
    WHEN 'fill_blank', 'fillblank', 'sfwd-question_fill_blank' THEN
      RETURN 'fill_blank';
    WHEN 'sorting', 'sfwd-question_sorting' THEN
      RETURN 'sorting';
    WHEN 'matching', 'sfwd-question_matching' THEN
      RETURN 'matching';
    WHEN 'matrix', 'sfwd-question_matrix' THEN
      RETURN 'matrix';
    ELSE
      RETURN 'single'; -- Default fallback
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to transform raw quiz data into enhanced_quizzes
CREATE OR REPLACE FUNCTION transform_raw_quizzes()
RETURNS INTEGER AS $$
DECLARE
  transformed_count INTEGER := 0;
  quiz_record RECORD;
  mapped_course_id UUID;
  mapped_lesson_id UUID;
BEGIN
  FOR quiz_record IN
    SELECT * FROM wp_quizzes_raw
  LOOP
    -- Map legacy IDs to new UUIDs (you'll need to implement this mapping)
    -- For now, we'll use NULL and you can update these after import
    mapped_course_id := NULL;
    mapped_lesson_id := NULL;

    -- Insert into enhanced_quizzes
    INSERT INTO enhanced_quizzes (
      legacy_id,
      scope,
      course_id,
      lesson_id,
      title,
      description,
      pass_percent,
      max_points,
      feedback_mode,
      sort_order,
      settings
    ) VALUES (
      quiz_record.id,
      determine_quiz_scope(quiz_record.course_id, quiz_record.lesson_id),
      mapped_course_id,
      mapped_lesson_id,
      quiz_record.title,
      quiz_record.description,
      COALESCE(quiz_record.pass_percent, 0),
      COALESCE(quiz_record.max_points, 0),
      CASE quiz_record.feedback_mode
        WHEN 'per_question' THEN 'per_question'
        WHEN 'at_end' THEN 'at_end'
        ELSE 'none'
      END::quiz_feedback_mode,
      COALESCE(quiz_record.sort_order, 0),
      COALESCE(quiz_record.settings, '{}'::jsonb)
    );

    transformed_count := transformed_count + 1;
  END LOOP;

  RETURN transformed_count;
END;
$$ LANGUAGE plpgsql;

-- Function to transform raw question data into quiz_questions
CREATE OR REPLACE FUNCTION transform_raw_questions()
RETURNS INTEGER AS $$
DECLARE
  transformed_count INTEGER := 0;
  question_record RECORD;
  mapped_quiz_id UUID;
BEGIN
  FOR question_record IN
    SELECT * FROM wp_questions_raw
  LOOP
    -- Get the mapped quiz_id from enhanced_quizzes
    SELECT id INTO mapped_quiz_id
    FROM enhanced_quizzes
    WHERE legacy_id = question_record.quiz_id;

    IF mapped_quiz_id IS NOT NULL THEN
      INSERT INTO quiz_questions (
        legacy_id,
        quiz_id,
        type,
        question_html,
        explanation_html,
        points,
        category,
        sort_order,
        meta
      ) VALUES (
        question_record.id,
        mapped_quiz_id,
        normalize_question_type(question_record.type),
        question_record.question_html,
        question_record.explanation_html,
        COALESCE(question_record.points, 1),
        question_record.category,
        COALESCE(question_record.sort_order, 0),
        COALESCE(question_record.meta, '{}'::jsonb)
      );

      transformed_count := transformed_count + 1;
    END IF;
  END LOOP;

  RETURN transformed_count;
END;
$$ LANGUAGE plpgsql;

-- Function to transform raw answer data into quiz_answers
CREATE OR REPLACE FUNCTION transform_raw_answers()
RETURNS INTEGER AS $$
DECLARE
  transformed_count INTEGER := 0;
  answer_record RECORD;
  mapped_question_id UUID;
BEGIN
  FOR answer_record IN
    SELECT * FROM wp_answers_raw
  LOOP
    -- Get the mapped question_id from quiz_questions
    SELECT id INTO mapped_question_id
    FROM quiz_questions
    WHERE legacy_id = answer_record.question_id;

    IF mapped_question_id IS NOT NULL THEN
      INSERT INTO quiz_answers (
        legacy_id,
        question_id,
        answer_html,
        is_correct,
        feedback_html,
        sort_order,
        value_numeric,
        value_text,
        meta
      ) VALUES (
        answer_record.id,
        mapped_question_id,
        answer_record.answer_html,
        COALESCE(answer_record.is_correct, FALSE),
        answer_record.feedback_html,
        COALESCE(answer_record.sort_order, 0),
        answer_record.value_numeric,
        answer_record.value_text,
        COALESCE(answer_record.meta, '{}'::jsonb)
      );

      transformed_count := transformed_count + 1;
    END IF;
  END LOOP;

  RETURN transformed_count;
END;
$$ LANGUAGE plpgsql;

-- Procedure to run the complete transformation
CREATE OR REPLACE PROCEDURE transform_all_quiz_data()
LANGUAGE plpgsql
AS $$
DECLARE
  quizzes_transformed INTEGER;
  questions_transformed INTEGER;
  answers_transformed INTEGER;
BEGIN
  -- Transform quizzes first
  SELECT transform_raw_quizzes() INTO quizzes_transformed;
  RAISE NOTICE 'Transformed % quizzes', quizzes_transformed;

  -- Transform questions
  SELECT transform_raw_questions() INTO questions_transformed;
  RAISE NOTICE 'Transformed % questions', questions_transformed;

  -- Transform answers
  SELECT transform_raw_answers() INTO answers_transformed;
  RAISE NOTICE 'Transformed % answers', answers_transformed;

  RAISE NOTICE 'Transformation complete: % quizzes, % questions, % answers',
    quizzes_transformed, questions_transformed, answers_transformed;
END;
$$;

-- Function to validate quiz data integrity
CREATE OR REPLACE FUNCTION validate_quiz_integrity()
RETURNS TABLE(
  quiz_id UUID,
  quiz_title TEXT,
  question_count INTEGER,
  answer_count INTEGER,
  has_correct_answers BOOLEAN,
  issues TEXT[]
) AS $$
DECLARE
  quiz_record RECORD;
  issues TEXT[];
BEGIN
  FOR quiz_record IN
    SELECT
      eq.id,
      eq.title,
      COUNT(DISTINCT qq.id) as question_count,
      COUNT(DISTINCT qa.id) as answer_count
    FROM enhanced_quizzes eq
    LEFT JOIN quiz_questions qq ON qq.quiz_id = eq.id
    LEFT JOIN quiz_answers qa ON qa.question_id = qq.id
    GROUP BY eq.id, eq.title
  LOOP
    issues := ARRAY[]::TEXT[];

    -- Check for questions without answers (except free_text)
    IF quiz_record.question_count > 0 AND quiz_record.answer_count = 0 THEN
      issues := array_append(issues, 'Questions without answers');
    END IF;

    -- Check for questions without correct answers (except free_text)
    IF quiz_record.question_count > 0 THEN
      IF NOT EXISTS (
        SELECT 1 FROM quiz_questions qq2
        JOIN quiz_answers qa2 ON qa2.question_id = qq2.id
        WHERE qq2.quiz_id = quiz_record.quiz_id
        AND qa2.is_correct = TRUE
        AND qq2.type != 'free_text'
      ) THEN
        issues := array_append(issues, 'No correct answers found');
      END IF;
    END IF;

    RETURN QUERY SELECT
      quiz_record.quiz_id,
      quiz_record.quiz_title,
      quiz_record.question_count,
      quiz_record.answer_count,
      (array_length(issues, 1) = 0),
      issues;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create a mapping table for legacy IDs
CREATE OR REPLACE FUNCTION create_legacy_mapping()
RETURNS VOID AS $$
BEGIN
  -- Create mapping table for courses
  CREATE TABLE IF NOT EXISTS legacy_course_mapping (
    legacy_id TEXT PRIMARY KEY,
    new_id UUID REFERENCES courses(id),
    mapped_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Create mapping table for lessons
  CREATE TABLE IF NOT EXISTS legacy_lesson_mapping (
    legacy_id TEXT PRIMARY KEY,
    new_id UUID REFERENCES lessons(id),
    mapped_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Create mapping table for quizzes
  CREATE TABLE IF NOT EXISTS legacy_quiz_mapping (
    legacy_id TEXT PRIMARY KEY,
    new_id UUID REFERENCES enhanced_quizzes(id),
    mapped_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Create mapping table for questions
  CREATE TABLE IF NOT EXISTS legacy_question_mapping (
    legacy_id TEXT PRIMARY KEY,
    new_id UUID REFERENCES quiz_questions(id),
    mapped_at TIMESTAMPTZ DEFAULT NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update quiz references after mapping
CREATE OR REPLACE FUNCTION update_quiz_references()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  mapping_record RECORD;
BEGIN
  -- Update course_id references in enhanced_quizzes
  FOR mapping_record IN
    SELECT lcm.legacy_id, lcm.new_id
    FROM legacy_course_mapping lcm
    JOIN enhanced_quizzes eq ON eq.legacy_id LIKE '%' || lcm.legacy_id || '%'
  LOOP
    UPDATE enhanced_quizzes
    SET course_id = mapping_record.new_id
    WHERE legacy_id LIKE '%' || mapping_record.legacy_id || '%'
    AND course_id IS NULL;

    updated_count := updated_count + 1;
  END LOOP;

  -- Update lesson_id references in enhanced_quizzes
  FOR mapping_record IN
    SELECT llm.legacy_id, llm.new_id
    FROM legacy_lesson_mapping llm
    JOIN enhanced_quizzes eq ON eq.legacy_id LIKE '%' || llm.legacy_id || '%'
  LOOP
    UPDATE enhanced_quizzes
    SET lesson_id = mapping_record.new_id
    WHERE legacy_id LIKE '%' || mapping_record.legacy_id || '%'
    AND lesson_id IS NULL;

    updated_count := updated_count + 1;
  END LOOP;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON FUNCTION determine_quiz_scope IS 'Determine if a quiz is course or lesson scoped based on available IDs';
COMMENT ON FUNCTION normalize_question_type IS 'Convert LearnDash question types to our standardized enum values';
COMMENT ON FUNCTION transform_raw_quizzes IS 'Transform raw quiz data from staging table to enhanced_quizzes';
COMMENT ON FUNCTION transform_raw_questions IS 'Transform raw question data from staging table to quiz_questions';
COMMENT ON FUNCTION transform_raw_answers IS 'Transform raw answer data from staging table to quiz_answers';
COMMENT ON PROCEDURE transform_all_quiz_data IS 'Run complete transformation of all quiz data from staging tables';
COMMENT ON FUNCTION validate_quiz_integrity IS 'Validate quiz data integrity and return issues found';
COMMENT ON FUNCTION create_legacy_mapping IS 'Create mapping tables for legacy ID tracking';
COMMENT ON FUNCTION update_quiz_references IS 'Update quiz references after legacy ID mapping';