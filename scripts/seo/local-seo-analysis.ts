/**
 * Local SEO Analysis Script
 * Analyzes local search results for hockey advisors in major cities
 */

// Load environment variables first
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

import { DataForSEOClient } from '../../lib/seo/dataforseo-client';

// Major cities to analyze
const targetCities = [
  { city: 'Toronto', state: 'Ontario', country: 'Canada' },
  { city: 'Vancouver', state: 'British Columbia', country: 'Canada' },
  { city: 'Montreal', state: 'Quebec', country: 'Canada' },
  { city: 'Boston', state: 'Massachusetts', country: 'USA' },
  { city: 'Chicago', state: 'Illinois', country: 'USA' },
  { city: 'Detroit', state: 'Michigan', country: 'USA' },
  { city: 'Minneapolis', state: 'Minnesota', country: 'USA' },
  { city: 'New York', state: 'New York', country: 'USA' },
];

interface LocalResult {
  city: string;
  state: string;
  keyword: string;
  organicResults: any[];
  localResults: any[];
}

async function runLocalSEOAnalysis() {
  console.log('🔍 Starting Local SEO Analysis for The Hockey Directory\n');
  console.log(`Analyzing ${targetCities.length} major hockey markets\n`);

  // Create client with explicit credentials from environment
  const client = new DataForSEOClient({
    login: process.env.DATAFORSEO_LOGIN!,
    password: process.env.DATAFORSEO_PASSWORD!,
  });

  const allResults: LocalResult[] = [];

  for (const location of targetCities) {
    const { city, state, country } = location;
    const keyword = `hockey advisor ${city}`;
    const locationString = country === 'Canada'
      ? `${city}, ${state}, Canada`
      : `${city}, ${state}, United States`;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📍 Analyzing: ${city}, ${state}`);
    console.log(`   Keyword: "${keyword}"`);
    console.log(`${'='.repeat(80)}\n`);

    try {
      // Get organic SERP results
      console.log('🔎 Fetching organic search results...');
      const serpData = await client.getSerpData(keyword, locationString);

      let organicResults: any[] = [];

      if (serpData.tasks && serpData.tasks[0]?.result) {
        const results = serpData.tasks[0].result;
        if (results && results.length > 0 && results[0].items) {
          organicResults = results[0].items
            .filter((item: any) => item.type === 'organic')
            .slice(0, 10);

          console.log(`✅ Found ${organicResults.length} organic results\n`);

          organicResults.forEach((item: any, index: number) => {
            console.log(`${(index + 1).toString().padStart(2)}. ${item.title || 'No title'}`);
            console.log(`    ${item.url || 'No URL'}`);
            console.log(`    ${(item.description || '').substring(0, 80)}...\n`);
          });
        }
      }

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get local pack results (Google Maps)
      console.log('📍 Fetching local pack results...');
      const localData = await client.getLocalSearchResults(keyword, locationString);

      let localResults: any[] = [];

      if (localData.tasks && localData.tasks[0]?.result) {
        const results = localData.tasks[0].result;
        if (results && results.length > 0 && results[0].items) {
          localResults = results[0].items.slice(0, 10);

          if (localResults.length > 0) {
            console.log(`✅ Found ${localResults.length} local results\n`);

            localResults.forEach((item: any, index: number) => {
              console.log(`${(index + 1).toString().padStart(2)}. ${item.title || 'No title'}`);
              if (item.address) console.log(`    📍 ${item.address}`);
              if (item.rating) console.log(`    ⭐ ${item.rating.value} (${item.rating.votes_count} reviews)`);
              if (item.phone) console.log(`    📞 ${item.phone}`);
              console.log();
            });
          } else {
            console.log('⚠️  No local results found\n');
          }
        }
      }

      allResults.push({
        city,
        state,
        keyword,
        organicResults,
        localResults,
      });

      // Delay between cities
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
      console.error(`❌ Error analyzing ${city}:`, error);
    }
  }

  // Generate summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 LOCAL SEO ANALYSIS SUMMARY\n');

  console.log(`Cities Analyzed: ${allResults.length}`);
  console.log(`Total Organic Results: ${allResults.reduce((sum, r) => sum + r.organicResults.length, 0)}`);
  console.log(`Total Local Results: ${allResults.reduce((sum, r) => sum + r.localResults.length, 0)}\n`);

  console.log('Competition by City:');
  console.log('-'.repeat(80));

  allResults.forEach(result => {
    const organicCount = result.organicResults.length;
    const localCount = result.localResults.length;
    const competition = localCount > 0 ? 'High' : organicCount > 5 ? 'Medium' : 'Low';

    console.log(`${result.city.padEnd(20)} Organic: ${organicCount.toString().padStart(2)}  Local: ${localCount.toString().padStart(2)}  Competition: ${competition}`);
  });

  // Identify opportunities
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 OPPORTUNITIES\n');

  const lowCompetition = allResults.filter(r => r.localResults.length === 0);

  if (lowCompetition.length > 0) {
    console.log('🎯 Low Competition Markets (No Local Pack Results):');
    lowCompetition.forEach(r => {
      console.log(`   • ${r.city}, ${r.state} - Great opportunity for local SEO`);
    });
  }

  const highCompetition = allResults.filter(r => r.localResults.length >= 5);

  if (highCompetition.length > 0) {
    console.log('\n🏆 High Competition Markets (Strong Local Pack):');
    highCompetition.forEach(r => {
      console.log(`   • ${r.city}, ${r.state} - ${r.localResults.length} local competitors`);
    });
  }

  // Find unique domains appearing across multiple cities
  const domainCounts = new Map<string, number>();

  allResults.forEach(result => {
    result.organicResults.forEach(item => {
      try {
        const domain = new URL(item.url).hostname.replace('www.', '');
        domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
      } catch (e) {
        // Invalid URL
      }
    });
  });

  const multiCityDomains = Array.from(domainCounts.entries())
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1]);

  if (multiCityDomains.length > 0) {
    console.log('\n🌐 National Competitors (appear in multiple cities):');
    multiCityDomains.forEach(([domain, count]) => {
      console.log(`   • ${domain} - ${count} cities`);
    });
  }

  // Save to file
  const timestamp = new Date().toISOString().split('T')[0];
  const outputDir = path.join(process.cwd(), 'seo-research');
  const outputFile = path.join(outputDir, `local-seo-analysis-${timestamp}.json`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify({
    date: timestamp,
    citiesAnalyzed: allResults.length,
    results: allResults,
  }, null, 2));

  console.log(`\n✅ Report saved to: ${outputFile}`);

  // Recommendations
  console.log('\n' + '='.repeat(80));
  console.log('\n📝 RECOMMENDATIONS\n');

  console.log('1. Target low-competition cities first for quick wins');
  console.log('2. Create city-specific landing pages for each market');
  console.log('3. Encourage advisors to claim Google Business Profiles');
  console.log('4. Build local backlinks and citations');
  console.log('5. Include city names in title tags and meta descriptions');
  console.log('6. Create location-specific content and blog posts\n');

  console.log('✅ Local SEO analysis complete!\n');
}

// Run if called directly
if (require.main === module) {
  runLocalSEOAnalysis()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { runLocalSEOAnalysis };
