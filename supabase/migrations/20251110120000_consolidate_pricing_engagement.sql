-- Migration: Consolidate engagement_types and pricing_structure
-- Date: 2025-11-10
-- Description: Migrates engagement_types (TEXT) data into pricing_structure (TEXT[])
--              to create a single unified field with 9 options

-- Step 1: Migrate existing engagement_types data to pricing_structure
-- Add one-time engagements
UPDATE advisors
SET pricing_structure = array_append(pricing_structure, 'one-time')
WHERE engagement_types ILIKE '%one-time%'
  AND NOT ('one-time' = ANY(pricing_structure));

-- Add season-long engagements
UPDATE advisors
SET pricing_structure = array_append(pricing_structure, 'season-long')
WHERE engagement_types ILIKE '%season-long%'
  AND NOT ('season-long' = ANY(pricing_structure));

-- Add package-based engagements
UPDATE advisors
SET pricing_structure = array_append(pricing_structure, 'package-based')
WHERE engagement_types ILIKE '%package%'
  AND NOT ('package-based' = ANY(pricing_structure));

-- Add hourly engagements (map "Hourly" to "hourly")
UPDATE advisors
SET pricing_structure = array_append(pricing_structure, 'hourly')
WHERE engagement_types ILIKE '%hourly%'
  AND NOT ('hourly' = ANY(pricing_structure));

-- Add retainer engagements (map "Retainer" to "retainer")
UPDATE advisors
SET pricing_structure = array_append(pricing_structure, 'retainer')
WHERE engagement_types ILIKE '%retainer%'
  AND NOT ('retainer' = ANY(pricing_structure));

-- Step 2: Add comment explaining the migration
COMMENT ON COLUMN advisors.engagement_types IS
  'DEPRECATED: This field has been migrated to pricing_structure array. Data retained for reference only.';

-- Step 3: Update the pricing_structure comment to reflect new merged options
COMMENT ON COLUMN advisors.pricing_structure IS
  'Unified pricing and engagement options array. Options: one-time, season-long, package-based, flat-fee, hourly, retainer, free-consultation, payment-plans, sliding-scale';

-- Log migration results
DO $$
DECLARE
  migrated_count INTEGER;
  total_engagement_count INTEGER;
  total_advisors INTEGER;
BEGIN
  -- Count advisors with engagement_types data
  SELECT COUNT(*) INTO total_engagement_count
  FROM advisors
  WHERE engagement_types IS NOT NULL
    AND engagement_types != ''
    AND engagement_types != 'N/A';

  -- Count advisors with pricing_structure data after migration
  SELECT COUNT(*) INTO migrated_count
  FROM advisors
  WHERE array_length(pricing_structure, 1) > 0;

  SELECT COUNT(*) INTO total_advisors
  FROM advisors;

  RAISE NOTICE 'Migration completed successfully.';
  RAISE NOTICE 'Consolidated engagement_types and pricing_structure fields.';
  RAISE NOTICE '% advisors had engagement_types data that was migrated.', total_engagement_count;
  RAISE NOTICE '% out of % advisors now have pricing_structure values.',
    migrated_count,
    total_advisors;
  RAISE NOTICE 'engagement_types field deprecated but retained for reference.';
END $$;
