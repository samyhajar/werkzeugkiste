-- 1) Ensure the new-user trigger never sets email into profiles.full_name
--    It prefers metadata: full_name OR (first_name + last_name). Otherwise keep NULL.
--    Also store email and first_name columns for convenience.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email, first_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NULLIF(
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        TRIM(
          CONCAT(
            COALESCE(NEW.raw_user_meta_data->>'first_name',''),
            CASE WHEN COALESCE(NEW.raw_user_meta_data->>'last_name','') = '' THEN '' ELSE ' ' END,
            COALESCE(NEW.raw_user_meta_data->>'last_name','')
          )
        )
      ),
      ''
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'first_name',''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    role = EXCLUDED.role,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2) Backfill existing rows where profiles.full_name looks like an email
--    Use auth.users metadata where available.
WITH meta AS (
  SELECT
    u.id,
    NULLIF(
      COALESCE(
        u.raw_user_meta_data->>'full_name',
        TRIM(
          CONCAT(
            COALESCE(u.raw_user_meta_data->>'first_name',''),
            CASE WHEN COALESCE(u.raw_user_meta_data->>'last_name','') = '' THEN '' ELSE ' ' END,
            COALESCE(u.raw_user_meta_data->>'last_name','')
          )
        )
      ),
      ''
    ) AS meta_full_name,
    u.email,
    NULLIF(u.raw_user_meta_data->>'first_name','') AS meta_first_name
  FROM auth.users u
)
UPDATE public.profiles p
SET
  full_name = COALESCE(m.meta_full_name, p.full_name),
  email = COALESCE(m.email, p.email),
  first_name = COALESCE(m.meta_first_name, p.first_name),
  updated_at = NOW()
FROM meta m
WHERE p.id = m.id
  AND (p.full_name ~* '^[^ ]+@[^ ]+\.[^ ]+$');

-- Optional: For any remaining rows where full_name is still an email, clear it to NULL
-- so the app falls back to a display value and avoids rendering emails as names.
UPDATE public.profiles
SET full_name = NULL,
    updated_at = NOW()
WHERE full_name ~* '^[^ ]+@[^ ]+\.[^ ]+$';

