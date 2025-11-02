-- Add is_verified column to advisors table
ALTER TABLE advisors
ADD COLUMN is_verified BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX idx_advisors_verified ON advisors(is_verified);

-- Optional: Mark some advisors as verified for testing
-- UPDATE advisors SET is_verified = true WHERE is_featured = true;

DO $$
BEGIN
  RAISE NOTICE '✓ Added is_verified column to advisors table';
  RAISE NOTICE '✓ Created index on is_verified';
END $$;
