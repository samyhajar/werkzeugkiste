-- Script to consolidate "Einfache Sprache" resources
-- This script combines "Einfache Sprache Infos" and "Einfache Sprache Nachrichten" into one resource

-- First, let's see what resources exist
SELECT id, title, url, category_id FROM digi_resources WHERE title ILIKE '%einfache sprache%' ORDER BY title;

-- If we find multiple resources, we'll consolidate them
-- Step 1: Create a new consolidated resource (if needed)
-- INSERT INTO digi_resources (id, category_id, title, description, url, logo_url, sort_order)
-- VALUES (
--   gen_random_uuid(),
--   (SELECT id FROM digi_categories WHERE title = 'Kommunikation, Medien & Technisches' LIMIT 1),
--   'Einfache Sprache',
--   'Zusammenfassung aller einfachen Sprache Ressourcen',
--   'https://example.com/einfache-sprache',
--   NULL,
--   (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM digi_resources WHERE category_id = (SELECT id FROM digi_categories WHERE title = 'Kommunikation, Medien & Technisches' LIMIT 1))
-- );

-- Step 2: Move slides from old resources to new consolidated resource
-- UPDATE digi_resource_slides
-- SET resource_id = (SELECT id FROM digi_resources WHERE title = 'Einfache Sprache' LIMIT 1)
-- WHERE resource_id IN (
--   SELECT id FROM digi_resources WHERE title ILIKE '%einfache sprache%' AND title != 'Einfache Sprache'
-- );

-- Step 3: Delete old resources (this will also delete their slides due to foreign key constraints)
-- DELETE FROM digi_resources WHERE title ILIKE '%einfache sprache%' AND title != 'Einfache Sprache';

-- Note: Uncomment the INSERT, UPDATE, and DELETE statements above after reviewing the SELECT results
