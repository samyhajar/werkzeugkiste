-- Create users using Supabase's proper admin functions
-- This approach uses the correct Supabase auth system

-- Enable the necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a function to safely create users with proper auth flow
CREATE OR REPLACE FUNCTION create_user_with_profile(
    user_email TEXT,
    user_password TEXT,
    user_role TEXT DEFAULT 'student',
    confirm_email BOOLEAN DEFAULT true
) RETURNS uuid AS $$
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
        email,
        full_name,
        role,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        user_email,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create the users
DO $$
DECLARE
    user1_id uuid;
    user2_id uuid;
    user3_id uuid;
BEGIN
    -- Create samy.hajar@gmail.com (admin)
    SELECT create_user_with_profile('samy.hajar@gmail.com', 'samyto2508C/', 'admin', true) INTO user1_id;
    RAISE NOTICE 'Created user samy.hajar@gmail.com with ID: %', user1_id;

    -- Create philipp.vavra@qlp.at (admin)
    SELECT create_user_with_profile('philipp.vavra@qlp.at', 'password123', 'admin', true) INTO user2_id;
    RAISE NOTICE 'Created user philipp.vavra@qlp.at with ID: %', user2_id;

    -- Create phillip.vavra@gmail.com (student)
    SELECT create_user_with_profile('phillip.vavra@gmail.com', 'password123', 'student', true) INTO user3_id;
    RAISE NOTICE 'Created user phillip.vavra@gmail.com with ID: %', user3_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating users: %', SQLERRM;
END $$;

-- Clean up the function (optional, or keep it for future use)
-- DROP FUNCTION IF EXISTS create_user_with_profile(TEXT, TEXT, TEXT, BOOLEAN);

-- Verify the users were created
DO $$
BEGIN
    RAISE NOTICE 'Users in auth.users: %', (SELECT COUNT(*) FROM auth.users WHERE email IN ('samy.hajar@gmail.com', 'philipp.vavra@qlp.at', 'phillip.vavra@gmail.com'));
    RAISE NOTICE 'Profiles created: %', (SELECT COUNT(*) FROM public.profiles WHERE email IN ('samy.hajar@gmail.com', 'philipp.vavra@qlp.at', 'phillip.vavra@gmail.com'));
END $$;