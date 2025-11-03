import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function checkPublished() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Check total advisors
    const { data: all, count: totalCount } = await supabase
      .from('advisors')
      .select('*', { count: 'exact', head: true })

    console.log('Total advisors in database:', totalCount)

    // Check published advisors
    const { data: published, count: publishedCount } = await supabase
      .from('advisors')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)

    console.log('Published advisors:', publishedCount)

    // Get a few examples
    const { data: examples } = await supabase
      .from('advisors')
      .select('id, name, slug, is_published')
      .limit(5)

    console.log('\nExample advisors:')
    examples?.forEach(advisor => {
      console.log(`  ID: ${advisor.id}, Name: ${advisor.name}, Slug: ${advisor.slug}, Published: ${advisor.is_published}`)
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

checkPublished()
