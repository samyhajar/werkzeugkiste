-- Add order column to lessons table and populate it with sort_order values
ALTER TABLE lessons ADD COLUMN "order" INTEGER;

-- Populate the order column with current sort_order values
UPDATE lessons SET "order" = sort_order WHERE sort_order IS NOT NULL;

-- Set default value for lessons without sort_order
UPDATE lessons SET "order" = 0 WHERE "order" IS NULL;

-- Make order column NOT NULL with default 0
ALTER TABLE lessons ALTER COLUMN "order" SET NOT NULL;
ALTER TABLE lessons ALTER COLUMN "order" SET DEFAULT 0;