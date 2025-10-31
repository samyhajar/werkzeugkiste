-- Create aktuelles collection tables
-- This handles create and read operations for the aktuelles collection
-- based on the chewies in the project rules

BEGIN;

CREATE TABLE IF NOT EXISTS public.aktuelles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Timestamps trigger
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_aktuelles ON public.aktuelles;
CREATE TRIGGER set_timestamp_aktuelles
BEFORE UPDATE ON public.aktuelles
FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();

ALTER TABLE public.aktuelles ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anon) to read
DROP POLICY IF EXISTS "Public read aktuelles" ON public.aktuelles;
CREATE POLICY "Public read aktuelles" ON public.aktuelles
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Only admins may insert/update/delete
DROP POLICY IF EXISTS "Admins manage aktuelles" ON public.aktuelles;
CREATE POLICY "Admins manage aktuelles" ON public.aktuelles
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Insert default dummy data
INSERT INTO public.aktuelles (title, content, sort_order, is_active) VALUES
('Lorem Ipsum', E'Neque porro quisquam est, qui dolorem. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magnåes eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem.', 1, true),
('Lorem Ipsum', E'Neque porro quisquam est, qui dolorem. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magnåes eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem.', 2, true),
('Lorem Ipsum', E'Neque porro quisquam est, qui dolorem. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magnåes eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem.', 3, true);

END;


