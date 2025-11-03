/**
 * Geocode advisors that have addresses but are missing coordinates
 */

import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { batchGeocode } from '../lib/utils/geocoding'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function geocodeAdvisors() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('🔍 Finding advisors that need geocoding...\n')

  // Get advisors with addresses but no coordinates
  const { data: advisors, error } = await supabase
    .from('advisors')
    .select('id, name, address, city, state, zip_code, country')
    .not('address', 'is', null)
    .is('latitude', null)

  if (error) {
    console.error('Error fetching advisors:', error)
    return
  }

  if (!advisors || advisors.length === 0) {
    console.log('✅ No advisors need geocoding! All advisors with addresses have coordinates.')
    return
  }

  console.log(`📍 Found ${advisors.length} advisors with addresses but no coordinates\n`)

  // Prepare addresses for batch geocoding
  const addressesToGeocode = advisors.map(advisor => ({
    id: advisor.id,
    address: advisor.address || '',
    city: advisor.city || '',
    state: advisor.state || '',
    zipCode: advisor.zip_code || undefined,
    country: advisor.country || 'US',
  }))

  console.log('🌍 Starting geocoding... (this may take a few minutes)\n')

  // Batch geocode with 500ms delay between requests to respect API limits
  const results = await batchGeocode(addressesToGeocode, 500)

  let successCount = 0
  let failureCount = 0

  console.log('\n📊 Updating database with geocoding results...\n')

  for (const { id, result } of results) {
    const advisor = advisors.find(a => a.id === id)
    if (!advisor) continue

    if (result.success) {
      // Update advisor with coordinates
      const { error: updateError } = await supabase
        .from('advisors')
        .update({
          latitude: result.latitude,
          longitude: result.longitude,
        })
        .eq('id', id)

      if (updateError) {
        console.error(`❌ Failed to update ${advisor.name}:`, updateError.message)
        failureCount++
      } else {
        console.log(`✅ ${advisor.name} → ${result.latitude}, ${result.longitude}`)
        successCount++
      }
    } else {
      console.log(`⚠️  ${advisor.name} - ${result.error}`)
      failureCount++
    }
  }

  console.log('\n=== Geocoding Complete ===')
  console.log(`✅ Successfully geocoded: ${successCount}`)
  console.log(`❌ Failed to geocode: ${failureCount}`)

  if (successCount > 0) {
    console.log('\n🗺️  Updating PostGIS locations...')

    // Update PostGIS geography column
    const { error: postgisError } = await supabase.rpc('update_postgis_locations')

    if (postgisError) {
      console.error('⚠️  Failed to update PostGIS locations:', postgisError.message)
    } else {
      console.log('✅ PostGIS locations updated!')
    }
  }

  console.log('\n✨ Done! Advisors with addresses will now show maps on their profile pages.')
}

geocodeAdvisors().catch(console.error)
