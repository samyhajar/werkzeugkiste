

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



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






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



CREATE OR REPLACE FUNCTION "public"."check_module_completion"("p_student_id" "uuid", "p_module_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."check_module_completion"("p_student_id" "uuid", "p_module_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_module_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  completed_count int;
begin
  -- Count distinct modules the user has completed
  select count(distinct c.id)
  into completed_count
  from lesson_progress lp
  join lessons l on l.id = lp.lesson_id
  join courses c on c.id = l.course_id
  where lp.student_id = new.student_id
    and lp.completed_at is not null;

  -- If 4 or more modules completed, call the edge function
  if completed_count >= 4 then
    perform
      net.http_post(
        url := 'https://bdjluwlwxqdgkulkjozj.functions.supabase.co/generate-certificate',
        headers := jsonb_build_object('Content-Type','application/json'),
        body := jsonb_build_object('userId', new.student_id)::text
      );
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."check_user_module_completion"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."delete_module_with_cascade"("module_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."delete_module_with_cascade"("module_id" "uuid") OWNER TO "postgres";


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
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    role = COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    updated_at = NOW();
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



CREATE OR REPLACE FUNCTION "public"."trigger_set_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_timestamp"() OWNER TO "postgres";


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



CREATE OR REPLACE FUNCTION "public"."validate_quiz_integrity"() RETURNS TABLE("issue" "text", "quiz_id" "uuid", "quiz_legacy" "text", "details" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
declare
  quiz_record public.enhanced_quizzes%rowtype;
begin
  for quiz_record in
    select * from public.enhanced_quizzes
  loop
    -- 1) Quiz has no questions
    if not exists (
      select 1 from public.quiz_questions qq
      where qq.quiz_id = quiz_record.id
    ) then
      return query
      select 'QUIZ_HAS_NO_QUESTIONS', quiz_record.id, quiz_record.legacy_id,
             jsonb_build_object('title', quiz_record.title);
    end if;

    -- 2) Question without answers
    if exists (
      select 1
      from public.quiz_questions qq
      left join public.quiz_answers qa on qa.question_id = qq.id
      where qq.quiz_id = quiz_record.id
      group by qq.id
      having count(qa.id) = 0
    ) then
      return query
      select 'QUESTION_WITHOUT_ANSWERS', quiz_record.id, quiz_record.legacy_id,
             jsonb_build_object('title', quiz_record.title);
    end if;

    -- 3) No correct answer for non free_text questions
    if not exists (
      select 1
      from public.quiz_questions qq2
      join public.quiz_answers qa2 on qa2.question_id = qq2.id
      where qq2.quiz_id = quiz_record.id
        and qa2.is_correct = true
        and qq2.type <> 'free_text'
    ) then
      return query
      select 'NO_CORRECT_ANSWER', quiz_record.id, quiz_record.legacy_id,
             jsonb_build_object('title', quiz_record.title);
    end if;

    -- 4) pass_percent sanity
    if quiz_record.pass_percent > 100 then
      return query
      select 'PASS_PERCENT_GT_100', quiz_record.id, quiz_record.legacy_id,
             jsonb_build_object('pass_percent', quiz_record.pass_percent);
    end if;

  end loop;

  return;
end;
$$;


ALTER FUNCTION "public"."validate_quiz_integrity"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."answers" (
    "attempt_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "option_id" "uuid" NOT NULL
);


ALTER TABLE "public"."answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."certificates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "module_id" "uuid" NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "now"(),
    "pdf_url" "text" NOT NULL,
    "show_name" boolean DEFAULT true,
    "name_used" "text",
    "meta" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."certificates" OWNER TO "postgres";


COMMENT ON TABLE "public"."certificates" IS 'Certificates table - stores generated PDF certificates for completed modules';



CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "hero_image" "text",
    "admin_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "module_id" "uuid",
    "slug" "text",
    "legacy_id" "text",
    "order" integer
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."digi_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "icon" "text",
    "image_url" "text"
);


ALTER TABLE "public"."digi_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."digi_resource_slides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resource_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "link_url" "text",
    "image_url" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."digi_resource_slides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."digi_resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "url" "text" NOT NULL,
    "logo_url" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."digi_resources" OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "public"."income_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "emoji" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#10b981'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."income_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."legacy_course_mapping" (
    "legacy_id" "text" NOT NULL,
    "new_id" "uuid" NOT NULL
);


