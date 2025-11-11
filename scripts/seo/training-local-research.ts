/**
 * Training Local Research Script
 * Analyzes local competition for hockey training in major cities
 */

// Load environment variables first
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

import { DataForSEOClient } from '../../lib/seo/dataforseo-client';

// Major cities to analyze
const targetCities = [
  { city: 'Toronto', state: 'Ontario', country: 'Canada', locationCode: 9034 },
  { city: 'Vancouver', state: 'British Columbia', country: 'Canada', locationCode: 9007 },
  { city: 'Montreal', state: 'Quebec', country: 'Canada', locationCode: 9014 },
  { city: 'Boston', state: 'Massachusetts', country: 'USA', locationCode: 1014037 },
  { city: 'Chicago', state: 'Illinois', country: 'USA', locationCode: 1014044 },
  { city: 'Detroit', state: 'Michigan', country: 'USA', locationCode: 1023984 },
  { city: 'Minneapolis', state: 'Minnesota', country: 'USA', locationCode: 1020638 },
  { city: 'New York', state: 'New York', country: 'USA', locationCode: 1023191 },
];

interface CityAnalysis {
  city: string;
  state: string;
  country: string;
  keywords: KeywordAnalysis[];
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  opportunityScore: number;
}

interface KeywordAnalysis {
  keyword: string;
  organicCount: number;
  localPackCount: number;
  directories: number;
  businesses: number;
  articles: number;
}

