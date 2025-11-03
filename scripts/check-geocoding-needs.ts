/**
 * Check which advisors have addresses but are missing coordinates
 */

import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function checkGeocodingNeeds() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get advisors with addresses but no coordinates
  const { data: needsGeocoding } = await supabase
    .from('advisors')
    .select('name, address, city, state, zip_code, latitude, longitude')
    .not('address', 'is', null)
    .is('latitude', null)

  // Get advisors with city/state but no coordinates and no street address
  const { data: needsCityGeocoding } = await supabase
    .from('advisors')
    .select('name, address, city, state, zip_code, latitude, longitude')
    .not('city', 'is', null)
    .is('latitude', null)

  console.log('=== Geocoding Analysis ===\n')

  console.log(`Advisors with street addresses but NO coordinates: ${needsGeocoding?.length || 0}`)
  if (needsGeocoding && needsGeocoding.length > 0) {
    console.log('\nSample (first 10):')
    needsGeocoding.slice(0, 10).forEach(advisor => {
      console.log(`  - ${advisor.name}`)
      console.log(`    ${advisor.address}, ${advisor.city}, ${advisor.state} ${advisor.zip_code || ''}`)
    })
  }

  console.log(`\n\nAdvisors with city/state but NO coordinates: ${needsCityGeocoding?.length || 0}`)
  if (needsCityGeocoding && needsCityGeocoding.length > 0) {
    console.log('\nSample (first 10):')
    needsCityGeocoding.slice(0, 10).forEach(advisor => {
      const location = advisor.address
        ? `${advisor.address}, ${advisor.city}, ${advisor.state}`
        : `${advisor.city}, ${advisor.state}`
      console.log(`  - ${advisor.name}: ${location}`)
    })
  }

  // Check what data we have from the original CSV
  const { data: withCoords } = await supabase
    .from('advisors')
    .select('name, latitude, longitude')
    .not('latitude', 'is', null)

  console.log(`\n\nAdvisors WITH coordinates (from CSV): ${withCoords?.length || 0}`)
  console.log('\nThese advisors already have coordinates from the CSV import and will show maps.')
}

checkGeocodingNeeds().catch(console.error)
