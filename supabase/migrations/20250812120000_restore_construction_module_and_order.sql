-- Restore the "under construction" module and ensure it stays first (order = 0)
-- Then re-sequence all other modules starting from 1 based on existing order/created_at

DO $$
DECLARE
    construction_id UUID;
    chosen_construction_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    -- Ensure order column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'modules' AND column_name = 'order'
    ) THEN
        ALTER TABLE public.modules ADD COLUMN "order" INTEGER DEFAULT 0;
    END IF;

    -- Try to find an existing construction/placeholder module
    SELECT id INTO construction_id
    FROM public.modules
    WHERE (
        title ILIKE '%werkzeugkiste%' AND (
            title ILIKE '%nicht vollständig%'
            OR title ILIKE '%under construction%'
        )
    )
    OR (
        description ILIKE '%werkzeugkiste%' AND (
            description ILIKE '%nicht vollständig%'
            OR description ILIKE '%under construction%'
        )
    )
    LIMIT 1;

    IF construction_id IS NULL THEN
        -- Create/Upsert a dedicated construction module with a stable UUID
        INSERT INTO public.modules (id, title, description, hero_image, "order", created_at, updated_at)
        VALUES (
            chosen_construction_id,
            'Werkzeugkiste noch nicht vollständig verfügbar',
            'Momentan ist die Digitale Werkzeugkiste nicht vollständig verfügbar. Inhalte folgen in Kürze.',
            '/placeholder.png',
            0,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            hero_image = EXCLUDED.hero_image,
            "order" = 0,
            updated_at = NOW();
        construction_id := chosen_construction_id;
    ELSE
        -- Normalize the existing construction module
        UPDATE public.modules
        SET
            title = 'Werkzeugkiste noch nicht vollständig verfügbar',
            description = 'Momentan ist die Digitale Werkzeugkiste nicht vollständig verfügbar. Inhalte folgen in Kürze.',
            hero_image = '/placeholder.png',
            "order" = 0,
            updated_at = NOW()
        WHERE id = construction_id;
    END IF;

    -- Re-sequence all other modules to follow after construction (start at 1)
    WITH ranked AS (
        SELECT
            id,
            ROW_NUMBER() OVER (
                ORDER BY
                    CASE
                        WHEN title ILIKE 'Modul 7:%' OR title ILIKE '%meinAMS%'
                            THEN 1 ELSE 0
                    END,
                    "order",
                    created_at
            ) AS rn
        FROM public.modules
        WHERE id <> construction_id
    )
    UPDATE public.modules m
    SET "order" = r.rn
    FROM ranked r
    WHERE m.id = r.id;

    RAISE NOTICE 'Construction module ensured at order 0; other modules re-sequenced starting at 1.';
END $$;
