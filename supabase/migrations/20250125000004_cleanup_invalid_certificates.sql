-- Clean up invalid certificates with null student_id or course_id
DELETE FROM certificates
WHERE student_id IS NULL
   OR course_id IS NULL;

-- Add constraints to prevent future invalid certificates
ALTER TABLE certificates
ADD CONSTRAINT certificates_student_id_not_null CHECK (student_id IS NOT NULL),
ADD CONSTRAINT certificates_course_id_not_null CHECK (course_id IS NOT NULL);

-- Add a comment about the cleanup
COMMENT ON TABLE certificates IS 'Certificates table - cleaned up invalid records on 2025-01-25';