async function analyzeCity(
  client: DataForSEOClient,
  location: typeof targetCities[0]
): Promise<CityAnalysis> {
  const { city, state, country } = location;
  const locationString = country === 'Canada'
    ? `${city}, ${state}, Canada`
    : `${city}, ${state}, United States`;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📍 Analyzing: ${city}, ${state}, ${country}`);
  console.log(`${'='.repeat(80)}\n`);

  const keywords = [
    `${city} hockey training`,
    `power skating coach ${city}`,
  ];

  const keywordAnalyses: KeywordAnalysis[] = [];

  for (const keyword of keywords) {
    console.log(`🔎 Searching: "${keyword}"`);

    try {
      // Get SERP data
      const serpData = await client.getSerpData(keyword, locationString);

      let organicCount = 0;
      let localPackCount = 0;
      let directories = 0;
      let businesses = 0;
      let articles = 0;

      if (serpData.tasks && serpData.tasks[0]?.result) {
        const results = serpData.tasks[0].result;
        if (results && results.length > 0 && results[0].items) {
          const items = results[0].items;

          // Count organic results
          const organicResults = items.filter((item: any) => item.type === 'organic');
          organicCount = organicResults.length;

          // Count local pack results
          const localPack = items.filter((item: any) => item.type === 'local_pack');
          if (localPack.length > 0 && localPack[0].items) {
            localPackCount = localPack[0].items.length;
          }

          // Categorize top 10 organic results
          organicResults.slice(0, 10).forEach((item: any) => {
            const url = item.url?.toLowerCase() || '';
            const title = item.title?.toLowerCase() || '';
            const domain = item.domain?.toLowerCase() || '';

            // Check if it's a directory
            if (
              domain.includes('yelp') ||
              domain.includes('yellowpages') ||
              domain.includes('directory') ||
              domain.includes('findglocal') ||
              domain.includes('manta') ||
              title.includes('directory') ||
              title.includes('find') ||
              title.includes('list of')
            ) {
              directories++;
            }
            // Check if it's an individual business
            else if (
              title.includes('hockey') ||
              title.includes('skating') ||
              title.includes('training') ||
              title.includes('academy') ||
              title.includes('coach')
            ) {
              businesses++;
            }
            // Otherwise it's likely an article/content
            else {
              articles++;
            }
          });

          console.log(`   ✅ Organic: ${organicCount} | Local Pack: ${localPackCount}`);
          console.log(`   📊 Directories: ${directories} | Businesses: ${businesses} | Articles: ${articles}`);
        }
      }

      keywordAnalyses.push({
        keyword,
        organicCount,
        localPackCount,
        directories,
        businesses,
        articles,
      });

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
      console.error(`   ❌ Error analyzing "${keyword}":`, error);
      keywordAnalyses.push({
        keyword,
        organicCount: 0,
        localPackCount: 0,
        directories: 0,
        businesses: 0,
        articles: 0,
      });
    }
  }

  // Calculate competition level
  const avgDirectories = keywordAnalyses.reduce((sum, k) => sum + k.directories, 0) / keywordAnalyses.length;
  const avgBusinesses = keywordAnalyses.reduce((sum, k) => sum + k.businesses, 0) / keywordAnalyses.length;
  const avgLocalPack = keywordAnalyses.reduce((sum, k) => sum + k.localPackCount, 0) / keywordAnalyses.length;

  let competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  let opportunityScore: number;

  // Competition scoring logic
  const competitionScore = (avgDirectories * 2) + (avgBusinesses * 1.5) + (avgLocalPack * 1);

  if (competitionScore < 5) {
    competitionLevel = 'LOW';
    opportunityScore = 10;
  } else if (competitionScore < 10) {
    competitionLevel = 'MEDIUM';
    opportunityScore = 5;
  } else {
    competitionLevel = 'HIGH';
    opportunityScore = 2;
  }

  console.log(`\n   🎯 Competition Level: ${competitionLevel}`);
  console.log(`   💰 Opportunity Score: ${opportunityScore}/10\n`);

  return {
    city,
    state,
    country,
    keywords: keywordAnalyses,
    competitionLevel,
    opportunityScore,
  };
}

async function runTrainingLocalResearch() {
  console.log('🔍 Starting Hockey Training Local Research\n');
  console.log(`Analyzing ${targetCities.length} major hockey markets\n`);

  // Create client with explicit credentials from environment
  const client = new DataForSEOClient({
    login: process.env.DATAFORSEO_LOGIN!,
    password: process.env.DATAFORSEO_PASSWORD!,
  });

  const allCityAnalyses: CityAnalysis[] = [];

  for (const location of targetCities) {
    try {
      const analysis = await analyzeCity(client, location);
      allCityAnalyses.push(analysis);
    } catch (error) {
      console.error(`❌ Error analyzing ${location.city}:`, error);
    }
  }

  // Sort cities by opportunity score
  allCityAnalyses.sort((a, b) => b.opportunityScore - a.opportunityScore);

  // Display summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 LOCAL COMPETITION SUMMARY\n');

  console.log('Cities Ranked by Opportunity (Best to Worst):\n');

  allCityAnalyses.forEach((city, i) => {
    const emoji = city.competitionLevel === 'LOW' ? '🟢' : city.competitionLevel === 'MEDIUM' ? '🟡' : '🔴';
    console.log(`${(i + 1).toString().padStart(2)}. ${emoji} ${city.city.padEnd(15)} ${city.state.padEnd(20)} ${city.competitionLevel.padEnd(8)} (Score: ${city.opportunityScore}/10)`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 KEY INSIGHTS\n');

  const lowCompCities = allCityAnalyses.filter(c => c.competitionLevel === 'LOW');
  const mediumCompCities = allCityAnalyses.filter(c => c.competitionLevel === 'MEDIUM');
  const highCompCities = allCityAnalyses.filter(c => c.competitionLevel === 'HIGH');

  console.log(`🟢 LOW Competition Cities: ${lowCompCities.length}`);
  if (lowCompCities.length > 0) {
    console.log(`   ${lowCompCities.map(c => c.city).join(', ')}`);
  }

  console.log(`\n🟡 MEDIUM Competition Cities: ${mediumCompCities.length}`);
  if (mediumCompCities.length > 0) {
    console.log(`   ${mediumCompCities.map(c => c.city).join(', ')}`);
  }

  console.log(`\n🔴 HIGH Competition Cities: ${highCompCities.length}`);
  if (highCompCities.length > 0) {
    console.log(`   ${highCompCities.map(c => c.city).join(', ')}`);
  }

  // Calculate averages across all cities
  const totalDirectories = allCityAnalyses.reduce((sum, city) => {
    return sum + city.keywords.reduce((keySum, kw) => keySum + kw.directories, 0);
  }, 0);
  const totalBusinesses = allCityAnalyses.reduce((sum, city) => {
    return sum + city.keywords.reduce((keySum, kw) => keySum + kw.businesses, 0);
  }, 0);
  const totalArticles = allCityAnalyses.reduce((sum, city) => {
    return sum + city.keywords.reduce((keySum, kw) => keySum + kw.articles, 0);
  }, 0);
  const totalLocalPacks = allCityAnalyses.reduce((sum, city) => {
    return sum + city.keywords.reduce((keySum, kw) => keySum + (kw.localPackCount > 0 ? 1 : 0), 0);
  }, 0);

  console.log('\n📈 SERP Composition Across All Cities:\n');
  const totalResults = totalDirectories + totalBusinesses + totalArticles;
  if (totalResults > 0) {
    console.log(`   Directories: ${totalDirectories} (${((totalDirectories / totalResults) * 100).toFixed(1)}%)`);
    console.log(`   Individual Businesses: ${totalBusinesses} (${((totalBusinesses / totalResults) * 100).toFixed(1)}%)`);
    console.log(`   Articles/Content: ${totalArticles} (${((totalArticles / totalResults) * 100).toFixed(1)}%)`);
    console.log(`   Cities with Local Pack: ${totalLocalPacks}/${allCityAnalyses.length * 2} searches`);
  }

  // Save to file
  const timestamp = new Date().toISOString().split('T')[0];
  const outputDir = path.join(process.cwd(), 'seo-research');
  const outputFile = path.join(outputDir, `training-local-${timestamp}.json`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify({
    date: timestamp,
    totalCities: allCityAnalyses.length,
    cities: allCityAnalyses,
    summary: {
      lowCompetitionCities: lowCompCities.length,
      mediumCompetitionCities: mediumCompCities.length,
      highCompetitionCities: highCompCities.length,
      avgDirectoriesPerCity: totalDirectories / (allCityAnalyses.length * 2),
      avgBusinessesPerCity: totalBusinesses / (allCityAnalyses.length * 2),
      citiesWithLocalPack: totalLocalPacks,
    },
  }, null, 2));

  console.log(`\n✅ Report saved to: ${outputFile}`);

  console.log('\n' + '='.repeat(80));
  console.log('\n🎯 RECOMMENDATIONS\n');

  console.log('1. PRIORITY CITIES (Start Here):\n');
  lowCompCities.slice(0, 3).forEach((city, i) => {
    console.log(`   ${i + 1}. ${city.city}, ${city.state} - Low competition, high opportunity`);
  });

  console.log('\n2. CONTENT STRATEGY:\n');
  if (totalDirectories < totalBusinesses) {
    console.log('   ✅ Directory sites are NOT dominating - good opportunity for a training directory!');
  } else {
    console.log('   ⚠️  Directory sites are common - need strong content and SEO to compete');
  }

  console.log('\n3. LOCAL SEO STRATEGY:\n');
  if (totalLocalPacks < allCityAnalyses.length) {
    console.log('   ✅ Local packs not saturated - opportunity for local SEO optimization');
  } else {
    console.log('   ⚠️  Strong local pack presence - focus on organic rankings');
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Training local research complete!\n');
}

// Run if called directly
if (require.main === module) {
  runTrainingLocalResearch()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { runTrainingLocalResearch };
