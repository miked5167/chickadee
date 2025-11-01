-- Verify which columns are nullable in the advisors table
-- This helps debug import issues

SELECT
  column_name,
  is_nullable,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'advisors'
  AND column_name IN ('name', 'city', 'email', 'state', 'country', 'slug')
ORDER BY column_name;

-- Expected results:
-- name: NO (required)
-- slug: NO (required)
-- country: NO (required, defaults to 'US')
-- city: YES (optional)
-- email: YES (optional)
-- state: YES (optional)
