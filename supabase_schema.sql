

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."question_type" AS ENUM (
    'single',
    'multiple',
    'true_false',
    'free_text',
    'fill_blank',
    'sorting',
    'matching',
    'matrix'
);


ALTER TYPE "public"."question_type" OWNER TO "postgres";


CREATE TYPE "public"."quiz_feedback_mode" AS ENUM (
    'per_question',
    'at_end',
    'none'
);


ALTER TYPE "public"."quiz_feedback_mode" OWNER TO "postgres";


CREATE TYPE "public"."quiz_scope" AS ENUM (
    'course',
    'lesson'
);


ALTER TYPE "public"."quiz_scope" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."award_lesson_xp"("user_uuid" "uuid", "lesson_uuid" "uuid", "xp_amount" integer DEFAULT 10, "reason" "text" DEFAULT 'Lesson completion'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert reward record
  INSERT INTO rewards (user_id, source_type, source_id, points, note)
  VALUES (user_uuid, 'lesson', lesson_uuid, xp_amount, reason);

  -- Update lesson_progress with XP awarded
  UPDATE lesson_progress
  SET xp_awarded = xp_amount,
      reward_reason = reason
  WHERE student_id = user_uuid AND lesson_id = lesson_uuid;
END;
$$;


ALTER FUNCTION "public"."award_lesson_xp"("user_uuid" "uuid", "lesson_uuid" "uuid", "xp_amount" integer, "reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."award_lesson_xp"("user_uuid" "uuid", "lesson_uuid" "uuid", "xp_amount" integer, "reason" "text") IS 'Award XP for lesson completion and update progress';



CREATE OR REPLACE FUNCTION "public"."award_quiz_xp"("user_uuid" "uuid", "quiz_uuid" "uuid", "xp_amount" integer DEFAULT 5, "reason" "text" DEFAULT 'Quiz completion'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert reward record
  INSERT INTO rewards (user_id, source_type, source_id, points, note)
  VALUES (user_uuid, 'quiz', quiz_uuid, xp_amount, reason);
END;
$$;


ALTER FUNCTION "public"."award_quiz_xp"("user_uuid" "uuid", "quiz_uuid" "uuid", "xp_amount" integer, "reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."award_quiz_xp"("user_uuid" "uuid", "quiz_uuid" "uuid", "xp_amount" integer, "reason" "text") IS 'Award XP for quiz completion';



CREATE OR REPLACE FUNCTION "public"."create_legacy_mapping"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."create_legacy_mapping"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_legacy_mapping"() IS 'Create mapping tables for legacy ID tracking';



CREATE OR REPLACE FUNCTION "public"."create_user_with_profile"("user_email" "text", "user_password" "text", "user_role" "text" DEFAULT 'student'::"text", "confirm_email" boolean DEFAULT true) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_user_id uuid;
    salt TEXT;
    encrypted_password TEXT;
BEGIN
    -- Generate UUID for the user
    new_user_id := uuid_generate_v4();

    -- Generate salt and encrypt password using Supabase's method
    salt := gen_salt('bf', 10);
    encrypted_password := crypt(user_password, salt);

    -- Insert into auth.users with proper structure
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        user_email,
        encrypted_password,
        CASE WHEN confirm_email THEN NOW() ELSE NULL END,
        NULL,
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('full_name', split_part(user_email, '@', 1), 'role', user_role),
        false,
        NOW(),
        NOW(),
        NULL,
        NULL,
        '',
        '',
        NULL,
        '',
        0,
        NULL,
        '',
        NULL,
        false
    );

    -- Create corresponding profile
    INSERT INTO public.profiles (
        id,
        full_name,
        role,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        split_part(user_email, '@', 1),
        user_role,
        NOW(),
        NOW()
    );

    -- Create auth identity record
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        uuid_generate_v4(),
        new_user_id,
        jsonb_build_object('sub', new_user_id::text, 'email', user_email),
        'email',
        NULL,
        NOW(),
        NOW()
    );

    RETURN new_user_id;
END;
$$;


ALTER FUNCTION "public"."create_user_with_profile"("user_email" "text", "user_password" "text", "user_role" "text", "confirm_email" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."determine_quiz_scope"("course_id_text" "text", "lesson_id_text" "text") RETURNS "public"."quiz_scope"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF lesson_id_text IS NOT NULL AND lesson_id_text != '' THEN
    RETURN 'lesson';
  ELSE
    RETURN 'course';
  END IF;
END;
$$;


ALTER FUNCTION "public"."determine_quiz_scope"("course_id_text" "text", "lesson_id_text" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."determine_quiz_scope"("course_id_text" "text", "lesson_id_text" "text") IS 'Determine if a quiz is course or lesson scoped based on available IDs';



CREATE OR REPLACE FUNCTION "public"."get_user_total_xp"("user_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(points)
    FROM rewards
    WHERE user_id = user_uuid
  ), 0);
END;
$$;


ALTER FUNCTION "public"."get_user_total_xp"("user_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_total_xp"("user_uuid" "uuid") IS 'Calculate total XP earned by a user across all sources';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_question_type"("ld_type" "text") RETURNS "public"."question_type"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."normalize_question_type"("ld_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."normalize_question_type"("ld_type" "text") IS 'Convert LearnDash question types to our standardized enum values';



CREATE OR REPLACE FUNCTION "public"."reorder_lessons_in_course"("course_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    lesson_record RECORD;
    counter INTEGER := 1;
BEGIN
    -- Update the order of all lessons in the course to be sequential
    FOR lesson_record IN 
        SELECT id 
        FROM lessons 
        WHERE course_id = course_id_param 
        ORDER BY "order" ASC, created_at ASC
    LOOP
        UPDATE lessons 
        SET "order" = counter 
        WHERE id = lesson_record.id;
        
        counter := counter + 1;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."reorder_lessons_in_course"("course_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reorder_quizzes_in_course"("course_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    quiz_record RECORD;
    counter INTEGER := 1;
BEGIN
    -- Update the order of all quizzes in the course to be sequential
    FOR quiz_record IN 
        SELECT id 
        FROM quizzes 
        WHERE course_id = course_id_param 
        ORDER BY "order" ASC, created_at ASC
    LOOP
        UPDATE quizzes 
        SET "order" = counter 
        WHERE id = quiz_record.id;
        
        counter := counter + 1;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."reorder_quizzes_in_course"("course_id_param" "uuid") OWNER TO "postgres";


CREATE PROCEDURE "public"."transform_all_quiz_data"()
    LANGUAGE "plpgsql"
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


ALTER PROCEDURE "public"."transform_all_quiz_data"() OWNER TO "postgres";


COMMENT ON PROCEDURE "public"."transform_all_quiz_data"() IS 'Run complete transformation of all quiz data from staging tables';



CREATE OR REPLACE FUNCTION "public"."transform_raw_answers"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."transform_raw_answers"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."transform_raw_answers"() IS 'Transform raw answer data from staging table to quiz_answers';



CREATE OR REPLACE FUNCTION "public"."transform_raw_questions"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."transform_raw_questions"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."transform_raw_questions"() IS 'Transform raw question data from staging table to quiz_questions';



CREATE OR REPLACE FUNCTION "public"."transform_raw_quizzes"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."transform_raw_quizzes"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."transform_raw_quizzes"() IS 'Transform raw quiz data from staging table to enhanced_quizzes';



CREATE OR REPLACE FUNCTION "public"."update_quiz_references"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_quiz_references"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_quiz_references"() IS 'Update quiz references after legacy ID mapping';



CREATE OR REPLACE FUNCTION "public"."validate_quiz_integrity"() RETURNS TABLE("quiz_id" "uuid", "quiz_title" "text", "question_count" integer, "answer_count" integer, "has_correct_answers" boolean, "issues" "text"[])
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."validate_quiz_integrity"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_quiz_integrity"() IS 'Validate quiz data integrity and return issues found';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."answers" (
    "attempt_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "option_id" "uuid" NOT NULL
);


ALTER TABLE "public"."answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."certificates" (
    "student_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "file_url" "text",
    "issued_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."certificates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "hero_image" "text",
    "admin_id" "uuid",
    "status" "text" DEFAULT 'draft'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "module_id" "uuid",
    "slug" "text",
    "legacy_id" "text",
    "order" integer,
    CONSTRAINT "courses_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text"])))
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enhanced_quiz_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quiz_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "finished_at" timestamp with time zone,
    "score_points" integer DEFAULT 0,
    "score_percent" numeric(5,2),
    "passed" boolean,
    "raw_answers" "jsonb",
    "meta" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."enhanced_quiz_attempts" OWNER TO "postgres";


COMMENT ON TABLE "public"."enhanced_quiz_attempts" IS 'User attempts at quizzes with detailed scoring';



CREATE TABLE IF NOT EXISTS "public"."enhanced_quizzes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "legacy_id" "text",
    "scope" "public"."quiz_scope" NOT NULL,
    "course_id" "uuid",
    "lesson_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "pass_percent" numeric(5,2) DEFAULT 0,
    "max_points" integer DEFAULT 0,
    "feedback_mode" "public"."quiz_feedback_mode" DEFAULT 'at_end'::"public"."quiz_feedback_mode",
    "sort_order" integer DEFAULT 0,
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."enhanced_quizzes" OWNER TO "postgres";


COMMENT ON TABLE "public"."enhanced_quizzes" IS 'Enhanced quizzes table supporting both course and lesson scoped quizzes';



CREATE TABLE IF NOT EXISTS "public"."lesson_progress" (
    "student_id" "uuid" NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"(),
    "xp_awarded" integer DEFAULT 0,
    "reward_reason" "text",
    "last_viewed_at" timestamp with time zone,
    "progress_percent" numeric(5,2) DEFAULT 0
);


ALTER TABLE "public"."lesson_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lessons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid",
    "sort_order" integer,
    "title" "text",
    "markdown" "text",
    "content" "text",
    "video_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "order" integer
);


ALTER TABLE "public"."lessons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "hero_image" "text",
    "status" "text" DEFAULT 'published'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "legacy_id" integer,
    "order" integer,
    CONSTRAINT "modules_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text"])))
);


