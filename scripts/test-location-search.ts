/**
 * Test location-based search with PostGIS distance queries
 */

import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { buildPostGISDistanceQuery, formatDistance } from '../lib/utils/distance'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function testLocationSearch() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('🗺️  Testing Location-Based Search\n')

  // Test location: Boston, MA
  const testLat = 42.3601
  const testLng = -71.0589
  const testRadius = 50 // miles

  console.log(`📍 Test Location: Boston, MA (${testLat}, ${testLng})`)
  console.log(`📏 Search Radius: ${testRadius} miles\n`)

  try {
    // Use PostGIS distance query
    const { data: advisors, error } = await supabase
      .rpc('search_advisors_by_distance', {
        user_lat: testLat,
        user_lng: testLng,
        radius_miles: testRadius,
      })

    if (error) {
      console.error('❌ Error querying advisors:', error)
      console.log('\n⚠️  The PostGIS function might not exist yet.')
      console.log('   We need to create it in the database.\n')
      return
    }

    console.log(`✅ Found ${advisors?.length || 0} advisors within ${testRadius} miles\n`)

    if (advisors && advisors.length > 0) {
      console.log('Sample results (closest 10):')
      advisors.slice(0, 10).forEach((advisor: any, index: number) => {
        console.log(`\n${index + 1}. ${advisor.name}`)
        console.log(`   📍 ${advisor.city}, ${advisor.state}`)
        console.log(`   📏 Distance: ${formatDistance(advisor.distance_miles)}`)
        if (advisor.rating) {
          console.log(`   ⭐ Rating: ${advisor.rating.toFixed(1)}`)
        }
      })
    }
  } catch (err) {
    console.error('❌ Test failed:', err)
  }

  console.log('\n\n📊 Testing without RPC function (direct query):')

  // Try direct PostGIS query as fallback
  try {
    const { data: directResults, error: directError } = await supabase
      .from('advisors')
      .select('id, name, city, state, latitude, longitude, rating, review_count')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .eq('is_published', true)
      .limit(200)

    if (directError) {
      console.error('❌ Direct query error:', directError)
      return
    }

    // Calculate distances client-side
    const { calculateDistance } = require('../lib/utils/distance')
    const resultsWithDistance = directResults
      ?.map((advisor: any) => ({
        ...advisor,
        distance_miles: calculateDistance(testLat, testLng, advisor.latitude, advisor.longitude),
      }))
      .filter((advisor: any) => advisor.distance_miles <= testRadius)
      .sort((a: any, b: any) => a.distance_miles - b.distance_miles)

    console.log(`✅ Found ${resultsWithDistance?.length || 0} advisors (client-side calculation)\n`)

    if (resultsWithDistance && resultsWithDistance.length > 0) {
      console.log('Sample results (closest 10):')
      resultsWithDistance.slice(0, 10).forEach((advisor: any, index: number) => {
        console.log(`\n${index + 1}. ${advisor.name}`)
        console.log(`   📍 ${advisor.city}, ${advisor.state}`)
        console.log(`   📏 Distance: ${formatDistance(advisor.distance_miles)}`)
        if (advisor.rating) {
          console.log(`   ⭐ Rating: ${advisor.rating.toFixed(1)}`)
        }
      })
    }

    console.log('\n\n✅ Location-based search is working!')
    console.log('💡 Next step: Create the PostGIS RPC function for better performance')

  } catch (err) {
    console.error('❌ Direct query test failed:', err)
  }
}

testLocationSearch().catch(console.error)
