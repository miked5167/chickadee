/**
 * Competitor Analysis Script
 * Analyzes competitors in hockey advisor niche
 */

// Load environment variables first
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

import { DataForSEOClient } from '../../lib/seo/dataforseo-client';

interface CompetitorData {
  rank: number;
  url: string;
  domain: string;
  title: string;
  description?: string;
}

async function runCompetitorAnalysis() {
  console.log('🔍 Starting Competitor Analysis for The Hockey Directory\n');

  // Create client with explicit credentials from environment
  const client = new DataForSEOClient({
    login: process.env.DATAFORSEO_LOGIN!,
    password: process.env.DATAFORSEO_PASSWORD!,
  });

  // Target keywords to analyze
  const targetKeywords = [
    'hockey advisor',
    'hockey recruiting services',
    'hockey agent directory',
    'youth hockey advisor',
  ];

  const allCompetitors = new Map<string, { count: number; keywords: string[]; positions: number[] }>();

  console.log('📊 Analyzing SERP for target keywords...\n');

  for (const keyword of targetKeywords) {
    console.log(`\nKeyword: "${keyword}"`);
    console.log('='.repeat(80));

    try {
      const serpData = await client.getSerpData(keyword);

      if (serpData.tasks && serpData.tasks[0]?.result) {
        const results = serpData.tasks[0].result;

        if (results && results.length > 0 && results[0].items) {
          const items = results[0].items
            .filter((item: any) => item.type === 'organic')
            .slice(0, 20); // Top 20 organic results

          console.log(`\nTop ${items.length} Organic Results:`);
          console.log('-'.repeat(80));

          items.forEach((item: any, index: number) => {
            const rank = item.rank_group || index + 1;
            const url = item.url || '';
            const domain = new URL(url).hostname.replace('www.', '');
            const title = item.title || '';

            console.log(`${rank.toString().padStart(2)}. ${domain}`);
            console.log(`    ${title.substring(0, 70)}...`);
            console.log(`    ${url}\n`);

            // Track competitor
            if (!allCompetitors.has(domain)) {
              allCompetitors.set(domain, {
                count: 0,
                keywords: [],
                positions: [],
              });
            }

            const competitor = allCompetitors.get(domain)!;
            competitor.count++;
            competitor.keywords.push(keyword);
            competitor.positions.push(rank);
          });
        }
      }

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Error analyzing "${keyword}":`, error);
    }
  }

  // Analyze competitor data
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 COMPETITOR ANALYSIS SUMMARY\n');

  const competitorList = Array.from(allCompetitors.entries())
    .map(([domain, data]) => ({
      domain,
      appearances: data.count,
      keywords: data.keywords,
      avgPosition: data.positions.reduce((sum, pos) => sum + pos, 0) / data.positions.length,
      bestPosition: Math.min(...data.positions),
    }))
    .sort((a, b) => b.appearances - a.appearances || a.avgPosition - b.avgPosition);

  console.log(`Total Unique Competitors: ${competitorList.length}\n`);

  console.log('Top Competitors (by appearances in SERPs):');
  console.log('-'.repeat(80));

  const top20Competitors = competitorList.slice(0, 20);

  top20Competitors.forEach((comp, index) => {
    console.log(`\n${(index + 1).toString().padStart(2)}. ${comp.domain}`);
    console.log(`    Appearances: ${comp.appearances}/${targetKeywords.length}`);
    console.log(`    Avg Position: ${comp.avgPosition.toFixed(1)}`);
    console.log(`    Best Position: ${comp.bestPosition}`);
    console.log(`    Keywords: ${comp.keywords.join(', ')}`);
  });

  // Save to file
  const timestamp = new Date().toISOString().split('T')[0];
  const outputDir = path.join(process.cwd(), 'seo-research');
  const outputFile = path.join(outputDir, `competitor-analysis-${timestamp}.json`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify({
    date: timestamp,
    targetKeywords,
    totalCompetitors: competitorList.length,
    competitors: competitorList,
  }, null, 2));

  console.log(`\n✅ Report saved to: ${outputFile}`);

  // Generate insights
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 KEY INSIGHTS\n');

  const dominantCompetitors = competitorList.filter(c => c.appearances >= targetKeywords.length * 0.5);

  if (dominantCompetitors.length > 0) {
    console.log('🎯 Dominant Competitors (appear in 50%+ of keywords):');
    dominantCompetitors.forEach(comp => {
      console.log(`   • ${comp.domain} - ${comp.appearances} appearances, avg pos ${comp.avgPosition.toFixed(1)}`);
    });
  }

  const topRankers = competitorList.filter(c => c.bestPosition <= 3);

  if (topRankers.length > 0) {
    console.log('\n🏆 Top 3 Rankers:');
    topRankers.slice(0, 5).forEach(comp => {
      console.log(`   • ${comp.domain} - Best position: #${comp.bestPosition}`);
    });
  }

  const nichePlayers = competitorList.filter(c => c.appearances === 1 && c.bestPosition <= 10);

  if (nichePlayers.length > 0) {
    console.log('\n🎯 Niche Players (rank well for specific keywords):');
    nichePlayers.slice(0, 5).forEach(comp => {
      console.log(`   • ${comp.domain} - ${comp.keywords[0]} (pos ${comp.bestPosition})`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📝 RECOMMENDATIONS\n');

  console.log('1. Study top competitors\' content strategies');
  console.log('2. Identify gaps in competitor coverage');
  console.log('3. Target keywords where competitors are weak');
  console.log('4. Build authority in niche areas');
  console.log('5. Monitor competitor rankings over time\n');

  console.log('✅ Competitor analysis complete!\n');
}

// Run if called directly
if (require.main === module) {
  runCompetitorAnalysis()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { runCompetitorAnalysis };
