/**
 * SERP Analysis Script
 * Analyzes what types of content rank for target keywords
 */

// Load environment variables first
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

import { DataForSEOClient } from '../../lib/seo/dataforseo-client';

interface SerpResult {
  position: number;
  title: string;
  url: string;
  domain: string;
  siteType: 'directory' | 'business' | 'article' | 'other';
  description?: string;
}

interface KeywordSerpAnalysis {
  keyword: string;
  totalResults: number;
  results: SerpResult[];
  siteTypeBreakdown: {
    directories: number;
    businesses: number;
    articles: number;
    other: number;
  };
  insights: string[];
}

function categorizeSite(url: string, title: string, domain: string): 'directory' | 'business' | 'article' | 'other' {
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();
  const domainLower = domain.toLowerCase();

  // Check for directory sites
  if (
    domainLower.includes('yelp') ||
    domainLower.includes('yellowpages') ||
    domainLower.includes('directory') ||
    domainLower.includes('findglocal') ||
    domainLower.includes('thumbtack') ||
    domainLower.includes('superpages') ||
    domainLower.includes('manta') ||
    domainLower.includes('angieslist') ||
    domainLower.includes('porch') ||
    titleLower.includes('best') && titleLower.includes('near me') ||
    titleLower.includes('top 10') ||
    titleLower.includes('directory')
  ) {
    return 'directory';
  }

  // Check for article/content sites
  if (
    titleLower.includes('how to') ||
    titleLower.includes('guide to') ||
    titleLower.includes('tips for') ||
    titleLower.includes('what is') ||
    titleLower.includes('best ways') ||
    titleLower.includes('ultimate guide') ||
    urlLower.includes('/blog/') ||
    urlLower.includes('/article/') ||
    urlLower.includes('/news/') ||
    urlLower.includes('/guide/')
  ) {
    return 'article';
  }

  // Check for individual business sites
  if (
    domainLower.includes('hockey') ||
    domainLower.includes('skating') ||
    domainLower.includes('sports') ||
    domainLower.includes('training') ||
    domainLower.includes('academy') ||
    domainLower.includes('coach') ||
    domainLower.includes('tournament') ||
    titleLower.includes('hockey') ||
    titleLower.includes('skating') ||
    titleLower.includes('training center')
  ) {
    return 'business';
  }

  return 'other';
}