ALTER TABLE "public"."modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question_id" "uuid",
    "option_text" "text",
    "is_correct" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "role" "text" DEFAULT 'student'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    "first_name" "text",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'student'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quiz_id" "uuid",
    "question" "text",
    "type" "text" DEFAULT 'single'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "questions_type_check" CHECK (("type" = ANY (ARRAY['single'::"text", 'multiple'::"text"])))
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question_id" "uuid" NOT NULL,
    "legacy_id" "text",
    "answer_html" "text" NOT NULL,
    "is_correct" boolean DEFAULT false,
    "feedback_html" "text",
    "sort_order" integer DEFAULT 0,
    "value_numeric" numeric,
    "value_text" "text",
    "meta" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."quiz_answers" OWNER TO "postgres";


COMMENT ON TABLE "public"."quiz_answers" IS 'Answer choices for quiz questions';



CREATE TABLE IF NOT EXISTS "public"."quiz_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid",
    "quiz_id" "uuid",
    "score_percentage" integer,
    "passed" boolean,
    "completed_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "score_raw" integer,
    "attempt_number" integer DEFAULT 1,
    "started_at" timestamp with time zone
);


ALTER TABLE "public"."quiz_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "legacy_id" "text",
    "quiz_id" "uuid" NOT NULL,
    "type" "public"."question_type" NOT NULL,
    "question_html" "text" NOT NULL,
    "explanation_html" "text",
    "points" integer DEFAULT 1,
    "category" "text",
    "sort_order" integer DEFAULT 0,
    "meta" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."quiz_questions" OWNER TO "postgres";


