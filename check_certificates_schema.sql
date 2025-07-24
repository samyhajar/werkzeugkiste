-- Check the actual schema of the certificates table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'certificates'
ORDER BY ordinal_position;

-- Check if the table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'certificates'
) as table_exists;

-- Show table structure using psql command
\d certificates;