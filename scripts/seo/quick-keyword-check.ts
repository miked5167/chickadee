/**
 * Quick keyword comparison check
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

import { DataForSEOClient } from '../../lib/seo/dataforseo-client';

async function checkKeyword() {
  const client = new DataForSEOClient({
    login: process.env.DATAFORSEO_LOGIN!,
    password: process.env.DATAFORSEO_PASSWORD!,
  });

  const keywordsToCheck = [
    'hockey coaching',
    'hockey coach',
  ];

  console.log('🔍 Comparing "hockey coaching" vs "hockey coach"\n');
  console.log('DataForSEO (Google Ads Keyword Planner data):\n');

  // US data
  console.log('🇺🇸 United States:');
  const usResponse = await client.getKeywordData(keywordsToCheck, 2840);
  if (usResponse.tasks && usResponse.tasks[0]?.result) {
    for (const item of usResponse.tasks[0].result) {
      console.log(`  "${item.keyword}": ${item.search_volume || 0} searches/month`);
    }
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Canada data
  console.log('\n🇨🇦 Canada:');
  const caResponse = await client.getKeywordData(keywordsToCheck, 2124);
  if (caResponse.tasks && caResponse.tasks[0]?.result) {
    for (const item of caResponse.tasks[0].result) {
      console.log(`  "${item.keyword}": ${item.search_volume || 0} searches/month`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\nComparison with Ahrefs data:');
  console.log('Ahrefs reports "hockey coaching": 70 US + 20 CA = 90 total\n');
}

checkKeyword()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
