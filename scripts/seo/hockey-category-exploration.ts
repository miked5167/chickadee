/**
 * Hockey Category Exploration Script
 * Discovers new hockey-related categories beyond Training, Tournaments, Prep Schools
 * Analyzes search volume, competition, and monetization potential
 */

// Load environment variables first
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

import { DataForSEOClient } from '../../lib/seo/dataforseo-client';

interface CategoryKeyword {
  keyword: string;
  searchVolume: number;
  searchVolumeUS: number;
  searchVolumeCA: number;
  competition: number;
  competitionUS: number;
  competitionCA: number;
  cpc: number;
  cpcUS: number;
  cpcCA: number;
  category: string;
}

interface CategorySummary {
  name: string;
  description: string;
  monetizationPotential: 'HIGH' | 'MEDIUM' | 'LOW';
  monetizationMethods: string[];
  keywords: CategoryKeyword[];
  totalVolume: number;
  avgCPC: number;
  opportunity: string;
}

async function exploreCategoryKeywords(
  client: DataForSEOClient,
  keywords: string[],
  categoryName: string
): Promise<CategoryKeyword[]> {
  console.log(`\n🔎 Researching ${categoryName}...`);

  const results: CategoryKeyword[] = [];

  // Get US data
  console.log('  🇺🇸 Fetching US data...');
  const usResponse = await client.getKeywordData(keywords, 2840);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get Canada data
  console.log('  🇨🇦 Fetching Canada data...');
  const caResponse = await client.getKeywordData(keywords, 2124);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Create data maps
  const usDataMap = new Map<string, any>();
  if (usResponse.tasks && usResponse.tasks[0]?.result) {
    for (const item of usResponse.tasks[0].result) {
      usDataMap.set(item.keyword, item);
    }
  }

  const caDataMap = new Map<string, any>();
  if (caResponse.tasks && caResponse.tasks[0]?.result) {
    for (const item of caResponse.tasks[0].result) {
      caDataMap.set(item.keyword, item);
    }
  }

  // Combine data
  for (const keyword of keywords) {
    const usData = usDataMap.get(keyword);
    const caData = caDataMap.get(keyword);

    const searchVolumeUS = usData?.search_volume || 0;
    const searchVolumeCA = caData?.search_volume || 0;
    const searchVolume = searchVolumeUS + searchVolumeCA;

    const competitionUS = usData?.competition || 0;
    const competitionCA = caData?.competition || 0;
    const competition = (competitionUS + competitionCA) / 2;

    const cpcUS = usData?.cpc || 0;
    const cpcCA = caData?.cpc || 0;
    const cpc = (cpcUS + cpcCA) / 2;

    results.push({
      keyword,
      searchVolume,
      searchVolumeUS,
      searchVolumeCA,
      competition,
      competitionUS,
      competitionCA,
      cpc,
      cpcUS,
      cpcCA,
      category: categoryName,
    });
  }

  const totalVolume = results.reduce((sum, k) => sum + k.searchVolume, 0);
  console.log(`  ✅ Total volume: ${totalVolume.toLocaleString()}/month\n`);

  return results;
}

