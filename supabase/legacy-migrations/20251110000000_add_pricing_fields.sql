-- Migration: Add structured pricing fields
-- Date: 2025-11-10
-- Description: Adds new structured pricing fields to replace free-text pricing
--              Enables filtering and sorting by price range and pricing features

-- Add new pricing fields
ALTER TABLE advisors
  -- Required: Typical engagement range (7 standardized options)
  ADD COLUMN IF NOT EXISTS typical_engagement_range TEXT DEFAULT 'varies'
    CHECK (typical_engagement_range IN (
      'under-1000',
      '1000-2500',
      '2500-5000',
      '5000-10000',
      '10000-25000',
      '25000-plus',
      'varies'
    )),

  -- Optional: Pricing structure/features (multi-select)
  ADD COLUMN IF NOT EXISTS pricing_structure TEXT[] DEFAULT '{}',

  -- Optional: Starting price in cents (e.g., 250000 = $2,500)
  ADD COLUMN IF NOT EXISTS starting_price INTEGER,

  -- Optional: Initial consultation fee type
  ADD COLUMN IF NOT EXISTS consultation_fee_type TEXT
    CHECK (consultation_fee_type IN ('free', 'paid', 'paid-applied') OR consultation_fee_type IS NULL),

  -- Optional: Consultation fee amount in cents (e.g., 50000 = $500)
  ADD COLUMN IF NOT EXISTS consultation_fee_amount INTEGER,

  -- Optional: Additional pricing details (renamed from pricing_message)
  ADD COLUMN IF NOT EXISTS pricing_details TEXT;

-- Add comments to explain fields
COMMENT ON COLUMN advisors.typical_engagement_range IS
  'Required. Typical total cost range for full engagement: under-1000, 1000-2500, 2500-5000, 5000-10000, 10000-25000, 25000-plus, or varies';

COMMENT ON COLUMN advisors.pricing_structure IS
  'Optional array. Pricing models offered: flat-fee, hourly, retainer, free-consultation, payment-plans, sliding-scale';

COMMENT ON COLUMN advisors.starting_price IS
  'Optional. Starting price in cents (e.g., 250000 = $2,500). Range: $100-$100,000';

COMMENT ON COLUMN advisors.consultation_fee_type IS
  'Optional. Initial consultation fee type: free, paid, or paid-applied (applied to engagement if hired)';

COMMENT ON COLUMN advisors.consultation_fee_amount IS
  'Optional. Consultation fee in cents. Only used when consultation_fee_type is paid or paid-applied';

COMMENT ON COLUMN advisors.pricing_details IS
  'Optional. Additional pricing context and notes (max 500 characters). Renamed from pricing_message';

-- Migrate existing pricing_message to pricing_details
UPDATE advisors
SET pricing_details = pricing_message
WHERE pricing_message IS NOT NULL AND pricing_message != '';

-- Attempt to migrate price_range to typical_engagement_range
-- Map common patterns to structured ranges
UPDATE advisors
SET typical_engagement_range = CASE
  -- Match "$X - $Y" or "$X-$Y" patterns
  WHEN price_range ~* '\$?\s*0?\s*-?\s*\$?\s*1,?000' OR price_range ~* 'under.*1,?000' THEN 'under-1000'
  WHEN price_range ~* '\$?\s*1,?000\s*-\s*\$?\s*2,?500' THEN '1000-2500'
  WHEN price_range ~* '\$?\s*2,?500\s*-\s*\$?\s*5,?000' THEN '2500-5000'
  WHEN price_range ~* '\$?\s*5,?000\s*-\s*\$?\s*10,?000' THEN '5000-10000'
  WHEN price_range ~* '\$?\s*10,?000\s*-\s*\$?\s*25,?000' THEN '10000-25000'
  WHEN price_range ~* '\$?\s*25,?000\+?' OR price_range ~* 'over.*25,?000' THEN '25000-plus'
  -- Default to 'varies' for "Contact for pricing" or unclear entries
  ELSE 'varies'
END
WHERE price_range IS NOT NULL AND price_range != ''
  AND typical_engagement_range = 'varies'; -- Only update if not already set

-- Add validation constraint for starting_price (min $100 = 10000 cents, max $100,000 = 10000000 cents)
ALTER TABLE advisors
  ADD CONSTRAINT starting_price_range
    CHECK (starting_price IS NULL OR (starting_price >= 10000 AND starting_price <= 10000000));

-- Add validation constraint for consultation_fee_amount (min $0, max $10,000 = 1000000 cents)
ALTER TABLE advisors
  ADD CONSTRAINT consultation_fee_amount_range
    CHECK (consultation_fee_amount IS NULL OR (consultation_fee_amount >= 0 AND consultation_fee_amount <= 1000000));

-- Add validation constraint: consultation_fee_amount must be null if type is 'free' or null
ALTER TABLE advisors
  ADD CONSTRAINT consultation_fee_consistency
    CHECK (
      (consultation_fee_type IN ('paid', 'paid-applied') AND consultation_fee_amount IS NOT NULL)
      OR (consultation_fee_type = 'free' AND consultation_fee_amount IS NULL)
      OR (consultation_fee_type IS NULL AND consultation_fee_amount IS NULL)
    );

-- Add validation constraint: pricing_details max 500 characters
ALTER TABLE advisors
  ADD CONSTRAINT pricing_details_length
    CHECK (pricing_details IS NULL OR LENGTH(pricing_details) <= 500);

-- Add indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_advisors_typical_engagement_range
  ON advisors (typical_engagement_range);

CREATE INDEX IF NOT EXISTS idx_advisors_pricing_structure
  ON advisors USING GIN (pricing_structure);

CREATE INDEX IF NOT EXISTS idx_advisors_starting_price
  ON advisors (starting_price) WHERE starting_price IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_advisors_consultation_fee_type
  ON advisors (consultation_fee_type) WHERE consultation_fee_type IS NOT NULL;

-- Log migration success
DO $$
DECLARE
  migrated_count INTEGER;
  total_count INTEGER;
BEGIN
  -- Count migrated pricing data
  SELECT COUNT(*) INTO migrated_count
  FROM advisors
  WHERE typical_engagement_range != 'varies';

  SELECT COUNT(*) INTO total_count
  FROM advisors;

  RAISE NOTICE 'Migration completed successfully. Added 6 new pricing fields to advisors table.';
  RAISE NOTICE 'Migrated pricing data for % out of % advisors (% have "varies").',
    migrated_count,
    total_count,
    total_count - migrated_count;
  RAISE NOTICE 'Old fields (price_range, pricing_message) retained for reference.';
END $$;