COMMENT ON TABLE "public"."quiz_questions" IS 'Questions for quizzes with support for multiple question types';



CREATE OR REPLACE VIEW "public"."quiz_details" AS
 SELECT "eq"."id",
    "eq"."title",
    "eq"."description",
    "eq"."scope",
    "eq"."course_id",
    "eq"."lesson_id",
    "eq"."pass_percent",
    "eq"."max_points",
    "eq"."feedback_mode",
    "c"."title" AS "course_title",
    "l"."title" AS "lesson_title",
    "count"("qq"."id") AS "question_count"
   FROM ((("public"."enhanced_quizzes" "eq"
     LEFT JOIN "public"."courses" "c" ON (("c"."id" = "eq"."course_id")))
     LEFT JOIN "public"."lessons" "l" ON (("l"."id" = "eq"."lesson_id")))
     LEFT JOIN "public"."quiz_questions" "qq" ON (("qq"."quiz_id" = "eq"."id")))
  GROUP BY "eq"."id", "eq"."title", "eq"."description", "eq"."scope", "eq"."course_id", "eq"."lesson_id", "eq"."pass_percent", "eq"."max_points", "eq"."feedback_mode", "c"."title", "l"."title";


ALTER TABLE "public"."quiz_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quizzes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lesson_id" "uuid",
    "title" "text",
    "pass_pct" integer DEFAULT 80,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "course_id" "uuid"
);


