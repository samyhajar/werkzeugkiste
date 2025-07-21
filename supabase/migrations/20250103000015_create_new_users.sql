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
    '550e8400-e29b-41d4-a716-446655440020',
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
    '550e8400-e29b-41d4-a716-446655440021',
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
    '550e8400-e29b-41d4-a716-446655440022',
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
ON CONFLICT (id) DO NOTHING;

-- Insert corresponding profiles
INSERT INTO public.profiles (
    id,
    full_name,
    role,
    created_at,
    updated_at
) VALUES
(
    '550e8400-e29b-41d4-a716-446655440020',
    'samy.hajar',
    'admin',
    now(),
    now()
),
(
    '550e8400-e29b-41d4-a716-446655440021',
    'philipp.vavra',
    'admin',
    now(),
    now()
),
(
    '550e8400-e29b-41d4-a716-446655440022',
    'phillip.vavra',
    'student',
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = now();