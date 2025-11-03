import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testRLS() {
  // Test with anon key (what the frontend uses)
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  console.log('Testing RLS policies with anonymous key...\n')

  try {
    const { data, error, count } = await supabase
      .from('advisors')
      .select(`
        id,
        slug,
        name,
        city,
        state,
        country,
        is_published
      `, { count: 'exact' })
      .eq('is_published', true)
      .limit(5)

    if (error) {
      console.error('❌ Error querying advisors:', error)
      return
    }

    console.log(`✓ Total published advisors accessible: ${count}`)
    console.log('\nFirst 5 advisors:')
    data?.forEach(advisor => {
      console.log(`  - ${advisor.name} (${advisor.city}, ${advisor.state})`)
      console.log(`    Slug: ${advisor.slug}`)
      console.log(`    Published: ${advisor.is_published}`)
      console.log()
    })

    if (data && data.length > 0) {
      console.log('✓ RLS policies are working correctly!')
      console.log('✓ Anonymous users can read published advisors')
    } else {
      console.log('⚠ No advisors returned - RLS may be blocking access')
    }
  } catch (error) {
    console.error('❌ Exception:', error)
  }
}

testRLS()
