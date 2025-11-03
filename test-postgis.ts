import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testPostGISQueries() {
  console.log('Testing PostGIS Distance Queries\n');
  console.log('='.repeat(70));

  // Test locations
  const testLocations = [
    { name: 'Boston, MA', lat: 42.3601, lng: -71.0589 },
    { name: 'Toronto, ON', lat: 43.6532, lng: -79.3832 },
    { name: 'Minneapolis, MN', lat: 44.9778, lng: -93.2650 },
  ];

  for (const location of testLocations) {
    console.log(`\n📍 Testing from ${location.name} (${location.lat}, ${location.lng})`);
    console.log('-'.repeat(70));

    const radiusMiles = 50;
    const radiusMeters = radiusMiles * 1609.34;

    const startTime = Date.now();

    // Raw SQL query using PostGIS
    const { data, error } = await supabase.rpc('search_advisors_by_distance', {
      user_lat: location.lat,
      user_lng: location.lng,
      radius_miles: radiusMiles,
      result_limit: 10,
    });

    const queryTime = Date.now() - startTime;

    if (error) {
      console.log('❌ Query failed:', error.message);
      console.log('\nTrying alternative query method...\n');

      // Alternative: Direct query with ST_Distance
      const { data: altData, error: altError } = await supabase
        .from('advisors')
        .select('id, name, city, state, latitude, longitude')
        .eq('is_published', true)
        .not('location', 'is', null)
        .limit(10);

      if (altError) {
        console.log('❌ Alternative query also failed:', altError.message);
        continue;
      }

      // Calculate distances client-side
      const withDistances = altData
        ?.map((advisor) => {
          if (!advisor.latitude || !advisor.longitude) return null;

          // Haversine formula
          const toRad = (deg: number) => (deg * Math.PI) / 180;
          const R = 3959; // Earth radius in miles

          const dLat = toRad(advisor.latitude - location.lat);
          const dLng = toRad(advisor.longitude - location.lng);

          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(location.lat)) *
              Math.cos(toRad(advisor.latitude)) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);

          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          return {
            ...advisor,
            distance,
          };
        })
        .filter((a) => a !== null && a.distance <= radiusMiles)
        .sort((a, b) => a!.distance - b!.distance);

      console.log(`✅ Found ${withDistances?.length || 0} advisors (client-side calculation)`);
      console.log(`⏱️  Query time: ${queryTime}ms\n`);

      withDistances?.slice(0, 5).forEach((advisor, idx) => {
        console.log(
          `${idx + 1}. ${advisor.name} - ${advisor.city}, ${advisor.state} (${advisor.distance.toFixed(1)} mi)`
        );
      });

      continue;
    }

    console.log(`✅ Found ${data?.length || 0} advisors within ${radiusMiles} miles`);
    console.log(`⏱️  Query time: ${queryTime}ms\n`);

    // Display results
    data?.slice(0, 5).forEach((advisor: any, idx: number) => {
      console.log(
        `${idx + 1}. ${advisor.name} - ${advisor.city}, ${advisor.state} (${advisor.distance.toFixed(1)} mi)`
      );
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ PostGIS distance query testing complete!\n');
}

testPostGISQueries().catch(console.error);
