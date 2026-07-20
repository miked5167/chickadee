-- Migration: Add missing advisor profile fields
-- Date: 2025-11-09
-- Description: Adds new fields for comprehensive advisor profiles including
--              credentials, age groups, business details, and additional social media

-- Add new text array fields for multi-select options
ALTER TABLE advisors
  ADD COLUMN IF NOT EXISTS credentials TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS age_groups_served TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}';

-- Add business detail fields
ALTER TABLE advisors
  ADD COLUMN IF NOT EXISTS consultation_format TEXT,
  ADD COLUMN IF NOT EXISTS engagement_types TEXT,
  ADD COLUMN IF NOT EXISTS payment_methods TEXT,
  ADD COLUMN IF NOT EXISTS response_time TEXT DEFAULT 'Within 48 hours';

-- Add availability and service area fields
ALTER TABLE advisors
  ADD COLUMN IF NOT EXISTS accepting_clients TEXT DEFAULT 'accepting'
    CHECK (accepting_clients IN ('accepting', 'waitlist', 'not_accepting')),
  ADD COLUMN IF NOT EXISTS service_area TEXT,
  ADD COLUMN IF NOT EXISTS player_levels TEXT,
  ADD COLUMN IF NOT EXISTS languages TEXT;

-- Add additional social media fields
ALTER TABLE advisors
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Add comment to explain accepting_clients field
COMMENT ON COLUMN advisors.accepting_clients IS
  'Client acceptance status: accepting (default), waitlist, or not_accepting';

-- Migrate existing specialties data to specializations field
UPDATE advisors
SET specializations = specialties
WHERE specialties IS NOT NULL AND specialties != '{}';

-- Add index on specializations for better query performance
CREATE INDEX IF NOT EXISTS idx_advisors_specializations
  ON advisors USING GIN (specializations);

-- Add index on age_groups_served
CREATE INDEX IF NOT EXISTS idx_advisors_age_groups
  ON advisors USING GIN (age_groups_served);

-- Add index on credentials
CREATE INDEX IF NOT EXISTS idx_advisors_credentials
  ON advisors USING GIN (credentials);

-- Add index on accepting_clients for filtering
CREATE INDEX IF NOT EXISTS idx_advisors_accepting_clients
  ON advisors (accepting_clients);

-- Log migration success
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully. Added % fields to advisors table.', 13;
  RAISE NOTICE 'Migrated specialties data to specializations for % advisors.',
    (SELECT COUNT(*) FROM advisors WHERE specializations IS NOT NULL AND specializations != '{}');
END $$;
