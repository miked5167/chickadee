import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkSlugs() {
  const { data, error } = await supabase
    .from('advisors')
    .select('id, name, slug, is_published')
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('average_rating', { ascending: false })
    .limit(10);

  console.log('Top 10 advisors and their slugs:');
  console.log('='.repeat(60));
  data?.forEach((advisor, idx) => {
    console.log(`${idx + 1}. ${advisor.name}`);
    console.log(`   Slug: ${advisor.slug || '❌ MISSING!'}`);
    if (advisor.slug) {
      console.log(`   ✅ URL: /listings/${advisor.slug}`);
    } else {
      console.log(`   ❌ This advisor will cause a 404!`);
    }
    console.log('');
  });

  // Check specifically for "Top Shelf"
  const { data: topShelf } = await supabase
    .from('advisors')
    .select('id, name, slug')
    .ilike('name', '%Top Shelf%')
    .single();

  if (topShelf) {
    console.log('\n🔍 Found "Top Shelf Hockey Agency":');
    console.log(`   Name: ${topShelf.name}`);
    console.log(`   Slug: ${topShelf.slug || '❌ MISSING SLUG!'}`);
  }
}

checkSlugs().catch(console.error);
