-- Add RLS policies for certificates table
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own certificates
CREATE POLICY "Users can view own certificates" ON certificates
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own certificates
CREATE POLICY "Users can insert own certificates" ON certificates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all certificates
CREATE POLICY "Admins can view all certificates" ON certificates
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Add a comment about the certificates table
COMMENT ON TABLE certificates IS 'Certificates table - stores generated PDF certificates for completed modules';