ALTER TABLE "public"."quizzes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "source_type" "text" NOT NULL,
    "source_id" "uuid" NOT NULL,
    "points" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "note" "text",
    CONSTRAINT "rewards_source_type_check" CHECK (("source_type" = ANY (ARRAY['lesson'::"text", 'quiz'::"text", 'manual'::"text", 'badge'::"text"])))
);


ALTER TABLE "public"."rewards" OWNER TO "postgres";


COMMENT ON TABLE "public"."rewards" IS 'Flexible reward system for tracking all types of user achievements';



CREATE OR REPLACE VIEW "public"."user_progress_with_rewards" AS
 SELECT "lp"."student_id",
    "lp"."lesson_id",
    "lp"."completed_at",
    "lp"."xp_awarded",
    "lp"."reward_reason",
    "lp"."last_viewed_at",
    "lp"."progress_percent",
    "l"."title" AS "lesson_title",
    "c"."title" AS "course_title",
    "public"."get_user_total_xp"("lp"."student_id") AS "total_xp"
   FROM (("public"."lesson_progress" "lp"
     JOIN "public"."lessons" "l" ON (("l"."id" = "lp"."lesson_id")))
     JOIN "public"."courses" "c" ON (("c"."id" = "l"."course_id")));


ALTER TABLE "public"."user_progress_with_rewards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wp_answers_raw" (
    "id" "text" NOT NULL,
    "question_id" "text",
    "answer_html" "text",
    "is_correct" boolean,
    "feedback_html" "text",
    "sort_order" integer,
    "value_numeric" numeric,
    "value_text" "text",
    "meta" "jsonb"
);


ALTER TABLE "public"."wp_answers_raw" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wp_questions_raw" (
    "id" "text" NOT NULL,
    "quiz_id" "text",
    "question_html" "text",
    "explanation_html" "text",
    "type" "text",
    "points" integer,
    "category" "text",
    "sort_order" integer,
    "meta" "jsonb"
);


ALTER TABLE "public"."wp_questions_raw" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wp_quizzes_raw" (
    "id" "text" NOT NULL,
    "title" "text",
    "description" "text",
    "course_id" "text",
    "lesson_id" "text",
    "pass_percent" numeric(5,2),
    "max_points" integer,
    "feedback_mode" "text",
    "sort_order" integer,
    "settings" "jsonb"
);


