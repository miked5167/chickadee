import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkTables() {
  console.log('Checking database tables...\n');

  // Check if reviews table exists by trying to query it
  const { data: reviewsData, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .limit(1);

  if (reviewsError) {
    console.log('❌ reviews table:', reviewsError.message);
  } else {
    console.log('✅ reviews table exists');
  }

  // Check if listing_views table exists
  const { data: viewsData, error: viewsError } = await supabase
    .from('listing_views')
    .select('*')
    .limit(1);

  if (viewsError) {
    console.log('❌ listing_views table:', viewsError.message);
  } else {
    console.log('✅ listing_views table exists');
  }

  // Try the actual query from the page
  console.log('\nTrying to fetch an advisor with reviews...');
  const { data: advisor, error: advisorError } = await supabase
    .from('advisors')
    .select(`
      *,
      reviews (
        id,
        rating,
        review_title,
        review_text,
        created_at,
        user_id
      )
    `)
    .eq('slug', 'top-shelf-hockey-agency')
    .eq('is_published', true)
    .single();

  if (advisorError) {
    console.log('❌ Query failed:', advisorError.message);
    console.log('Error details:', advisorError);
  } else {
    console.log('✅ Query succeeded');
    console.log('Advisor:', advisor.name);
    console.log('Reviews count:', advisor.reviews?.length || 0);
  }
}

checkTables().catch(console.error);
