/**
 * Domain Keyword Research Script
 * Analyzes what keywords a specific domain is ranking for
 */

// Load environment variables first
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

import { DataForSEOClient } from '../../lib/seo/dataforseo-client';

interface KeywordRanking {
  keyword: string;
  position: number;
  searchVolume: number;
  cpc: number;
  url: string;
}

async function researchDomain(domain: string) {
  console.log(`🔍 Researching Domain: ${domain}\n`);

  // Create client with explicit credentials from environment
  const client = new DataForSEOClient({
    login: process.env.DATAFORSEO_LOGIN!,
    password: process.env.DATAFORSEO_PASSWORD!,
  });

  try {
    // Get domain overview
    console.log('📊 Fetching domain metrics...\n');

    // Use SERP API to find where this domain ranks for our target keywords
    const targetKeywords = [
      'hockey advisor',
      'hockey agent',
      'hockey recruiting',
      'hockey consultant',
      'youth hockey advisor',
      'junior hockey advisor',
      'NCAA hockey recruiting',
      'hockey family advisor',
      'hockey advising services',
      'hockey career advisor',
    ];

    const rankings: KeywordRanking[] = [];

    console.log(`Checking rankings for ${targetKeywords.length} keywords...\n`);

    for (const keyword of targetKeywords) {
      console.log(`Checking: "${keyword}"`);

      try {
        const serpData = await client.getSerpData(keyword, 'United States');

        if (serpData.tasks && serpData.tasks[0]?.result) {
          const results = serpData.tasks[0].result;

          if (results && results.length > 0 && results[0].items) {
            const items = results[0].items.filter((item: any) => item.type === 'organic');

            // Find this domain in the results
            const domainResult = items.find((item: any) => {
              try {
                const itemDomain = new URL(item.url).hostname.replace('www.', '');
                return itemDomain === domain.replace('www.', '');
              } catch {
                return false;
              }
            });

            if (domainResult) {
              const position = domainResult.rank_group || domainResult.rank_absolute || 0;
              console.log(`   ✅ Position #${position}`);

              rankings.push({
                keyword,
                position,
                searchVolume: 0, // Will get from keyword data
                cpc: 0,
                url: domainResult.url,
              });
            } else {
              console.log(`   ❌ Not ranking in top 100`);
            }
          }
        }

        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`   ❌ Error: ${error}`);
      }
    }

    // Get search volume data for ranked keywords
    if (rankings.length > 0) {
      console.log(`\n📊 Fetching search volume for ${rankings.length} ranked keywords...\n`);

      const rankedKeywords = rankings.map(r => r.keyword);
      const keywordData = await client.getKeywordData(rankedKeywords);

      if (keywordData.tasks && keywordData.tasks[0]?.result) {
        const results = keywordData.tasks[0].result;

        results.forEach((data: any) => {
          const ranking = rankings.find(r => r.keyword === data.keyword);
          if (ranking) {
            ranking.searchVolume = data.search_volume || 0;
            ranking.cpc = data.cpc || 0;
          }
        });
      }
    }

    // Generate report
    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 DOMAIN ANALYSIS: ${domain}\n`);

    if (rankings.length === 0) {
      console.log('⚠️  Domain is not ranking for any of the target keywords in top 100.\n');
      console.log('This could mean:');
      console.log('1. Domain focuses on different keywords');
      console.log('2. Domain is new or has low authority');
      console.log('3. Domain targets long-tail or branded keywords\n');
    } else {
      console.log(`Total Keywords Ranking: ${rankings.length}/${targetKeywords.length}\n`);

      // Sort by position
      rankings.sort((a, b) => a.position - b.position);

      console.log('Keyword Rankings:');
      console.log('-'.repeat(80));

      rankings.forEach((ranking, index) => {
        const posEmoji = ranking.position <= 3 ? '🏆' : ranking.position <= 10 ? '🥇' : '📊';
        console.log(`${posEmoji} #${ranking.position.toString().padStart(2)} | ${ranking.keyword.padEnd(30)} | ${ranking.searchVolume.toString().padStart(5)} vol | $${ranking.cpc.toFixed(2)}`);
      });

      // Calculate metrics
      const avgPosition = rankings.reduce((sum, r) => sum + r.position, 0) / rankings.length;
      const totalVolume = rankings.reduce((sum, r) => sum + r.searchVolume, 0);
      const top10Count = rankings.filter(r => r.position <= 10).length;
      const top3Count = rankings.filter(r => r.position <= 3).length;

      console.log('\n' + '-'.repeat(80));
      console.log(`Average Position: ${avgPosition.toFixed(1)}`);
      console.log(`Top 3 Rankings: ${top3Count}`);
      console.log(`Top 10 Rankings: ${top10Count}`);
      console.log(`Total Search Volume: ${totalVolume.toLocaleString()}/month`);

      // Estimate traffic
      const estimatedTraffic = rankings.reduce((sum, r) => {
        // CTR estimates: Pos 1=30%, 2=15%, 3=10%, 4-10=5%, 11-20=2%, 21+=1%
        const ctr = r.position === 1 ? 0.30 :
                    r.position === 2 ? 0.15 :
                    r.position === 3 ? 0.10 :
                    r.position <= 10 ? 0.05 :
                    r.position <= 20 ? 0.02 : 0.01;

        return sum + (r.searchVolume * ctr);
      }, 0);

      console.log(`Estimated Monthly Traffic: ${Math.round(estimatedTraffic).toLocaleString()} visits\n`);
    }

    // Save to file
    const timestamp = new Date().toISOString().split('T')[0];
    const outputDir = path.join(process.cwd(), 'seo-research');
    const outputFile = path.join(outputDir, `domain-${domain.replace(/\./g, '_')}-${timestamp}.json`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputFile, JSON.stringify({
      date: timestamp,
      domain,
      totalKeywords: rankings.length,
      rankings,
      metrics: rankings.length > 0 ? {
        averagePosition: rankings.reduce((sum, r) => sum + r.position, 0) / rankings.length,
        top3Count: rankings.filter(r => r.position <= 3).length,
        top10Count: rankings.filter(r => r.position <= 10).length,
        totalSearchVolume: rankings.reduce((sum, r) => sum + r.searchVolume, 0),
      } : null,
    }, null, 2));

    console.log(`✅ Report saved to: ${outputFile}`);

    // Recommendations
    if (rankings.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('\n💡 INSIGHTS\n');

      const bestKeywords = rankings.filter(r => r.position <= 10).slice(0, 3);
      if (bestKeywords.length > 0) {
        console.log('🏆 Strongest Keywords:');
        bestKeywords.forEach(r => {
          console.log(`   • ${r.keyword} - Position #${r.position}`);
        });
      }

      const weakKeywords = rankings.filter(r => r.position > 10).slice(0, 3);
      if (weakKeywords.length > 0) {
        console.log('\n📈 Opportunities to Improve:');
        weakKeywords.forEach(r => {
          console.log(`   • ${r.keyword} - Position #${r.position} (could move to top 10)`);
        });
      }

      const highVolumeKeywords = rankings
        .filter(r => r.searchVolume > 100)
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, 3);

      if (highVolumeKeywords.length > 0) {
        console.log('\n🎯 High-Value Keywords:');
        highVolumeKeywords.forEach(r => {
          console.log(`   • ${r.keyword} - ${r.searchVolume} searches/month at position #${r.position}`);
        });
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Domain research complete!\n');

  } catch (error) {
    console.error('❌ Error during domain research:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const domain = process.argv[2] || 'ahadvising.com';

  researchDomain(domain)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { researchDomain };
