import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkHours() {
  // Check Top Shelf Hockey Agency specifically
  const { data: advisor, error } = await supabase
    .from('advisors')
    .select('id, name, business_hours')
    .eq('slug', 'top-shelf-hockey-agency')
    .single();

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('Advisor:', advisor.name);
  console.log('Business Hours:', advisor.business_hours);
  console.log('');

  // Check how many advisors have business hours
  const { data: allAdvisors } = await supabase
    .from('advisors')
    .select('id, name, business_hours')
    .eq('is_published', true)
    .limit(10);

  console.log('Sample of advisors with business hours:');
  console.log('='.repeat(60));
  allAdvisors?.forEach((adv) => {
    console.log(`${adv.name}:`);
    console.log(`  Hours: ${adv.business_hours || '❌ No hours'}`);
    console.log('');
  });
}

checkHours().catch(console.error);
