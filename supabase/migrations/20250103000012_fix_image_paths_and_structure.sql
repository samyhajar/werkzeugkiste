-- Fix image paths and create proper module structure
DO $$
BEGIN
    -- Add modules table if it doesn't exist
    CREATE TABLE IF NOT EXISTS modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        hero_image TEXT,
        status TEXT CHECK (status IN ('draft','published')) DEFAULT 'published',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Add module_id column to courses if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'courses' AND column_name = 'module_id'
    ) THEN
        ALTER TABLE courses ADD COLUMN module_id UUID REFERENCES modules(id) ON DELETE CASCADE;
    END IF;

    -- Create the main module
    INSERT INTO modules (id, title, description, hero_image, status, created_at, updated_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'Modul 1: Einstieg in die digitale Welt', 'Grundlegende Informationen zur digitalen Welt, Smartphones, Computer und Windows-Bedienung', '/Modul-1-Digitalisierung-e1655816152674.png', 'published', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Update all existing courses to belong to this module and fix image paths
    UPDATE courses
    SET module_id = '550e8400-e29b-41d4-a716-446655440000',
        hero_image = '/Modul-1-Digitalisierung-e1655816152674.png'
    WHERE hero_image = 'Modul-1-Digitalisierung-e1655816152674.png' OR hero_image IS NULL;

    -- Fix any existing courses that don't have the leading slash
    UPDATE courses
    SET hero_image = '/' || hero_image
    WHERE hero_image IS NOT NULL
    AND hero_image NOT LIKE '/%'
    AND hero_image NOT LIKE 'http%';

    RAISE NOTICE 'Fixed image paths and created module structure';
END $$;