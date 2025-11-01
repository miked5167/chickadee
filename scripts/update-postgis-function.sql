-- Function to update PostGIS location field from latitude/longitude
-- This is called after geocoding to populate the geography column

CREATE OR REPLACE FUNCTION update_postgis_locations()
RETURNS void AS $$
BEGIN
  UPDATE advisors
  SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  WHERE latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND location IS NULL;
END;
$$ LANGUAGE plpgsql;

-- You can also create a trigger to auto-update location when lat/lng changes
CREATE OR REPLACE FUNCTION auto_update_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_auto_update_location ON advisors;

CREATE TRIGGER trigger_auto_update_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON advisors
FOR EACH ROW
EXECUTE FUNCTION auto_update_location();
