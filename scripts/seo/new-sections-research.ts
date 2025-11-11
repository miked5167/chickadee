/**
 * New Sections Keyword Research Script
 * Analyzes keyword opportunities for Hockey Training, Prep Schools, and Tournaments
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
  searchVolumeUS: number;
  searchVolumeCA: number;
  competition: number;
  competitionUS: number;
  competitionCA: number;
  cpc: number;
  cpcUS: number;
  cpcCA: number;
  section: 'training' | 'prep-schools' | 'tournaments';
}

interface SectionSummary {
  name: string;
  keywords: KeywordData[];
  totalVolume: number;
  avgCompetition: number;
  avgCPC: number;
}

async function runNewSectionsResearch() {
  console.log('🔍 Starting Keyword Research for New Content Sections\n');

  // Create client with explicit credentials from environment
  const client = new DataForSEOClient({
    login: process.env.DATAFORSEO_LOGIN!,
    password: process.env.DATAFORSEO_PASSWORD!,
  });

  // Define keywords for each new section
  const trainingKeywords = [
    'hockey training',
    'power skating coach',
    'hockey skills training',
    'hockey development program',
    'skating coach',
    'hockey skills camp',
    'on ice training',
    'hockey shooting coach',
    'hockey goalie training',
  ];

  const prepSchoolKeywords = [
    'hockey prep school',
    'hockey academy',
    'junior hockey prep school',
    'boarding school hockey',
    'hockey boarding school',
    'prep school hockey program',
    'best hockey prep schools',
  ];

  const tournamentKeywords = [
    'hockey tournament',
    'youth hockey tournament',
    'hockey showcase',
    'aaa hockey tournament',
    'hockey tournament near me',
    'elite hockey tournament',
  ];

  const allSeedKeywords = [
    ...trainingKeywords,
    ...prepSchoolKeywords,
    ...tournamentKeywords,
  ];

  console.log(`📊 Analyzing ${allSeedKeywords.length} keywords across 3 sections for US + Canada...\n`);

  try {
    // Get keyword data for United States (location code: 2840)
    console.log('🇺🇸 Fetching US keyword data...');
    const usKeywordDataResponse = await client.getKeywordData(allSeedKeywords, 2840);
    console.log('✅ US data retrieved\n');

    // Delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get keyword data for Canada (location code: 2124)
    console.log('🇨🇦 Fetching Canada keyword data...');
    const caKeywordDataResponse = await client.getKeywordData(allSeedKeywords, 2124);
    console.log('✅ Canada data retrieved\n');

    console.log('='.repeat(80));

    const allKeywords: KeywordData[] = [];

    // Create a map to store US data
    const usDataMap = new Map<string, any>();
    if (usKeywordDataResponse.tasks && usKeywordDataResponse.tasks[0]?.result) {
      const results = usKeywordDataResponse.tasks[0].result;
      for (const item of results) {
        usDataMap.set(item.keyword, item);
      }
    }

    // Create a map to store Canada data
    const caDataMap = new Map<string, any>();
    if (caKeywordDataResponse.tasks && caKeywordDataResponse.tasks[0]?.result) {
      const results = caKeywordDataResponse.tasks[0].result;
      for (const item of results) {
        caDataMap.set(item.keyword, item);
      }
    }

    // Combine data from both countries
    for (const keyword of allSeedKeywords) {
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

      // Determine which section this keyword belongs to
      let section: 'training' | 'prep-schools' | 'tournaments';
      if (trainingKeywords.includes(keyword)) {
        section = 'training';
      } else if (prepSchoolKeywords.includes(keyword)) {
        section = 'prep-schools';
      } else {
        section = 'tournaments';
      }

      allKeywords.push({
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
        section,
      });
    }

    // Organize results by section
    const trainingSummary: SectionSummary = {
      name: 'Hockey Training',
      keywords: allKeywords.filter(k => k.section === 'training'),
      totalVolume: 0,
      avgCompetition: 0,
      avgCPC: 0,
    };

    const prepSchoolSummary: SectionSummary = {
      name: 'Hockey Prep Schools',
      keywords: allKeywords.filter(k => k.section === 'prep-schools'),
      totalVolume: 0,
      avgCompetition: 0,
      avgCPC: 0,
    };

    const tournamentSummary: SectionSummary = {
      name: 'Hockey Tournaments',
      keywords: allKeywords.filter(k => k.section === 'tournaments'),
      totalVolume: 0,
      avgCompetition: 0,
      avgCPC: 0,
    };

    // Calculate summaries
    const sections = [trainingSummary, prepSchoolSummary, tournamentSummary];

    for (const section of sections) {
      section.totalVolume = section.keywords.reduce((sum, k) => sum + k.searchVolume, 0);
      section.avgCompetition = section.keywords.reduce((sum, k) => sum + k.competition, 0) / section.keywords.length;
      section.avgCPC = section.keywords.reduce((sum, k) => sum + k.cpc, 0) / section.keywords.length;
    }

    // Display results by section
    console.log('\n📊 HOCKEY TRAINING SECTION\n');

    const trainTotalUS = trainingSummary.keywords.reduce((sum, k) => sum + k.searchVolumeUS, 0);
    const trainTotalCA = trainingSummary.keywords.reduce((sum, k) => sum + k.searchVolumeCA, 0);

    console.log(`Total Search Volume: ${trainingSummary.totalVolume.toLocaleString()}/month (🇺🇸 ${trainTotalUS.toLocaleString()} + 🇨🇦 ${trainTotalCA.toLocaleString()})`);
    console.log(`Avg Competition: ${(trainingSummary.avgCompetition * 100).toFixed(1)}%`);
    console.log(`Avg CPC: $${trainingSummary.avgCPC.toFixed(2)}\n`);

    console.log(`${'Keyword'.padEnd(35)} ${'Total'.padStart(7)} ${'US'.padStart(7)} ${'CA'.padStart(7)} Comp   CPC`);
    console.log('-'.repeat(85));

    trainingSummary.keywords
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .forEach(kw => {
        console.log(`📌 ${kw.keyword.padEnd(33)} ${kw.searchVolume.toString().padStart(7)} ${kw.searchVolumeUS.toString().padStart(7)} ${kw.searchVolumeCA.toString().padStart(7)} ${(kw.competition * 100).toFixed(0).padStart(3)}%  $${kw.cpc.toFixed(2)}`);
      });

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 HOCKEY PREP SCHOOLS SECTION\n');

    const prepTotalUS = prepSchoolSummary.keywords.reduce((sum, k) => sum + k.searchVolumeUS, 0);
    const prepTotalCA = prepSchoolSummary.keywords.reduce((sum, k) => sum + k.searchVolumeCA, 0);

    console.log(`Total Search Volume: ${prepSchoolSummary.totalVolume.toLocaleString()}/month (🇺🇸 ${prepTotalUS.toLocaleString()} + 🇨🇦 ${prepTotalCA.toLocaleString()})`);
    console.log(`Avg Competition: ${(prepSchoolSummary.avgCompetition * 100).toFixed(1)}%`);
    console.log(`Avg CPC: $${prepSchoolSummary.avgCPC.toFixed(2)}\n`);

    console.log(`${'Keyword'.padEnd(35)} ${'Total'.padStart(7)} ${'US'.padStart(7)} ${'CA'.padStart(7)} Comp   CPC`);
    console.log('-'.repeat(85));

    prepSchoolSummary.keywords
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .forEach(kw => {
        console.log(`📌 ${kw.keyword.padEnd(33)} ${kw.searchVolume.toString().padStart(7)} ${kw.searchVolumeUS.toString().padStart(7)} ${kw.searchVolumeCA.toString().padStart(7)} ${(kw.competition * 100).toFixed(0).padStart(3)}%  $${kw.cpc.toFixed(2)}`);
      });

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 HOCKEY TOURNAMENTS SECTION\n');

    const tournTotalUS = tournamentSummary.keywords.reduce((sum, k) => sum + k.searchVolumeUS, 0);
    const tournTotalCA = tournamentSummary.keywords.reduce((sum, k) => sum + k.searchVolumeCA, 0);

    console.log(`Total Search Volume: ${tournamentSummary.totalVolume.toLocaleString()}/month (🇺🇸 ${tournTotalUS.toLocaleString()} + 🇨🇦 ${tournTotalCA.toLocaleString()})`);
    console.log(`Avg Competition: ${(tournamentSummary.avgCompetition * 100).toFixed(1)}%`);
    console.log(`Avg CPC: $${tournamentSummary.avgCPC.toFixed(2)}\n`);

    console.log(`${'Keyword'.padEnd(35)} ${'Total'.padStart(7)} ${'US'.padStart(7)} ${'CA'.padStart(7)} Comp   CPC`);
    console.log('-'.repeat(85));

    tournamentSummary.keywords
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .forEach(kw => {
        console.log(`📌 ${kw.keyword.padEnd(33)} ${kw.searchVolume.toString().padStart(7)} ${kw.searchVolumeUS.toString().padStart(7)} ${kw.searchVolumeCA.toString().padStart(7)} ${(kw.competition * 100).toFixed(0).padStart(3)}%  $${kw.cpc.toFixed(2)}`);
      });

    // Overall summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 OVERALL SUMMARY\n');

    const totalSearchVolume = allKeywords.reduce((sum, k) => sum + k.searchVolume, 0);
    const totalSearchVolumeUS = allKeywords.reduce((sum, k) => sum + k.searchVolumeUS, 0);
    const totalSearchVolumeCA = allKeywords.reduce((sum, k) => sum + k.searchVolumeCA, 0);

    console.log(`Total Keywords Analyzed: ${allKeywords.length}`);
    console.log(`Total Search Volume (Combined): ${totalSearchVolume.toLocaleString()}/month`);
    console.log(`  🇺🇸 United States: ${totalSearchVolumeUS.toLocaleString()}/month (${((totalSearchVolumeUS / totalSearchVolume) * 100).toFixed(1)}%)`);
    console.log(`  🇨🇦 Canada: ${totalSearchVolumeCA.toLocaleString()}/month (${((totalSearchVolumeCA / totalSearchVolume) * 100).toFixed(1)}%)\n`);

    // Sort sections by total volume
    sections.sort((a, b) => b.totalVolume - a.totalVolume);

    console.log('Sections Ranked by Search Volume:');
    sections.forEach((section, i) => {
      const percentage = (section.totalVolume / totalSearchVolume * 100).toFixed(1);
      console.log(`${i + 1}. ${section.name.padEnd(25)} ${section.totalVolume.toString().padStart(8)} vol  (${percentage}%)  ${(section.avgCompetition * 100).toFixed(0)}% avg comp`);
    });

    // Save to file
    const timestamp = new Date().toISOString().split('T')[0];
    const outputDir = path.join(process.cwd(), 'seo-research');
    const outputFile = path.join(outputDir, `new-sections-keywords-${timestamp}.json`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputFile, JSON.stringify({
      date: timestamp,
      sections: {
        training: trainingSummary,
        prepSchools: prepSchoolSummary,
        tournaments: tournamentSummary,
      },
      totalKeywords: allKeywords.length,
      totalSearchVolume,
      keywords: allKeywords,
    }, null, 2));

    console.log(`\n✅ Report saved to: ${outputFile}`);

    // Generate recommendations
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 RECOMMENDATIONS\n');

    console.log('🎯 Priority Ranking Based on Volume & Competition:\n');

    sections.forEach((section, i) => {
      const score = section.totalVolume / (1 + section.avgCompetition);
      console.log(`${i + 1}. ${section.name}`);
      console.log(`   Volume: ${section.totalVolume.toLocaleString()}/month`);
      console.log(`   Competition: ${(section.avgCompetition * 100).toFixed(1)}%`);
      console.log(`   CPC: $${section.avgCPC.toFixed(2)} (commercial value)`);
      console.log(`   Opportunity Score: ${score.toFixed(0)}\n`);
    });

    // High-volume opportunities per section
    console.log('📈 Top Keywords by Section:\n');

    sections.forEach(section => {
      const topKeyword = section.keywords.sort((a, b) => b.searchVolume - a.searchVolume)[0];
      console.log(`${section.name}: "${topKeyword.keyword}" (${topKeyword.searchVolume.toLocaleString()} vol, ${(topKeyword.competition * 100).toFixed(0)}% comp)`);
    });

    // Low-hanging fruit (high volume, low competition)
    const lowHangingFruit = allKeywords
      .filter(k => k.searchVolume > 100 && k.competition < 0.5)
      .sort((a, b) => b.searchVolume / (1 + a.competition) - a.searchVolume / (1 + b.competition))
      .slice(0, 5);

    if (lowHangingFruit.length > 0) {
      console.log('\n🍎 Low-Hanging Fruit (High Volume + Low Competition):');
      lowHangingFruit.forEach((kw, i) => {
        console.log(`${i + 1}. ${kw.keyword} (${kw.searchVolume.toLocaleString()} vol, ${(kw.competition * 100).toFixed(0)}% comp) [${kw.section}]`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ New sections keyword research complete!\n');

  } catch (error) {
    console.error('❌ Error during keyword research:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runNewSectionsResearch()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { runNewSectionsResearch };
