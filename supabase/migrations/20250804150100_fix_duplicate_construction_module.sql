-- Fix duplicate construction module - remove the new one and reorder existing one
DO $$
DECLARE
    existing_module_id UUID;
BEGIN
    -- Find the existing construction module (not the one we just created)
    SELECT id INTO existing_module_id
    FROM modules
    WHERE (title ILIKE '%digitale werkzeugkiste%' OR title ILIKE '%under construction%' OR description ILIKE '%digitale werkzeugkiste%')
    AND id != '11111111-1111-1111-1111-111111111111'
    LIMIT 1;

    IF existing_module_id IS NOT NULL THEN
        -- Update the existing module to be first
        UPDATE modules
        SET "order" = 0
        WHERE id = existing_module_id;

        -- Delete the duplicate we created
        DELETE FROM modules WHERE id = '11111111-1111-1111-1111-111111111111';

        RAISE NOTICE 'Fixed duplicate - existing module % is now first, duplicate removed', existing_module_id;
    ELSE
        -- If we can't find the existing one, keep our created one but log it
        RAISE NOTICE 'Could not find existing construction module, keeping the created one';
    END IF;

    -- Ensure all other modules have proper order values (starting from 1)
    WITH ranked_modules AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
        FROM modules
        WHERE "order" != 0 OR "order" IS NULL
    )
    UPDATE modules
    SET "order" = ranked_modules.rn
    FROM ranked_modules
    WHERE modules.id = ranked_modules.id;

END $$;