ALTER TABLE "public"."legacy_course_mapping" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."legacy_lesson_mapping" (
    "legacy_id" "text" NOT NULL,
    "new_id" "uuid"
);


ALTER TABLE "public"."legacy_lesson_mapping" OWNER TO "postgres";


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
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "legacy_id" integer,
    "order" integer,
    "presenter_materials_content" "text",
    "presenter_materials_urls" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "presenter_materials_urls_is_array" CHECK (("jsonb_typeof"("presenter_materials_urls") = 'array'::"text"))
);


ALTER TABLE "public"."modules" OWNER TO "postgres";


COMMENT ON COLUMN "public"."modules"."presenter_materials_urls" IS 'Array of PDF objects with structure: [{"url": "https://...", "title": "PDF Title"}]';



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



CREATE TABLE IF NOT EXISTS "public"."static_pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content_html" "text",
    "content_json" "jsonb",
    "meta" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."static_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_income_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "month_year" "text" NOT NULL,
    "description" "text",
    "is_recurring" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_income_entries" OWNER TO "postgres";


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
    "meta" "jsonb",
    "order" integer
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
    "meta" "jsonb",
    "order" integer
);


ALTER TABLE "public"."wp_questions_raw" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wp_quizzes_raw" (
    "id" "text" NOT NULL,
    "title" "text",
    "description" "text",
    "course_id" "text",
    "pass_percent" numeric(5,2),
    "max_points" integer,
    "feedback_mode" "text",
    "sort_order" integer,
    "settings" "jsonb",
    "order" integer,
    "lesson_id" "text"
);


ALTER TABLE "public"."wp_quizzes_raw" OWNER TO "postgres";


ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_pkey" PRIMARY KEY ("attempt_id", "question_id", "option_id");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."digi_categories"
    ADD CONSTRAINT "digi_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."digi_categories"
    ADD CONSTRAINT "digi_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."digi_resource_slides"
    ADD CONSTRAINT "digi_resource_slides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."digi_resources"
    ADD CONSTRAINT "digi_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enhanced_quiz_attempts"
    ADD CONSTRAINT "enhanced_quiz_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enhanced_quizzes"
    ADD CONSTRAINT "enhanced_quizzes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."income_categories"
    ADD CONSTRAINT "income_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legacy_course_mapping"
    ADD CONSTRAINT "legacy_course_mapping_pkey" PRIMARY KEY ("legacy_id");



ALTER TABLE ONLY "public"."legacy_lesson_mapping"
    ADD CONSTRAINT "legacy_lesson_mapping_pkey" PRIMARY KEY ("legacy_id");



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



ALTER TABLE ONLY "public"."static_pages"
    ADD CONSTRAINT "static_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."static_pages"
    ADD CONSTRAINT "static_pages_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "unique_user_module" UNIQUE ("user_id", "module_id");



ALTER TABLE ONLY "public"."user_income_entries"
    ADD CONSTRAINT "user_income_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_income_entries"
    ADD CONSTRAINT "user_income_entries_user_id_category_id_month_year_key" UNIQUE ("user_id", "category_id", "month_year");



ALTER TABLE ONLY "public"."wp_answers_raw"
    ADD CONSTRAINT "wp_answers_raw_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wp_questions_raw"
    ADD CONSTRAINT "wp_questions_raw_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wp_quizzes_raw"
    ADD CONSTRAINT "wp_quizzes_raw_pkey" PRIMARY KEY ("id");



CREATE INDEX "courses_legacy_id_idx" ON "public"."courses" USING "btree" ("legacy_id");



CREATE INDEX "idx_user_income_entries_category_id" ON "public"."user_income_entries" USING "btree" ("category_id");



CREATE INDEX "idx_user_income_entries_month_year" ON "public"."user_income_entries" USING "btree" ("month_year");



CREATE INDEX "idx_user_income_entries_user_id" ON "public"."user_income_entries" USING "btree" ("user_id");



CREATE INDEX "quiz_answers_question_id_idx" ON "public"."quiz_answers" USING "btree" ("question_id");



CREATE INDEX "quiz_attempts_user_quiz_idx" ON "public"."enhanced_quiz_attempts" USING "btree" ("user_id", "quiz_id");