ALTER TABLE "public"."wp_quizzes_raw" OWNER TO "postgres";


ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_pkey" PRIMARY KEY ("attempt_id", "question_id", "option_id");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_pkey" PRIMARY KEY ("student_id", "course_id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."enhanced_quiz_attempts"
    ADD CONSTRAINT "enhanced_quiz_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enhanced_quizzes"
    ADD CONSTRAINT "enhanced_quizzes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("student_id", "lesson_id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."options"
    ADD CONSTRAINT "options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_answers"
    ADD CONSTRAINT "quiz_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rewards"
    ADD CONSTRAINT "rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wp_answers_raw"
    ADD CONSTRAINT "wp_answers_raw_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wp_questions_raw"
    ADD CONSTRAINT "wp_questions_raw_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wp_quizzes_raw"
    ADD CONSTRAINT "wp_quizzes_raw_pkey" PRIMARY KEY ("id");



CREATE INDEX "courses_legacy_id_idx" ON "public"."courses" USING "btree" ("legacy_id");



CREATE INDEX "quiz_answers_question_id_idx" ON "public"."quiz_answers" USING "btree" ("question_id");



CREATE INDEX "quiz_attempts_user_quiz_idx" ON "public"."enhanced_quiz_attempts" USING "btree" ("user_id", "quiz_id");



CREATE INDEX "quiz_questions_quiz_id_idx" ON "public"."quiz_questions" USING "btree" ("quiz_id");



CREATE INDEX "rewards_user_id_idx" ON "public"."rewards" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."options"("id");



ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enhanced_quiz_attempts"
    ADD CONSTRAINT "enhanced_quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."enhanced_quizzes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enhanced_quiz_attempts"
    ADD CONSTRAINT "enhanced_quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enhanced_quizzes"
    ADD CONSTRAINT "enhanced_quizzes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enhanced_quizzes"
    ADD CONSTRAINT "enhanced_quizzes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."options"
    ADD CONSTRAINT "options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_answers"
    ADD CONSTRAINT "quiz_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id");



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."enhanced_quizzes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rewards"
    ADD CONSTRAINT "rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all progress" ON "public"."lesson_progress" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage courses" ON "public"."courses" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage enhanced quizzes" ON "public"."enhanced_quizzes" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins can manage lessons" ON "public"."lessons" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage modules" ON "public"."modules" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins can manage options" ON "public"."options" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins can manage questions" ON "public"."questions" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins can manage quiz answers" ON "public"."quiz_answers" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins can manage quiz questions" ON "public"."quiz_questions" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins can manage quizzes" ON "public"."quizzes" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins can view all answers" ON "public"."answers" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins can view all certificates" ON "public"."certificates" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins can view all enhanced quiz attempts" ON "public"."enhanced_quiz_attempts" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins can view all profiles via jwt" ON "public"."profiles" TO "authenticated" USING ((COALESCE((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text"), (("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), 'student'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can view all quiz attempts" ON "public"."quiz_attempts" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all rewards" ON "public"."rewards" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Enhanced quizzes viewable if course published" ON "public"."enhanced_quizzes" FOR SELECT USING (((("scope" = 'course'::"public"."quiz_scope") AND (EXISTS ( SELECT 1
   FROM "public"."courses"
  WHERE (("courses"."id" = "enhanced_quizzes"."course_id") AND ("courses"."status" = 'published'::"text"))))) OR (("scope" = 'lesson'::"public"."quiz_scope") AND (EXISTS ( SELECT 1
   FROM ("public"."lessons"
     JOIN "public"."courses" ON (("courses"."id" = "lessons"."course_id")))
  WHERE (("lessons"."id" = "enhanced_quizzes"."lesson_id") AND ("courses"."status" = 'published'::"text")))))));



CREATE POLICY "Lessons viewable if course published" ON "public"."lessons" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."courses"
  WHERE (("courses"."id" = "lessons"."course_id") AND ("courses"."status" = 'published'::"text")))));



