-- Check if certificates table exists and add test certificates
DO $$
BEGIN
  -- Check if certificates table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certificates') THEN
    -- Add test certificates for existing users and courses
    INSERT INTO certificates (student_id, course_id, file_url, issued_at)
    SELECT
      p.id as student_id,
      c.id as course_id,
      NULL as file_url,
      NOW() - INTERVAL '1 day' * (RANDOM() * 30)::integer as issued_at
    FROM profiles p
    CROSS JOIN courses c
    WHERE p.role = 'student'
      AND c.status = 'published'
      AND NOT EXISTS (
        SELECT 1 FROM certificates
        WHERE student_id = p.id AND course_id = c.id
      )
    LIMIT 5;

    RAISE NOTICE 'Added test certificates';
  ELSE
    RAISE NOTICE 'Certificates table does not exist';
  END IF;
END $$;