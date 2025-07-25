-- First, drop the existing foreign key constraint
ALTER TABLE public.certificates
DROP CONSTRAINT certificates_user_id_fkey;

-- Then, add the new foreign key constraint with ON DELETE CASCADE
ALTER TABLE public.certificates
ADD CONSTRAINT certificates_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Repeat for any other tables that reference users
-- For example, if there is a 'progress' table:
-- ALTER TABLE public.progress
-- DROP CONSTRAINT progress_user_id_fkey;
--
-- ALTER TABLE public.progress
-- ADD CONSTRAINT progress_user_id_fkey
-- FOREIGN KEY (user_id)
-- REFERENCES auth.users(id)
-- ON DELETE CASCADE;
