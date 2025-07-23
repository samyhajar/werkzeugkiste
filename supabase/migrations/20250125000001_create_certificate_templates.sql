-- Create certificate_templates table
CREATE TABLE IF NOT EXISTS certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  main_text TEXT DEFAULT '',
  footer_text TEXT DEFAULT '',
  show_date BOOLEAN DEFAULT true,
  show_certificate_number BOOLEAN DEFAULT true,
  background_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies for certificate_templates
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all templates
CREATE POLICY "Allow authenticated users to view templates" ON certificate_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert templates
CREATE POLICY "Allow authenticated users to insert templates" ON certificate_templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update templates
CREATE POLICY "Allow authenticated users to update templates" ON certificate_templates
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete templates
CREATE POLICY "Allow authenticated users to delete templates" ON certificate_templates
  FOR DELETE USING (auth.role() = 'authenticated');

-- Insert some default templates
INSERT INTO certificate_templates (name, title, subtitle, main_text, footer_text, show_date, show_certificate_number) VALUES
('Standard Certificate', 'ZERTIFIKAT', 'Digi+ Werkzeugkiste', 'Hiermit wird bestätigt, dass', 'Ausgestellt am:', true, true),
('Simple Certificate', 'BESTÄTIGUNG', 'Digi+ Werkzeugkiste', 'Es wird bestätigt, dass', 'Datum:', true, false),
('Professional Certificate', 'ZERTIFIKAT', 'Digi+ Werkzeugkiste - Digitale Kompetenzen', 'Hiermit wird offiziell bestätigt, dass', 'Ausstellungsdatum:', true, true);