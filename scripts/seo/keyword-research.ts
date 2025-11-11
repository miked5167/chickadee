/**
 * Keyword Research Script
 * Analyzes keyword opportunities for The Hockey Directory
 */

// Load environment variables first
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

import { DataForSEOClient } from '../../lib/seo/dataforseo-client';

interface KeywordData {
  keyword: string;
  searchVolume: number;
  competition: number;
  cpc: number;
  difficulty?: number;
}

async function runKeywordResearch() {
  console.log('🔍 Starting Keyword Research for The Hockey Directory\n');

  // Create client with explicit credentials from environment
  const client = new DataForSEOClient({
    login: process.env.DATAFORSEO_LOGIN!,
    password: process.env.DATAFORSEO_PASSWORD!,
  });

  // Define seed keywords for hockey advisors
  const seedKeywords = [
    'hockey advisor',
    'hockey agent',
    'hockey recruiting',
    'hockey consultant',
    'hockey training',
    'hockey camps',
    'youth hockey advisor',
    'junior hockey advisor',
    'NCAA hockey recruiting',
  ];

  console.log('📊 Analyzing seed keywords...\n');

  try {
    // Get keyword data for seed keywords
    const keywordDataResponse = await client.getKeywordData(seedKeywords);

    console.log('✅ Seed keyword data retrieved\n');
    console.log('Seed Keywords Analysis:');
    console.log('='.repeat(80));

    const allKeywords: KeywordData[] = [];

    if (keywordDataResponse.tasks && keywordDataResponse.tasks[0]?.result) {
      const results = keywordDataResponse.tasks[0].result;

      for (const item of results) {
        const keyword = item.keyword;
        const searchVolume = item.search_volume || 0;
        const competition = item.competition || 0;
        const cpc = item.cpc || 0;

        allKeywords.push({
          keyword,
          searchVolume,
          competition,
          cpc,
        });

        console.log(`\n📌 ${keyword}`);
        console.log(`   Search Volume: ${searchVolume.toLocaleString()}/month`);
        console.log(`   Competition: ${(competition * 100).toFixed(1)}%`);
        console.log(`   CPC: $${cpc.toFixed(2)}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n🔎 Finding related keywords...\n');

    // Get keyword suggestions for top seed keywords
    const topSeeds = seedKeywords.slice(0, 3);

    for (const seed of topSeeds) {
      console.log(`\nAnalyzing: "${seed}"`);
      console.log('-'.repeat(80));

      const suggestions = await client.getKeywordSuggestions(seed);

      if (suggestions.tasks && suggestions.tasks[0]?.result) {
        const results = suggestions.tasks[0].result;

        // Sort by search volume
        const sortedResults = results
          .filter((item: any) => item.search_volume > 10)
          .sort((a: any, b: any) => b.search_volume - a.search_volume)
          .slice(0, 10);

        for (const item of sortedResults) {
          allKeywords.push({
            keyword: item.keyword,
            searchVolume: item.search_volume || 0,
            competition: item.competition || 0,
            cpc: item.cpc || 0,
          });

          console.log(`   • ${item.keyword}`);
          console.log(`     Volume: ${item.search_volume?.toLocaleString() || 0}`);
          console.log(`     Competition: ${((item.competition || 0) * 100).toFixed(1)}%`);
        }
      }

      // Small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Sort all keywords by search volume
    allKeywords.sort((a, b) => b.searchVolume - a.searchVolume);

    // Generate report
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 KEYWORD RESEARCH SUMMARY\n');

    console.log(`Total Keywords Found: ${allKeywords.length}`);
    console.log(`Total Search Volume: ${allKeywords.reduce((sum, k) => sum + k.searchVolume, 0).toLocaleString()}/month\n`);

    console.log('Top 20 Keywords by Search Volume:');
    console.log('-'.repeat(80));

    const top20 = allKeywords.slice(0, 20);

    for (let i = 0; i < top20.length; i++) {
      const kw = top20[i];
      console.log(`${(i + 1).toString().padStart(2)}. ${kw.keyword.padEnd(40)} ${kw.searchVolume.toString().padStart(8)} vol  ${(kw.competition * 100).toFixed(0)}% comp  $${kw.cpc.toFixed(2)}`);
    }

    // Save to file
    const timestamp = new Date().toISOString().split('T')[0];
    const outputDir = path.join(process.cwd(), 'seo-research');
    const outputFile = path.join(outputDir, `keyword-research-${timestamp}.json`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputFile, JSON.stringify({
      date: timestamp,
      seedKeywords,
      totalKeywords: allKeywords.length,
      totalSearchVolume: allKeywords.reduce((sum, k) => sum + k.searchVolume, 0),
      keywords: allKeywords,
    }, null, 2));

    console.log(`\n✅ Report saved to: ${outputFile}`);

    // Generate recommendations
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 RECOMMENDATIONS\n');

    const highVolumeLowComp = allKeywords
      .filter(k => k.searchVolume > 100 && k.competition < 0.5)
      .slice(0, 5);

    if (highVolumeLowComp.length > 0) {
      console.log('🎯 High-Volume, Low-Competition Opportunities:');
      highVolumeLowComp.forEach((kw, i) => {
        console.log(`${i + 1}. ${kw.keyword} (${kw.searchVolume} vol, ${(kw.competition * 100).toFixed(0)}% comp)`);
      });
    }

    const localKeywords = allKeywords
      .filter(k => k.keyword.includes('near me') || k.keyword.includes('in') || k.keyword.includes('local'))
      .slice(0, 5);

    if (localKeywords.length > 0) {
      console.log('\n📍 Local SEO Opportunities:');
      localKeywords.forEach((kw, i) => {
        console.log(`${i + 1}. ${kw.keyword} (${kw.searchVolume} vol)`);
      });
    }

    const longTail = allKeywords
      .filter(k => k.keyword.split(' ').length >= 4)
      .slice(0, 5);

    if (longTail.length > 0) {
      console.log('\n🎯 Long-Tail Keyword Opportunities:');
      longTail.forEach((kw, i) => {
        console.log(`${i + 1}. ${kw.keyword} (${kw.searchVolume} vol, ${(kw.competition * 100).toFixed(0)}% comp)`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Keyword research complete!\n');

  } catch (error) {
    console.error('❌ Error during keyword research:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runKeywordResearch()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { runKeywordResearch };
