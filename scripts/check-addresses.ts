/**
 * Check if address data is populated in the database
 */

import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function checkAddresses() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get total count
  const { count } = await supabase.from('advisors').select('*', { count: 'exact', head: true })
  console.log(`Total advisors in database: ${count}`)

  // Get sample records
  const { data } = await supabase
    .from('advisors')
    .select('name, address, city, state, zip_code, phone, email, website_url, latitude, longitude')
    .order('name')
    .limit(10)

  console.log('\nSample advisor records:\n')
  data?.forEach((advisor) => {
    console.log(`Name: ${advisor.name}`)
    console.log(`  Address: ${advisor.address || 'MISSING'}`)
    console.log(`  City: ${advisor.city || 'MISSING'}`)
    console.log(`  State: ${advisor.state || 'MISSING'}`)
    console.log(`  Zip: ${advisor.zip_code || 'MISSING'}`)
    console.log(`  Phone: ${advisor.phone || 'MISSING'}`)
    console.log(`  Lat/Lng: ${advisor.latitude || 'N/A'} / ${advisor.longitude || 'N/A'}`)
    console.log('')
  })

  // Count how many have addresses
  const { count: withAddress } = await supabase
    .from('advisors')
    .select('*', { count: 'exact', head: true })
    .not('address', 'is', null)

  const { count: withCity } = await supabase
    .from('advisors')
    .select('*', { count: 'exact', head: true })
    .not('city', 'is', null)

  const { count: withCoords } = await supabase
    .from('advisors')
    .select('*', { count: 'exact', head: true })
    .not('latitude', 'is', null)

  console.log('Data completeness:')
  console.log(`  With street address: ${withAddress}/${count}`)
  console.log(`  With city: ${withCity}/${count}`)
  console.log(`  With coordinates: ${withCoords}/${count}`)
}

checkAddresses().catch(console.error)
