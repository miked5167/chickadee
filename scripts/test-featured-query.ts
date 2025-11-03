import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testFeaturedQuery() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  console.log('Testing the exact query from FeaturedListings component...\n')

  try {
    const { data: advisors, error } = await supabase
      .from('advisors')
      .select(`
        id,
        slug,
        name,
        city,
        state,
        country,
        description,
        services_offered,
        specialties,
        average_rating,
        review_count,
        is_verified,
        logo_url,
        years_in_business,
        is_featured
      `)
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('average_rating', { ascending: false, nullsFirst: false })
      .order('review_count', { ascending: false })
      .limit(6)

    if (error) {
      console.error('❌ Query error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return
    }

    console.log(`✓ Query successful`)
    console.log(`✓ Number of advisors returned: ${advisors?.length || 0}\n`)

    if (advisors && advisors.length > 0) {
      console.log('Featured advisors:')
      advisors.forEach((advisor, i) => {
        console.log(`\n${i + 1}. ${advisor.name}`)
        console.log(`   Slug: ${advisor.slug}`)
        console.log(`   Location: ${advisor.city}, ${advisor.state}`)
        console.log(`   Featured: ${advisor.is_featured}`)
        console.log(`   Verified: ${advisor.is_verified}`)
        console.log(`   Rating: ${advisor.average_rating || 'N/A'}`)
      })
    } else {
      console.log('⚠ No advisors returned from query')
    }
  } catch (error) {
    console.error('❌ Exception:', error)
  }
}

testFeaturedQuery()
