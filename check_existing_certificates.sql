-- Check existing certificates data
SELECT
    student_id,
    course_id,
    file_url,
    issued_at
FROM certificates
ORDER BY issued_at DESC
LIMIT 10;

-- Check for null values
SELECT
    COUNT(*) as total_certificates,
    COUNT(CASE WHEN student_id IS NULL THEN 1 END) as null_student_ids,
    COUNT(CASE WHEN course_id IS NULL THEN 1 END) as null_course_ids,
    COUNT(CASE WHEN student_id = '' THEN 1 END) as empty_student_ids,
    COUNT(CASE WHEN course_id = '' THEN 1 END) as empty_course_ids
FROM certificates;