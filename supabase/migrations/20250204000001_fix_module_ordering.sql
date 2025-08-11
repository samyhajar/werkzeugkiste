-- Fix module ordering - move the last module to be the first one
-- Based on the images shown, the "under construction" module should be first

-- First, let's identify what modules we have and their current order
-- The modules appear to be:
-- 1. Modul 1: Einstieg in die digitale Welt
-- 2. Modul 2: Internet & E-Mails
-- 3. Modul 3: Digitale Sicherheit
-- 4. Modul 4: Jobs digital finden
-- 5. Modul 5: KI und Jobsuche
-- 6. Modul 6: Green Jobs & Green Skills
-- 7. Modul 7: meinAMS
-- 8. Digitale Werkzeugkiste - "under construction"

-- Update module ordering to move the "under construction" module to position 1
-- and shift all others down by 1

-- NOTE: Use the existing "order" column (added below if missing) instead of a non-existent order_index

-- Ensure we have an order column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'modules' AND column_name = 'order') THEN
        ALTER TABLE modules ADD COLUMN "order" INTEGER DEFAULT 0;

        -- If the column was just created, set initial ordering based on created_at
        WITH ordered AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM modules
        )
        UPDATE modules m
        SET "order" = o.rn
        FROM ordered o
        WHERE m.id = o.id;
    END IF;
END $$;

-- Apply the reordering after ensuring the column exists
UPDATE modules
SET "order" = CASE
    WHEN title LIKE '%under construction%' OR title LIKE '%Digitale Werkzeugkiste%' OR title LIKE '%Werkzeugkiste%' THEN 1
    WHEN title = 'Modul 1: Einstieg in die digitale Welt' THEN 2
    WHEN title = 'Modul 2: Internet & E-Mails' THEN 3
    WHEN title = 'Modul 3: Digitale Sicherheit' THEN 4
    WHEN title = 'Modul 4: Jobs digital finden' THEN 5
    WHEN title = 'Modul 5: KI und Jobsuche' THEN 6
    WHEN title = 'Modul 6: Green Jobs & Green Skills' THEN 7
    WHEN title = 'Modul 7: meinAMS' THEN 8
    ELSE "order" -- Keep existing order for any other modules
END;