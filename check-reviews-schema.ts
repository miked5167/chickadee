import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkReviewsSchema() {
  console.log('Checking reviews table schema...\n');

  // Get a sample review to see the columns
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error:', error.message);
  } else if (reviews && reviews.length > 0) {
    console.log('✅ Sample review columns:');
    console.log(Object.keys(reviews[0]));
  } else {
    console.log('No reviews in database yet. Checking with select all:');
    const { data: allReviews, error: allError } = await supabase
      .from('reviews')
      .select('*')
      .limit(0); // Get structure only

    console.log('Error:', allError);
  }
}

checkReviewsSchema().catch(console.error);
