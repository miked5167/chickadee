-- Create PostgreSQL function for distance-based advisor search using PostGIS
-- This function efficiently searches for advisors within a radius using PostGIS

CREATE OR REPLACE FUNCTION search_advisors_by_distance(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_miles DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  email TEXT,
  phone TEXT,
  website_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_miles DOUBLE PRECISION,
  rating DECIMAL,
  review_count INTEGER,
  is_verified BOOLEAN,
  is_featured BOOLEAN,
  logo_url TEXT,
  specialties TEXT[],
  services_offered TEXT[],
  years_in_business INTEGER,
  price_range TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  user_point GEOGRAPHY;
  radius_meters DOUBLE PRECISION;
BEGIN
  -- Create point from user coordinates (lng, lat order for PostGIS)
  user_point := ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;

  -- Convert radius from miles to meters
  radius_meters := radius_miles * 1609.34;

  -- Return advisors within radius, ordered by distance
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.slug,
    a.description,
    a.email,
    a.phone,
    a.website_url,
    a.address,
    a.city,
    a.state,
    a.zip_code,
    a.country,
    a.latitude,
    a.longitude,
    -- Calculate distance in miles
    (ST_Distance(a.location::geography, user_point) / 1609.34)::DOUBLE PRECISION AS distance_miles,
    a.average_rating AS rating,
    a.review_count,
    a.is_verified,
    a.is_featured,
    a.logo_url,
    a.specialties,
    a.services_offered,
    a.years_in_business,
    a.price_range
  FROM advisors a
  WHERE
    a.is_published = true
    AND a.location IS NOT NULL
    AND ST_DWithin(a.location::geography, user_point, radius_meters)
  ORDER BY
    distance_miles ASC,
    a.is_featured DESC,
    a.average_rating DESC NULLS LAST;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION search_advisors_by_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO anon;
GRANT EXECUTE ON FUNCTION search_advisors_by_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;

-- Add comment
COMMENT ON FUNCTION search_advisors_by_distance IS 'Search for published advisors within a specified radius (in miles) of a location, ordered by distance';
