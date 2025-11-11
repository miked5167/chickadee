/**
 * Hockey Stores Near Me - Local Retail Research
 * Researches hockey store/shop keywords and local search opportunities
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

import { DataForSEOClient } from '../../lib/seo/dataforseo-client';

async function runHockeyStoresResearch() {
  console.log('🏪 Starting Hockey Stores Near Me Research\n');

  const client = new DataForSEOClient({
    login: process.env.DATAFORSEO_LOGIN!,
    password: process.env.DATAFORSEO_PASSWORD!,
  });

  // Hockey store/shop keywords
  const storeKeywords = [
    'hockey store near me',
    'hockey shop near me',
    'hockey equipment store',
    'hockey pro shop',
    'where to buy hockey equipment',
    'hockey store',
    'hockey shop',
    'local hockey store',
    'hockey retailers',
    'hockey gear store',
  ];

  console.log('📊 Analyzing hockey store keywords...\n');

  try {
    // Get keyword data
    const keywordDataResponse = await client.getKeywordData(storeKeywords);

    const results: any[] = [];

    if (keywordDataResponse.tasks && keywordDataResponse.tasks[0]?.result) {
      const keywordResults = keywordDataResponse.tasks[0].result;

      for (const item of keywordResults) {
        const keyword = item.keyword;
        const searchVolume = item.search_volume || 0;
        const competition = item.competition || 0;
        const cpc = item.cpc || 0;

        results.push({
          keyword,
          searchVolume,
          searchVolumeUS: searchVolume,
          searchVolumeCA: 0,
          competition: competition > 0.7 ? 'HIGH' : competition > 0.4 ? 'MEDIUM' : 'LOW',
          competitionUS: competition > 0.7 ? 'HIGH' : competition > 0.4 ? 'MEDIUM' : 'LOW',
          competitionCA: 'UNKNOWN',
          cpc,
          cpcUS: cpc,
          cpcCA: 0,
          category: 'Hockey Stores & Retail'
        });

        console.log(`\n📌 ${keyword}`);
        console.log(`   Search Volume: ${searchVolume.toLocaleString()}/month`);
        console.log(`   Competition: ${(competition * 100).toFixed(1)}%`);
        console.log(`   CPC: $${cpc.toFixed(2)}`);
      }
    }

    // Calculate totals
    const totalVolume = results.reduce((sum, k) => sum + k.searchVolume, 0);
    const avgCPC = results.reduce((sum, k) => sum + k.cpc, 0) / results.length;

    // Create category object
    const category = {
      name: 'Hockey Stores & Retail',
      description: 'Local hockey stores, pro shops, equipment retailers',
      monetizationPotential: 'HIGH',
      monetizationMethods: [
        'Store directory listings',
        'Featured store placements',
        'Affiliate partnerships with online retailers',
        'Click-to-call/directions revenue',
        'Local advertising'
      ],
      keywords: results.sort((a, b) => b.searchVolume - a.searchVolume),
      totalVolume,
      avgCPC,
      opportunity: totalVolume > 10000 ? '🟢 EXCELLENT - High volume & local intent' :
                   totalVolume > 5000 ? '🟡 GOOD - Strong search volume' :
                   '⚪ MODERATE - Consider as secondary'
    };

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 HOCKEY STORES RESEARCH SUMMARY\n');
    console.log(`Total Keywords: ${results.length}`);
    console.log(`Total Search Volume: ${totalVolume.toLocaleString()}/month`);
    console.log(`Average CPC: $${avgCPC.toFixed(2)}`);
    console.log(`Opportunity: ${category.opportunity}`);

    // Load existing categories file
    const timestamp = new Date().toISOString().split('T')[0];
    const outputDir = path.join(process.cwd(), 'seo-research');
    const categoriesFile = path.join(outputDir, `hockey-categories-${timestamp}.json`);

    let categoriesData: any;

    if (fs.existsSync(categoriesFile)) {
      console.log('\n📄 Loading existing categories file...');
      categoriesData = JSON.parse(fs.readFileSync(categoriesFile, 'utf-8'));

      // Check if Hockey Stores category already exists
      const existingIndex = categoriesData.categories.findIndex((c: any) => c.name === 'Hockey Stores & Retail');

      if (existingIndex >= 0) {
        console.log('✏️  Updating existing Hockey Stores & Retail category...');
        categoriesData.categories[existingIndex] = category;
      } else {
        console.log('➕ Adding new Hockey Stores & Retail category...');
        categoriesData.categories.push(category);
        categoriesData.totalCategories = categoriesData.categories.length;
      }

      // Update summary
      categoriesData.summary.totalSearchVolume = categoriesData.categories.reduce(
        (sum: number, c: any) => sum + c.totalVolume, 0
      );

      // Update top categories
      const sortedByVolume = [...categoriesData.categories]
        .sort((a: any, b: any) => b.totalVolume - a.totalVolume)
        .slice(0, 5);
      categoriesData.summary.topCategories = sortedByVolume.map((c: any) => c.name);

    } else {
      console.log('\n📄 Creating new categories file...');
      categoriesData = {
        date: timestamp,
        totalCategories: 1,
        categories: [category],
        summary: {
          totalSearchVolume: totalVolume,
          highMonetizationCategories: 1,
          topCategories: ['Hockey Stores & Retail']
        }
      };
    }

    // Save updated file
    fs.writeFileSync(categoriesFile, JSON.stringify(categoriesData, null, 2));
    console.log(`\n✅ Updated categories file: ${categoriesFile}`);

    // Print recommendations
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 KEY INSIGHTS\n');

    const nearMeKeywords = results.filter(k => k.keyword.includes('near me'));
    if (nearMeKeywords.length > 0) {
      console.log('📍 Local Search Opportunity:');
      nearMeKeywords.forEach(k => {
        console.log(`   • ${k.keyword}: ${k.searchVolume.toLocaleString()}/month`);
      });
    }

    const lowCompKeywords = results.filter(k => k.competition === 'LOW' && k.searchVolume > 100);
    if (lowCompKeywords.length > 0) {
      console.log('\n🎯 Low Competition Opportunities:');
      lowCompKeywords.forEach(k => {
        console.log(`   • ${k.keyword}: ${k.searchVolume.toLocaleString()}/month`);
      });
    }

    console.log('\n💰 Monetization Ideas:');
    console.log('   • Create a "Find Hockey Stores Near You" directory page');
    console.log('   • Partner with local stores for featured listings');
    console.log('   • Add affiliate links to major online retailers (Pure Hockey, Hockey Monkey)');
    console.log('   • Implement click-to-call and directions tracking');
    console.log('   • Charge for premium store profiles with photos, hours, inventory');

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Hockey stores research complete!\n');

  } catch (error) {
    console.error('❌ Error during research:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runHockeyStoresResearch()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { runHockeyStoresResearch };
