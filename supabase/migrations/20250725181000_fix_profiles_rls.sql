-- Fix RLS policies for profiles table to handle user invitations properly

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;

-- Create more permissive policies for profiles
-- Users can read and update their own profile
CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Allow users to insert their own profile (for invitation flow)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to manage all profiles (for triggers)
CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL USING (auth.role() = 'service_role');