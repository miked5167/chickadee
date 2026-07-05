-- A2: Add client_count and agency_tier to companies
--
-- client_count: number of players/clients an agency represents (nullable; unknown = NULL, never 0-as-unknown).
-- agency_tier:  segmentation used by the listings tier filter and card styling.
--               >=100 clients -> 'elite_pro', 20-99 -> 'established', else 'family_advisor'.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS skips whichever column already exists.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS client_count INTEGER;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS agency_tier TEXT NOT NULL DEFAULT 'family_advisor'
    CHECK (agency_tier IN ('elite_pro', 'established', 'family_advisor'));

-- Helpful index for the tier filter on /listings
CREATE INDEX IF NOT EXISTS idx_companies_agency_tier ON companies (agency_tier);