CREATE INDEX "quiz_questions_quiz_id_idx" ON "public"."quiz_questions" USING "btree" ("quiz_id");



CREATE INDEX "rewards_user_id_idx" ON "public"."rewards" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "set_timestamp_digi_categories" BEFORE UPDATE ON "public"."digi_categories" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp_digi_resource_slides" BEFORE UPDATE ON "public"."digi_resource_slides" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp_digi_resources" BEFORE UPDATE ON "public"."digi_resources" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp_static_pages" BEFORE UPDATE ON "public"."static_pages" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "trg_check_user_completion" AFTER UPDATE ON "public"."lesson_progress" FOR EACH ROW WHEN ((("new"."completed_at" IS NOT NULL) AND ("old"."completed_at" IS DISTINCT FROM "new"."completed_at"))) EXECUTE FUNCTION "public"."check_user_module_completion"();



ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."options"("id");



ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."digi_resource_slides"
    ADD CONSTRAINT "digi_resource_slides_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."digi_resources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."digi_resources"
    ADD CONSTRAINT "digi_resources_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."digi_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enhanced_quiz_attempts"
    ADD CONSTRAINT "enhanced_quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."enhanced_quizzes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enhanced_quiz_attempts"
    ADD CONSTRAINT "enhanced_quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enhanced_quizzes"
    ADD CONSTRAINT "enhanced_quizzes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enhanced_quizzes"
    ADD CONSTRAINT "enhanced_quizzes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."legacy_course_mapping"
    ADD CONSTRAINT "legacy_course_mapping_new_id_fkey" FOREIGN KEY ("new_id") REFERENCES "public"."courses"("id");



ALTER TABLE ONLY "public"."legacy_lesson_mapping"
    ADD CONSTRAINT "legacy_lesson_mapping_new_id_fkey" FOREIGN KEY ("new_id") REFERENCES "public"."lessons"("id");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."user_income_entries"
    ADD CONSTRAINT "user_income_entries_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."income_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_income_entries"
    ADD CONSTRAINT "user_income_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



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



CREATE POLICY "Admins manage digi_categories" ON "public"."digi_categories" TO "authenticated" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text")) WITH CHECK ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins manage digi_resource_slides" ON "public"."digi_resource_slides" TO "authenticated" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text")) WITH CHECK ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins manage digi_resources" ON "public"."digi_resources" TO "authenticated" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text")) WITH CHECK ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins manage static_pages" ON "public"."static_pages" TO "authenticated" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text")) WITH CHECK ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Allow public read of static_pages" ON "public"."static_pages" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can view income categories" ON "public"."income_categories" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can read profiles" ON "public"."profiles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Courses are viewable by all" ON "public"."courses" FOR SELECT USING (true);



CREATE POLICY "Enhanced quizzes are viewable by all" ON "public"."enhanced_quizzes" FOR SELECT USING (true);



CREATE POLICY "Lessons are viewable by all" ON "public"."lessons" FOR SELECT USING (true);



CREATE POLICY "Modules are viewable by all" ON "public"."modules" FOR SELECT USING (true);



CREATE POLICY "Options are viewable by all" ON "public"."options" FOR SELECT USING (true);



CREATE POLICY "Public read digi_categories" ON "public"."digi_categories" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public read digi_resource_slides" ON "public"."digi_resource_slides" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public read digi_resources" ON "public"."digi_resources" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Questions are viewable by all" ON "public"."questions" FOR SELECT USING (true);



CREATE POLICY "Quiz answers are viewable by all" ON "public"."quiz_answers" FOR SELECT USING (true);



CREATE POLICY "Quiz questions are viewable by all" ON "public"."quiz_questions" FOR SELECT USING (true);



CREATE POLICY "Quizzes are viewable by all" ON "public"."quizzes" FOR SELECT USING (true);