async function runCategoryExploration() {
  console.log('🔍 Hockey Category Exploration - Finding New Opportunities\n');
  console.log('Analyzing US + Canada markets for monetization potential\n');
  console.log('='.repeat(80));

  const client = new DataForSEOClient({
    login: process.env.DATAFORSEO_LOGIN!,
    password: process.env.DATAFORSEO_PASSWORD!,
  });

  // Define categories to explore
  const categories = [
    {
      name: 'Hockey Equipment',
      description: 'Hockey sticks, skates, protective gear',
      keywords: [
        'hockey equipment',
        'hockey sticks',
        'hockey skates',
        'hockey gear',
        'best hockey stick',
        'hockey helmet',
      ],
      monetizationPotential: 'HIGH' as const,
      monetizationMethods: ['Affiliate links', 'Product reviews', 'Equipment guides', 'Amazon Associates'],
    },
    {
      name: 'Hockey Camps',
      description: 'Summer camps, day camps, overnight camps',
      keywords: [
        'hockey camp',
        'summer hockey camp',
        'hockey day camp',
        'overnight hockey camp',
        'youth hockey camp',
      ],
      monetizationPotential: 'HIGH' as const,
      monetizationMethods: ['Listing fees', 'Featured placements', 'Registration referrals', 'Lead generation'],
    },
    {
      name: 'Hockey Leagues',
      description: 'Youth leagues, adult leagues, recreational leagues',
      keywords: [
        'hockey league',
        'youth hockey league',
        'adult hockey league',
        'beer league hockey',
        'rec hockey league',
      ],
      monetizationPotential: 'MEDIUM' as const,
      monetizationMethods: ['Listing fees', 'League software partnerships', 'Team registration'],
    },
    {
      name: 'Hockey Arenas & Rinks',
      description: 'Ice rinks, training facilities',
      keywords: [
        'hockey rink near me',
        'ice rink near me',
        'hockey arena',
        'public skating',
        'stick and puck',
      ],
      monetizationPotential: 'MEDIUM' as const,
      monetizationMethods: ['Advertising', 'Facility partnerships', 'Ice time booking referrals'],
    },
    {
      name: 'Hockey Coaching',
      description: 'Private coaches, coaching certifications',
      keywords: [
        'hockey coach',
        'private hockey coach',
        'hockey coaching certification',
        'hockey coach near me',
        'goalie coach',
      ],
      monetizationPotential: 'HIGH' as const,
      monetizationMethods: ['Coach listings', 'Booking fees', 'Certification courses'],
    },
    {
      name: 'Hockey Tryouts',
      description: 'Team tryouts, tryout preparation',
      keywords: [
        'hockey tryouts',
        'aaa hockey tryouts',
        'hockey tryout tips',
        'hockey team tryouts',
      ],
      monetizationPotential: 'MEDIUM' as const,
      monetizationMethods: ['Tryout calendar ads', 'Preparation program affiliates'],
    },
    {
      name: 'Hockey Scholarships',
      description: 'College scholarships, financial aid',
      keywords: [
        'hockey scholarships',
        'college hockey scholarships',
        'hockey scholarship opportunities',
        'ncaa hockey scholarships',
      ],
      monetizationPotential: 'LOW' as const,
      monetizationMethods: ['Recruiting service partnerships', 'Information products'],
    },
    {
      name: 'Hockey Recruiting',
      description: 'College recruiting, recruiting services',
      keywords: [
        'hockey recruiting',
        'college hockey recruiting',
        'hockey recruiting services',
        'hockey recruiting videos',
      ],
      monetizationPotential: 'HIGH' as const,
      monetizationMethods: ['Service referrals', 'Profile creation fees', 'Video services'],
    },
    {
      name: 'Hockey Apparel',
      description: 'Jerseys, hoodies, team gear',
      keywords: [
        'hockey jerseys',
        'hockey apparel',
        'custom hockey jerseys',
        'hockey team apparel',
      ],
      monetizationPotential: 'HIGH' as const,
      monetizationMethods: ['Affiliate links', 'Custom gear partnerships', 'Team store platform'],
    },
    {
      name: 'Hockey Events',
      description: 'Showcases, combines, special events',
      keywords: [
        'hockey showcase',
        'hockey combine',
        'hockey events',
        'hockey prospect camp',
      ],
      monetizationPotential: 'MEDIUM' as const,
      monetizationMethods: ['Event listings', 'Registration fees', 'Sponsorships'],
    },
    {
      name: 'Hockey Analytics & Stats',
      description: 'Player stats, team stats, analytics tools',
      keywords: [
        'hockey stats',
        'hockey analytics',
        'hockey player stats',
        'hockey statistics',
      ],
      monetizationPotential: 'LOW' as const,
      monetizationMethods: ['Subscription services', 'Data partnerships'],
    },
    {
      name: 'Hockey Player Profiles',
      description: 'Player resumes, recruiting profiles',
      keywords: [
        'hockey player profile',
        'hockey resume',
        'hockey recruiting profile',
        'hockey player website',
      ],
      monetizationPotential: 'HIGH' as const,
      monetizationMethods: ['Profile creation fees', 'Premium features', 'Video hosting', 'Resume templates'],
    },
  ];

  const allCategorySummaries: CategorySummary[] = [];

  for (const category of categories) {
    const keywords = await exploreCategoryKeywords(
      client,
      category.keywords,
      category.name
    );

    const totalVolume = keywords.reduce((sum, k) => sum + k.searchVolume, 0);
    const avgCPC = keywords.reduce((sum, k) => sum + k.cpc, 0) / keywords.length;

    // Generate opportunity assessment
    let opportunity = '';
    if (totalVolume > 5000 && avgCPC > 2) {
      opportunity = '🟢 EXCELLENT - High volume + high CPC';
    } else if (totalVolume > 3000) {
      opportunity = '🟡 GOOD - Strong search volume';
    } else if (avgCPC > 3) {
      opportunity = '🟡 GOOD - High commercial value';
    } else {
      opportunity = '⚪ MODERATE - Consider as secondary';
    }

    allCategorySummaries.push({
      name: category.name,
      description: category.description,
      monetizationPotential: category.monetizationPotential,
      monetizationMethods: category.monetizationMethods,
      keywords,
      totalVolume,
      avgCPC,
      opportunity,
    });
  }

  // Display results
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 CATEGORY EXPLORATION RESULTS\n');
  console.log('Sorted by Total Search Volume (US + Canada)\n');

  // Sort by total volume
  allCategorySummaries.sort((a, b) => b.totalVolume - a.totalVolume);

  allCategorySummaries.forEach((category, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${category.name}`);
    console.log(`    ${category.opportunity}`);
    console.log(`    Volume: ${category.totalVolume.toLocaleString()}/month | Avg CPC: $${category.avgCPC.toFixed(2)}`);
    console.log(`    Monetization: ${category.monetizationPotential} potential`);
    console.log(`    Methods: ${category.monetizationMethods.slice(0, 2).join(', ')}...\n`);
  });

  // Detailed breakdown
  console.log('='.repeat(80));
  console.log('\n📋 DETAILED CATEGORY ANALYSIS\n');

  allCategorySummaries.forEach(category => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`\n🎯 ${category.name.toUpperCase()}`);
    console.log(`${category.description}\n`);
    console.log(`Total Volume: ${category.totalVolume.toLocaleString()}/month`);
    console.log(`Average CPC: $${category.avgCPC.toFixed(2)}`);
    console.log(`Monetization: ${category.monetizationPotential} potential`);
    console.log(`\nMonetization Methods:`);
    category.monetizationMethods.forEach(method => {
      console.log(`  • ${method}`);
    });

    console.log(`\n${category.opportunity}\n`);

    console.log(`${'Keyword'.padEnd(35)} ${'Total'.padStart(7)} ${'US'.padStart(7)} ${'CA'.padStart(7)} CPC`);
    console.log('-'.repeat(70));

    category.keywords
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .forEach(kw => {
        console.log(
          `${kw.keyword.padEnd(35)} ${kw.searchVolume.toString().padStart(7)} ${kw.searchVolumeUS.toString().padStart(7)} ${kw.searchVolumeCA.toString().padStart(7)} $${kw.cpc.toFixed(2)}`
        );
      });
  });

  // Save to file
  const timestamp = new Date().toISOString().split('T')[0];
  const outputDir = path.join(process.cwd(), 'seo-research');
  const outputFile = path.join(outputDir, `hockey-categories-${timestamp}.json`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    outputFile,
    JSON.stringify(
      {
        date: timestamp,
        totalCategories: allCategorySummaries.length,
        categories: allCategorySummaries,
        summary: {
          totalSearchVolume: allCategorySummaries.reduce((sum, c) => sum + c.totalVolume, 0),
          highMonetizationCategories: allCategorySummaries.filter(
            c => c.monetizationPotential === 'HIGH'
          ).length,
          topCategories: allCategorySummaries.slice(0, 5).map(c => c.name),
        },
      },
      null,
      2
    )
  );

  console.log(`\n\n✅ Report saved to: ${outputFile}`);
  console.log('\n' + '='.repeat(80));
  console.log('\n🎯 TOP RECOMMENDATIONS\n');

  const highMonetization = allCategorySummaries.filter(
    c => c.monetizationPotential === 'HIGH' && c.totalVolume > 2000
  );

  console.log('Categories with HIGH monetization potential + strong volume:\n');
  highMonetization.forEach((cat, i) => {
    console.log(`${i + 1}. ${cat.name}`);
    console.log(`   ${cat.totalVolume.toLocaleString()} searches/month`);
    console.log(`   Primary methods: ${cat.monetizationMethods.slice(0, 2).join(', ')}\n`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Category exploration complete!\n');
}

// Run if called directly
if (require.main === module) {
  runCategoryExploration()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { runCategoryExploration };