CREATE POLICY "Options viewable if course published" ON "public"."options" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."questions"
     JOIN "public"."quizzes" ON (("quizzes"."id" = "questions"."quiz_id")))
  WHERE (("questions"."id" = "options"."question_id") AND ((("quizzes"."course_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."courses"
          WHERE (("courses"."id" = "quizzes"."course_id") AND ("courses"."status" = 'published'::"text"))))) OR (("quizzes"."lesson_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM ("public"."lessons"
             JOIN "public"."courses" ON (("courses"."id" = "lessons"."course_id")))
          WHERE (("lessons"."id" = "quizzes"."lesson_id") AND ("courses"."status" = 'published'::"text"))))))))));



CREATE POLICY "Published courses are viewable by all" ON "public"."courses" FOR SELECT USING (("status" = 'published'::"text"));



CREATE POLICY "Published modules are viewable by all" ON "public"."modules" FOR SELECT USING ((("status" = 'published'::"text") OR ("status" IS NULL)));



CREATE POLICY "Questions viewable if course published" ON "public"."questions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."quizzes"
  WHERE (("quizzes"."id" = "questions"."quiz_id") AND ((("quizzes"."course_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."courses"
          WHERE (("courses"."id" = "quizzes"."course_id") AND ("courses"."status" = 'published'::"text"))))) OR (("quizzes"."lesson_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM ("public"."lessons"
             JOIN "public"."courses" ON (("courses"."id" = "lessons"."course_id")))
          WHERE (("lessons"."id" = "quizzes"."lesson_id") AND ("courses"."status" = 'published'::"text"))))))))));



CREATE POLICY "Quiz answers viewable if question is accessible" ON "public"."quiz_answers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."quiz_questions"
     JOIN "public"."enhanced_quizzes" ON (("enhanced_quizzes"."id" = "quiz_questions"."quiz_id")))
  WHERE (("quiz_questions"."id" = "quiz_answers"."question_id") AND ((("enhanced_quizzes"."scope" = 'course'::"public"."quiz_scope") AND (EXISTS ( SELECT 1
           FROM "public"."courses"
          WHERE (("courses"."id" = "enhanced_quizzes"."course_id") AND ("courses"."status" = 'published'::"text"))))) OR (("enhanced_quizzes"."scope" = 'lesson'::"public"."quiz_scope") AND (EXISTS ( SELECT 1
           FROM ("public"."lessons"
             JOIN "public"."courses" ON (("courses"."id" = "lessons"."course_id")))
          WHERE (("lessons"."id" = "enhanced_quizzes"."lesson_id") AND ("courses"."status" = 'published'::"text"))))))))));



CREATE POLICY "Quiz questions viewable if quiz is accessible" ON "public"."quiz_questions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."enhanced_quizzes"
  WHERE (("enhanced_quizzes"."id" = "quiz_questions"."quiz_id") AND ((("enhanced_quizzes"."scope" = 'course'::"public"."quiz_scope") AND (EXISTS ( SELECT 1
           FROM "public"."courses"
          WHERE (("courses"."id" = "enhanced_quizzes"."course_id") AND ("courses"."status" = 'published'::"text"))))) OR (("enhanced_quizzes"."scope" = 'lesson'::"public"."quiz_scope") AND (EXISTS ( SELECT 1
           FROM ("public"."lessons"
             JOIN "public"."courses" ON (("courses"."id" = "lessons"."course_id")))
          WHERE (("lessons"."id" = "enhanced_quizzes"."lesson_id") AND ("courses"."status" = 'published'::"text"))))))))));



