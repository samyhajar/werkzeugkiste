-- Fix profiles table and trigger for user invitation flow
-- Add email column to profiles table and improve trigger function

-- Add email column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update the handle_new_user function to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    role = COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also create an UPDATE trigger to handle user metadata changes
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();