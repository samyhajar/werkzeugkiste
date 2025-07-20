-- Create new users directly in auth.users and profiles tables
-- This migration creates the requested users with their specified roles and credentials

-- Insert users into auth.users table
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES
-- samy.hajar@gmail.com (admin) - password: samyto2508C/
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'samy.hajar@gmail.com',
    crypt('samyto2508C/', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"full_name": "samy.hajar", "role": "admin"}',
    false,
    'authenticated'
),
-- philipp.vavra@qlp.at (admin) - password: password123
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'philipp.vavra@qlp.at',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"full_name": "philipp.vavra", "role": "admin"}',
    false,
    'authenticated'
),
-- phillip.vavra@gmail.com (student) - password: password123
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'phillip.vavra@gmail.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"full_name": "phillip.vavra", "role": "student"}',
    false,
    'authenticated'
)
ON CONFLICT (email) DO NOTHING;

-- Insert corresponding profiles
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
)
SELECT
    u.id,
    u.email,
    (u.raw_user_meta_data->>'full_name'),
    (u.raw_user_meta_data->>'role'),
    u.created_at,
    u.updated_at
FROM auth.users u
WHERE u.email IN (
    'samy.hajar@gmail.com',
    'philipp.vavra@qlp.at',
    'phillip.vavra@gmail.com'
)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = now();