CREATE POLICY "Quizzes viewable if course published" ON "public"."quizzes" FOR SELECT USING (((("course_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."courses"
  WHERE (("courses"."id" = "quizzes"."course_id") AND ("courses"."status" = 'published'::"text"))))) OR (("lesson_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM ("public"."lessons"
     JOIN "public"."courses" ON (("courses"."id" = "lessons"."course_id")))
  WHERE (("lessons"."id" = "quizzes"."lesson_id") AND ("courses"."status" = 'published'::"text")))))));



CREATE POLICY "Service role full access" ON "public"."profiles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can insert own answers" ON "public"."answers" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."quiz_attempts"
  WHERE (("quiz_attempts"."id" = "answers"."attempt_id") AND ("quiz_attempts"."student_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own enhanced quiz attempts" ON "public"."enhanced_quiz_attempts" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own progress" ON "public"."lesson_progress" FOR INSERT WITH CHECK (("student_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own quiz attempts" ON "public"."quiz_attempts" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR (("student_id" IS NOT NULL) AND ("student_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert own rewards" ON "public"."rewards" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own profile" ON "public"."profiles" TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own progress" ON "public"."lesson_progress" FOR UPDATE USING (("student_id" = "auth"."uid"())) WITH CHECK (("student_id" = "auth"."uid"()));



CREATE POLICY "Users can view own answers" ON "public"."answers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."quiz_attempts"
  WHERE (("quiz_attempts"."id" = "answers"."attempt_id") AND ("quiz_attempts"."student_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own certificates" ON "public"."certificates" FOR SELECT USING (("student_id" = "auth"."uid"()));



CREATE POLICY "Users can view own enhanced quiz attempts" ON "public"."enhanced_quiz_attempts" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own progress" ON "public"."lesson_progress" FOR SELECT USING (("student_id" = "auth"."uid"()));



CREATE POLICY "Users can view own quiz attempts" ON "public"."quiz_attempts" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (("student_id" IS NOT NULL) AND ("student_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own rewards" ON "public"."rewards" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."certificates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enhanced_quiz_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enhanced_quizzes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lesson_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quizzes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rewards" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."courses";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."lessons";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."modules";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."award_lesson_xp"("user_uuid" "uuid", "lesson_uuid" "uuid", "xp_amount" integer, "reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."award_lesson_xp"("user_uuid" "uuid", "lesson_uuid" "uuid", "xp_amount" integer, "reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_lesson_xp"("user_uuid" "uuid", "lesson_uuid" "uuid", "xp_amount" integer, "reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."award_quiz_xp"("user_uuid" "uuid", "quiz_uuid" "uuid", "xp_amount" integer, "reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."award_quiz_xp"("user_uuid" "uuid", "quiz_uuid" "uuid", "xp_amount" integer, "reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_quiz_xp"("user_uuid" "uuid", "quiz_uuid" "uuid", "xp_amount" integer, "reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_legacy_mapping"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_legacy_mapping"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_legacy_mapping"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_with_profile"("user_email" "text", "user_password" "text", "user_role" "text", "confirm_email" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_with_profile"("user_email" "text", "user_password" "text", "user_role" "text", "confirm_email" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_with_profile"("user_email" "text", "user_password" "text", "user_role" "text", "confirm_email" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."determine_quiz_scope"("course_id_text" "text", "lesson_id_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."determine_quiz_scope"("course_id_text" "text", "lesson_id_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."determine_quiz_scope"("course_id_text" "text", "lesson_id_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_total_xp"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_total_xp"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_total_xp"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_question_type"("ld_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_question_type"("ld_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_question_type"("ld_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reorder_lessons_in_course"("course_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reorder_lessons_in_course"("course_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reorder_lessons_in_course"("course_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reorder_quizzes_in_course"("course_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reorder_quizzes_in_course"("course_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reorder_quizzes_in_course"("course_id_param" "uuid") TO "service_role";



GRANT ALL ON PROCEDURE "public"."transform_all_quiz_data"() TO "anon";
GRANT ALL ON PROCEDURE "public"."transform_all_quiz_data"() TO "authenticated";
GRANT ALL ON PROCEDURE "public"."transform_all_quiz_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."transform_raw_answers"() TO "anon";
GRANT ALL ON FUNCTION "public"."transform_raw_answers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."transform_raw_answers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."transform_raw_questions"() TO "anon";
GRANT ALL ON FUNCTION "public"."transform_raw_questions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."transform_raw_questions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."transform_raw_quizzes"() TO "anon";
GRANT ALL ON FUNCTION "public"."transform_raw_quizzes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."transform_raw_quizzes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_quiz_references"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_quiz_references"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_quiz_references"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_quiz_integrity"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_quiz_integrity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_quiz_integrity"() TO "service_role";


















GRANT ALL ON TABLE "public"."answers" TO "anon";
GRANT ALL ON TABLE "public"."answers" TO "authenticated";
GRANT ALL ON TABLE "public"."answers" TO "service_role";



GRANT ALL ON TABLE "public"."certificates" TO "anon";
GRANT ALL ON TABLE "public"."certificates" TO "authenticated";
GRANT ALL ON TABLE "public"."certificates" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."enhanced_quiz_attempts" TO "anon";
GRANT ALL ON TABLE "public"."enhanced_quiz_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."enhanced_quiz_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."enhanced_quizzes" TO "anon";
GRANT ALL ON TABLE "public"."enhanced_quizzes" TO "authenticated";
GRANT ALL ON TABLE "public"."enhanced_quizzes" TO "service_role";



GRANT ALL ON TABLE "public"."lesson_progress" TO "anon";
GRANT ALL ON TABLE "public"."lesson_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_progress" TO "service_role";



GRANT ALL ON TABLE "public"."lessons" TO "anon";
GRANT ALL ON TABLE "public"."lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."lessons" TO "service_role";



GRANT ALL ON TABLE "public"."modules" TO "anon";
GRANT ALL ON TABLE "public"."modules" TO "authenticated";
GRANT ALL ON TABLE "public"."modules" TO "service_role";



GRANT ALL ON TABLE "public"."options" TO "anon";
GRANT ALL ON TABLE "public"."options" TO "authenticated";
GRANT ALL ON TABLE "public"."options" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_answers" TO "anon";
GRANT ALL ON TABLE "public"."quiz_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_answers" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_attempts" TO "anon";
GRANT ALL ON TABLE "public"."quiz_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_questions" TO "anon";
GRANT ALL ON TABLE "public"."quiz_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_questions" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_details" TO "anon";
GRANT ALL ON TABLE "public"."quiz_details" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_details" TO "service_role";



GRANT ALL ON TABLE "public"."quizzes" TO "anon";
GRANT ALL ON TABLE "public"."quizzes" TO "authenticated";
GRANT ALL ON TABLE "public"."quizzes" TO "service_role";



GRANT ALL ON TABLE "public"."rewards" TO "anon";
GRANT ALL ON TABLE "public"."rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."rewards" TO "service_role";



GRANT ALL ON TABLE "public"."user_progress_with_rewards" TO "anon";
GRANT ALL ON TABLE "public"."user_progress_with_rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."user_progress_with_rewards" TO "service_role";



GRANT ALL ON TABLE "public"."wp_answers_raw" TO "anon";
GRANT ALL ON TABLE "public"."wp_answers_raw" TO "authenticated";
GRANT ALL ON TABLE "public"."wp_answers_raw" TO "service_role";



GRANT ALL ON TABLE "public"."wp_questions_raw" TO "anon";
GRANT ALL ON TABLE "public"."wp_questions_raw" TO "authenticated";
GRANT ALL ON TABLE "public"."wp_questions_raw" TO "service_role";



GRANT ALL ON TABLE "public"."wp_quizzes_raw" TO "anon";
GRANT ALL ON TABLE "public"."wp_quizzes_raw" TO "authenticated";
GRANT ALL ON TABLE "public"."wp_quizzes_raw" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