async function analyzeSerpForKeyword(
  client: DataForSEOClient,
  keyword: string,
  location: string
): Promise<KeywordSerpAnalysis> {
  const locationFlag = location === 'United States' ? '🇺🇸' : '🇨🇦';
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${locationFlag} Analyzing SERP for: "${keyword}" (${location})`);
  console.log(`${'='.repeat(80)}\n`);

  const results: SerpResult[] = [];
  const siteTypeBreakdown = {
    directories: 0,
    businesses: 0,
    articles: 0,
    other: 0,
  };

  try {
    // Get SERP data for specified location
    const serpData = await client.getSerpData(keyword, location);

    if (serpData.tasks && serpData.tasks[0]?.result) {
      const taskResults = serpData.tasks[0].result;
      if (taskResults && taskResults.length > 0 && taskResults[0].items) {
        const organicResults = taskResults[0].items
          .filter((item: any) => item.type === 'organic')
          .slice(0, 10);

        console.log(`✅ Found ${organicResults.length} organic results\n`);

        organicResults.forEach((item: any, index: number) => {
          const position = item.rank_absolute || index + 1;
          const title = item.title || 'No title';
          const url = item.url || '';
          const domain = item.domain || '';
          const description = item.description || '';

          const siteType = categorizeSite(url, title, domain);

          results.push({
            position,
            title,
            url,
            domain,
            siteType,
            description,
          });

          siteTypeBreakdown[`${siteType}s` as keyof typeof siteTypeBreakdown]++;

          const typeEmoji =
            siteType === 'directory' ? '📁' :
            siteType === 'business' ? '🏢' :
            siteType === 'article' ? '📝' : '❓';

          console.log(`${position.toString().padStart(2)}. ${typeEmoji} [${siteType.toUpperCase().padEnd(10)}] ${title}`);
          console.log(`    ${url}`);
          console.log(`    ${description.substring(0, 100)}...\n`);
        });
      }
    }

  } catch (error) {
    console.error(`❌ Error analyzing SERP:`, error);
  }

  // Generate insights
  const insights: string[] = [];
  const totalResults = results.length;

  if (totalResults > 0) {
    const dirPct = (siteTypeBreakdown.directories / totalResults) * 100;
    const bizPct = (siteTypeBreakdown.businesses / totalResults) * 100;
    const artPct = (siteTypeBreakdown.articles / totalResults) * 100;

    if (dirPct > 50) {
      insights.push('⚠️  Directories dominate the SERP - strong directory SEO required');
    } else if (dirPct > 30) {
      insights.push('🟡 Significant directory presence - good opportunity for a well-optimized directory');
    } else {
      insights.push('✅ Directories are NOT dominating - excellent opportunity!');
    }

    if (bizPct > 50) {
      insights.push('🏢 Individual businesses rank well - local SEO is important');
    } else if (bizPct < 20) {
      insights.push('⚠️  Few individual businesses ranking - content and authority matter more');
    }

    if (artPct > 30) {
      insights.push('📝 Informational content ranks well - consider blog content strategy');
    }

    // Check top 3 positions
    const top3 = results.slice(0, 3);
    const top3Directories = top3.filter(r => r.siteType === 'directory').length;

    if (top3Directories >= 2) {
      insights.push('🎯 Multiple directories in top 3 - need strong authority to compete');
    } else if (top3Directories === 0) {
      insights.push('🎯 NO directories in top 3 - easier to rank with quality content!');
    }
  }

  return {
    keyword,
    totalResults: results.length,
    results,
    siteTypeBreakdown,
    insights,
  };
}

async function runSerpAnalysis() {
  console.log('🔍 Starting SERP Analysis for New Sections (US + Canada)\n');

  // Create client with explicit credentials from environment
  const client = new DataForSEOClient({
    login: process.env.DATAFORSEO_LOGIN!,
    password: process.env.DATAFORSEO_PASSWORD!,
  });

  const keywordsToAnalyze = [
    'hockey training',
    'hockey prep school',
    'hockey tournament',
  ];

  const locations = ['United States', 'Canada'];

  const allAnalyses: KeywordSerpAnalysis[] = [];

  for (const location of locations) {
    for (const keyword of keywordsToAnalyze) {
      const analysis = await analyzeSerpForKeyword(client, keyword, location);
      allAnalyses.push(analysis);

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Overall summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SERP ANALYSIS SUMMARY (US + Canada)\n');

  // Group analyses by keyword
  const usAnalyses = allAnalyses.filter(a => a.keyword.includes('United States') || allAnalyses.indexOf(a) < 3);
  const caAnalyses = allAnalyses.filter(a => a.keyword.includes('Canada') || allAnalyses.indexOf(a) >= 3);

  allAnalyses.forEach((analysis, index) => {
    const { directories, businesses, articles, other } = analysis.siteTypeBreakdown;
    const total = analysis.totalResults;
    const location = index < keywordsToAnalyze.length ? '🇺🇸 US' : '🇨🇦 CA';

    console.log(`\n${location} 📌 ${analysis.keyword.toUpperCase()}`);
    console.log(`   Total Results Analyzed: ${total}`);
    console.log(`   📁 Directories: ${directories} (${((directories / total) * 100).toFixed(0)}%)`);
    console.log(`   🏢 Businesses: ${businesses} (${((businesses / total) * 100).toFixed(0)}%)`);
    console.log(`   📝 Articles: ${articles} (${((articles / total) * 100).toFixed(0)}%)`);
    console.log(`   ❓ Other: ${other} (${((other / total) * 100).toFixed(0)}%)`);

    console.log('\n   💡 Insights:');
    analysis.insights.forEach(insight => {
      console.log(`      ${insight}`);
    });
  });

  // Overall insights across all keywords
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 OVERALL INSIGHTS & RECOMMENDATIONS\n');

  // Calculate totals for US and Canada separately
  const usTotal = allAnalyses.slice(0, keywordsToAnalyze.length);
  const caTotal = allAnalyses.slice(keywordsToAnalyze.length);

  const usDirectories = usTotal.reduce((sum, a) => sum + a.siteTypeBreakdown.directories, 0);
  const usBusinesses = usTotal.reduce((sum, a) => sum + a.siteTypeBreakdown.businesses, 0);
  const usArticles = usTotal.reduce((sum, a) => sum + a.siteTypeBreakdown.articles, 0);
  const usOther = usTotal.reduce((sum, a) => sum + a.siteTypeBreakdown.other, 0);
  const usGrandTotal = usDirectories + usBusinesses + usArticles + usOther;

  const caDirectories = caTotal.reduce((sum, a) => sum + a.siteTypeBreakdown.directories, 0);
  const caBusinesses = caTotal.reduce((sum, a) => sum + a.siteTypeBreakdown.businesses, 0);
  const caArticles = caTotal.reduce((sum, a) => sum + a.siteTypeBreakdown.articles, 0);
  const caOther = caTotal.reduce((sum, a) => sum + a.siteTypeBreakdown.other, 0);
  const caGrandTotal = caDirectories + caBusinesses + caArticles + caOther;

  const totalDirectories = usDirectories + caDirectories;
  const totalBusinesses = usBusinesses + caBusinesses;
  const totalArticles = usArticles + caArticles;
  const totalOther = usOther + caOther;
  const grandTotal = totalDirectories + totalBusinesses + totalArticles + totalOther;

  console.log('📊 Content Mix Across All Keywords (Combined):');
  console.log(`   📁 Directories: ${totalDirectories}/${grandTotal} (${((totalDirectories / grandTotal) * 100).toFixed(1)}%)`);
  console.log(`   🏢 Businesses: ${totalBusinesses}/${grandTotal} (${((totalBusinesses / grandTotal) * 100).toFixed(1)}%)`);
  console.log(`   📝 Articles: ${totalArticles}/${grandTotal} (${((totalArticles / grandTotal) * 100).toFixed(1)}%)`);

  console.log('\n🇺🇸 United States Breakdown:');
  console.log(`   📁 Directories: ${usDirectories}/${usGrandTotal} (${((usDirectories / usGrandTotal) * 100).toFixed(1)}%)`);
  console.log(`   🏢 Businesses: ${usBusinesses}/${usGrandTotal} (${((usBusinesses / usGrandTotal) * 100).toFixed(1)}%)`);
  console.log(`   📝 Articles: ${usArticles}/${usGrandTotal} (${((usArticles / usGrandTotal) * 100).toFixed(1)}%)`);

  console.log('\n🇨🇦 Canada Breakdown:');
  console.log(`   📁 Directories: ${caDirectories}/${caGrandTotal} (${((caDirectories / caGrandTotal) * 100).toFixed(1)}%)`);
  console.log(`   🏢 Businesses: ${caBusinesses}/${caGrandTotal} (${((caBusinesses / caGrandTotal) * 100).toFixed(1)}%)`);
  console.log(`   📝 Articles: ${caArticles}/${caGrandTotal} (${((caArticles / caGrandTotal) * 100).toFixed(1)}%)`);

  console.log('\n🎯 Strategic Recommendations:\n');

  if (totalDirectories / grandTotal > 0.4) {
    console.log('1. DIRECTORY OPPORTUNITY: Directories are common - a comprehensive directory could compete');
  } else {
    console.log('1. DIRECTORY OPPORTUNITY: Directories are RARE - easier to rank with quality directory!');
  }

  if (totalBusinesses / grandTotal > 0.4) {
    console.log('2. BUSINESS FOCUS: Individual businesses rank well - include individual listings with rich content');
  } else {
    console.log('2. BUSINESS FOCUS: Few businesses rank - focus on comprehensive aggregation and authority');
  }

  if (totalArticles / grandTotal > 0.3) {
    console.log('3. CONTENT STRATEGY: Informational content ranks - invest in blog posts and guides');
  } else {
    console.log('3. CONTENT STRATEGY: Less emphasis on articles - focus on directory functionality');
  }

  // Save to file
  const timestamp = new Date().toISOString().split('T')[0];
  const outputDir = path.join(process.cwd(), 'seo-research');
  const outputFile = path.join(outputDir, `serp-analysis-${timestamp}.json`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify({
    date: timestamp,
    locations: ['United States', 'Canada'],
    keywords: allAnalyses,
    summary: {
      combined: {
        totalDirectories,
        totalBusinesses,
        totalArticles,
        totalOther,
        grandTotal,
        directoryPercentage: (totalDirectories / grandTotal) * 100,
        businessPercentage: (totalBusinesses / grandTotal) * 100,
        articlePercentage: (totalArticles / grandTotal) * 100,
      },
      unitedStates: {
        totalDirectories: usDirectories,
        totalBusinesses: usBusinesses,
        totalArticles: usArticles,
        totalOther: usOther,
        grandTotal: usGrandTotal,
        directoryPercentage: (usDirectories / usGrandTotal) * 100,
        businessPercentage: (usBusinesses / usGrandTotal) * 100,
        articlePercentage: (usArticles / usGrandTotal) * 100,
      },
      canada: {
        totalDirectories: caDirectories,
        totalBusinesses: caBusinesses,
        totalArticles: caArticles,
        totalOther: caOther,
        grandTotal: caGrandTotal,
        directoryPercentage: (caDirectories / caGrandTotal) * 100,
        businessPercentage: (caBusinesses / caGrandTotal) * 100,
        articlePercentage: (caArticles / caGrandTotal) * 100,
      },
    },
  }, null, 2));

  console.log(`\n✅ Report saved to: ${outputFile}`);
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ SERP analysis complete!\n');
}

// Run if called directly
if (require.main === module) {
  runSerpAnalysis()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { runSerpAnalysis };
