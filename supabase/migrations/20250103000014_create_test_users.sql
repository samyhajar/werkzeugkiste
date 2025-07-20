-- Create test users for development
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Create test user in auth.users table
    user_id := '550e8400-e29b-41d4-a716-446655440010';

    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'aaron.faustfield@gmail.com',
        crypt('password123', gen_salt('bf')), -- bcrypt hash
        NOW(),
        NOW(),
        NOW(),
        '',
        '',
        '',
        '',
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Aaron Faustfield"}'
    ) ON CONFLICT (id) DO NOTHING;

    -- Create corresponding profile
    INSERT INTO profiles (id, full_name, role, created_at, updated_at) VALUES
    (user_id, 'Aaron Faustfield', 'student', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Create admin user
    user_id := '550e8400-e29b-41d4-a716-446655440011';

    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'admin@werkzeugkiste.com',
        crypt('admin123', gen_salt('bf')), -- bcrypt hash
        NOW(),
        NOW(),
        NOW(),
        '',
        '',
        '',
        '',
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Admin User"}'
    ) ON CONFLICT (id) DO NOTHING;

    -- Create corresponding admin profile
    INSERT INTO profiles (id, full_name, role, created_at, updated_at) VALUES
    (user_id, 'Admin User', 'admin', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Test users created: aaron.faustfield@gmail.com (password123) and admin@werkzeugkiste.com (admin123)';
END $$;