CREATE POLICY "Service role can manage all profiles" ON "public"."profiles" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access" ON "public"."profiles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can delete their own income entries" ON "public"."user_income_entries" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own answers" ON "public"."answers" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."quiz_attempts"
  WHERE (("quiz_attempts"."id" = "answers"."attempt_id") AND ("quiz_attempts"."student_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own certificates" ON "public"."certificates" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own enhanced quiz attempts" ON "public"."enhanced_quiz_attempts" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own progress" ON "public"."lesson_progress" FOR INSERT WITH CHECK (("student_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own quiz attempts" ON "public"."quiz_attempts" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR (("student_id" IS NOT NULL) AND ("student_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert own rewards" ON "public"."rewards" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own income entries" ON "public"."user_income_entries" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own profile" ON "public"."profiles" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own progress" ON "public"."lesson_progress" FOR UPDATE USING (("student_id" = "auth"."uid"())) WITH CHECK (("student_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own income entries" ON "public"."user_income_entries" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own answers" ON "public"."answers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."quiz_attempts"
  WHERE (("quiz_attempts"."id" = "answers"."attempt_id") AND ("quiz_attempts"."student_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own certificates" ON "public"."certificates" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own enhanced quiz attempts" ON "public"."enhanced_quiz_attempts" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own progress" ON "public"."lesson_progress" FOR SELECT USING (("student_id" = "auth"."uid"()));



CREATE POLICY "Users can view own quiz attempts" ON "public"."quiz_attempts" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (("student_id" IS NOT NULL) AND ("student_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own rewards" ON "public"."rewards" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own income entries" ON "public"."user_income_entries" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."digi_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."digi_resource_slides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."digi_resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enhanced_quiz_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enhanced_quizzes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."income_categories" ENABLE ROW LEVEL SECURITY;


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


ALTER TABLE "public"."static_pages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_income_entries" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






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



GRANT ALL ON FUNCTION "public"."check_module_completion"("p_student_id" "uuid", "p_module_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_module_completion"("p_student_id" "uuid", "p_module_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_module_completion"("p_student_id" "uuid", "p_module_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_module_completion"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_module_completion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_module_completion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_legacy_mapping"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_legacy_mapping"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_legacy_mapping"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_with_profile"("user_email" "text", "user_password" "text", "user_role" "text", "confirm_email" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_with_profile"("user_email" "text", "user_password" "text", "user_role" "text", "confirm_email" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_with_profile"("user_email" "text", "user_password" "text", "user_role" "text", "confirm_email" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_module_with_cascade"("module_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_module_with_cascade"("module_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_module_with_cascade"("module_id" "uuid") TO "service_role";



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



GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "service_role";



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



GRANT ALL ON TABLE "public"."digi_categories" TO "anon";
GRANT ALL ON TABLE "public"."digi_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."digi_categories" TO "service_role";



GRANT ALL ON TABLE "public"."digi_resource_slides" TO "anon";
GRANT ALL ON TABLE "public"."digi_resource_slides" TO "authenticated";
GRANT ALL ON TABLE "public"."digi_resource_slides" TO "service_role";



GRANT ALL ON TABLE "public"."digi_resources" TO "anon";
GRANT ALL ON TABLE "public"."digi_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."digi_resources" TO "service_role";



GRANT ALL ON TABLE "public"."enhanced_quiz_attempts" TO "anon";
GRANT ALL ON TABLE "public"."enhanced_quiz_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."enhanced_quiz_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."enhanced_quizzes" TO "anon";
GRANT ALL ON TABLE "public"."enhanced_quizzes" TO "authenticated";
GRANT ALL ON TABLE "public"."enhanced_quizzes" TO "service_role";



GRANT ALL ON TABLE "public"."income_categories" TO "anon";
GRANT ALL ON TABLE "public"."income_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."income_categories" TO "service_role";



GRANT ALL ON TABLE "public"."legacy_course_mapping" TO "anon";
GRANT ALL ON TABLE "public"."legacy_course_mapping" TO "authenticated";
GRANT ALL ON TABLE "public"."legacy_course_mapping" TO "service_role";



GRANT ALL ON TABLE "public"."legacy_lesson_mapping" TO "anon";
GRANT ALL ON TABLE "public"."legacy_lesson_mapping" TO "authenticated";
GRANT ALL ON TABLE "public"."legacy_lesson_mapping" TO "service_role";



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



GRANT ALL ON TABLE "public"."static_pages" TO "anon";
GRANT ALL ON TABLE "public"."static_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."static_pages" TO "service_role";



GRANT ALL ON TABLE "public"."user_income_entries" TO "anon";
GRANT ALL ON TABLE "public"."user_income_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."user_income_entries" TO "service_role";



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
