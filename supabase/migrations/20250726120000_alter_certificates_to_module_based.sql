-- Alter certificates table to be module-based
ALTER TABLE certificates
DROP CONSTRAINT certificates_pkey,
ADD COLUMN module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
DROP COLUMN course_id,
ADD PRIMARY KEY (student_id, module_id);