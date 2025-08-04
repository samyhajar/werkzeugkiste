-- Remove first module and move last module to first position
DO $$
DECLARE
    first_module_id UUID;
    last_module_id UUID;
    max_order_value INTEGER;
BEGIN
    -- Find the first module (order = 0)
    SELECT id INTO first_module_id
    FROM modules
    WHERE "order" = 0
    LIMIT 1;

    -- Find the current maximum order value
    SELECT MAX("order") INTO max_order_value FROM modules WHERE "order" IS NOT NULL;

    -- Find the last module (highest order)
    SELECT id INTO last_module_id
    FROM modules
    WHERE "order" = max_order_value
    LIMIT 1;

    -- Remove the first module
    IF first_module_id IS NOT NULL THEN
        DELETE FROM modules WHERE id = first_module_id;
        RAISE NOTICE 'Removed first module with id: %', first_module_id;
    END IF;

    -- Move the last module to first position (order = 0)
    IF last_module_id IS NOT NULL THEN
        UPDATE modules
        SET "order" = 0
        WHERE id = last_module_id;
        RAISE NOTICE 'Moved last module % to first position', last_module_id;
    END IF;

    -- Reorder remaining modules to fill gaps (starting from 1)
    WITH ranked_modules AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY "order", created_at) as rn
        FROM modules
        WHERE "order" != 0
    )
    UPDATE modules
    SET "order" = ranked_modules.rn
    FROM ranked_modules
    WHERE modules.id = ranked_modules.id;

    RAISE NOTICE 'Reordered remaining modules';
END $$;