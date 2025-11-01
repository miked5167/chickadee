import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function verifyImport() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Count total advisors
  const { count: totalCount } = await supabase
    .from('advisors')
    .select('*', { count: 'exact', head: true })

  console.log(`\n=== Import Verification ===`)
  console.log(`Total advisors in database: ${totalCount}`)

  // Get advisors with location data
  const { count: withLocation } = await supabase
    .from('advisors')
    .select('*', { count: 'exact', head: true })
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  console.log(`Advisors with coordinates: ${withLocation}`)

  // Get advisors with PostGIS location
  const { count: withPostGIS } = await supabase
    .from('advisors')
    .select('*', { count: 'exact', head: true })
    .not('location', 'is', null)

  console.log(`Advisors with PostGIS location: ${withPostGIS}`)

  // Sample of imported advisors
  const { data: samples } = await supabase
    .from('advisors')
    .select('name, email, city, state, country, latitude, longitude, data_quality_score')
    .order('created_at', { ascending: false })
    .limit(10)

  console.log(`\n=== Sample Advisors (most recent) ===`)
  samples?.forEach((advisor) => {
    console.log(`- ${advisor.name} (${advisor.city}, ${advisor.state}, ${advisor.country})`)
    console.log(`  Coords: ${advisor.latitude}, ${advisor.longitude}`)
    console.log(`  Quality Score: ${advisor.data_quality_score || 'N/A'}`)
  })

  // Check for advisors missing key data
  const { count: missingPhone } = await supabase
    .from('advisors')
    .select('*', { count: 'exact', head: true })
    .or('phone.is.null,phone.eq.')

  const { count: missingWebsite } = await supabase
    .from('advisors')
    .select('*', { count: 'exact', head: true })
    .or('website_url.is.null,website_url.eq.')

  const { count: missingDescription } = await supabase
    .from('advisors')
    .select('*', { count: 'exact', head: true })
    .or('description.is.null,description.eq.')

  console.log(`\n=== Data Completeness ===`)
  console.log(`Missing phone: ${missingPhone}`)
  console.log(`Missing website: ${missingWebsite}`)
  console.log(`Missing description: ${missingDescription}`)
}

verifyImport()
  .then(() => {
    console.log('\n✓ Verification complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n✗ Verification failed:', error)
    process.exit(1)
  })
