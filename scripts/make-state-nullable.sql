-- Make state column nullable to allow advisors without location data
-- This is needed for ~58 advisors that don't have state/province information

ALTER TABLE advisors ALTER COLUMN state DROP NOT NULL;

-- Verify the change was successful
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'advisors' AND column_name = 'state';

-- Expected result: is_nullable should be 'YES'
