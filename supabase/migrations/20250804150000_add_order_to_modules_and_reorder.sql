-- Add order column to modules table and create construction module
DO $$
BEGIN
    -- Add order column to modules table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'modules' AND column_name = 'order'
    ) THEN
        ALTER TABLE modules ADD COLUMN "order" INTEGER DEFAULT 0;
    END IF;

    -- Create the "under construction" module if it doesn't exist
    INSERT INTO modules (id, title, description, hero_image, "order", created_at, updated_at) VALUES
    ('11111111-1111-1111-1111-111111111111', 
     'Digitale Werkzeugkiste - "under construction"', 
     'Momentan ist die Digitale Werkzeugkiste nicht vollständig verfügbar…. – die digitale', 
     '/placeholder.png', 
     0, 
     NOW(), 
     NOW())
    ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        "order" = 0;

    -- Update existing modules to have proper order values (starting from 1)
    -- First, let's get all existing modules except our construction one
    WITH ranked_modules AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
        FROM modules 
        WHERE id != '11111111-1111-1111-1111-111111111111'
    )
    UPDATE modules 
    SET "order" = ranked_modules.rn
    FROM ranked_modules 
    WHERE modules.id = ranked_modules.id;

    RAISE NOTICE 'Added order column to modules and created construction module as first';
END $$;