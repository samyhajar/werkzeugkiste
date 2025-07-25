-- Fix infinite recursion in RLS policies for profiles table

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;

-- Create simple, non-recursive policies
-- Users can manage their own profile
CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Allow service role to manage all profiles (for triggers and admin operations)
CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read profiles (needed for admin checks)
CREATE POLICY "Authenticated users can read profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');