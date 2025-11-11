/**
 * Generate AI-powered descriptions for hockey advisors
 *
 * This script:
 * 1. Scrapes advisor websites using Firecrawl
 * 2. Generates SEO-optimized descriptions using Claude AI
 * 3. Updates the database with new descriptions
 *
 * Usage:
 *   npx tsx scripts/generate-descriptions.ts                 # Process all advisors
 *   npx tsx scripts/generate-descriptions.ts --limit 10      # Process only 10
 *   npx tsx scripts/generate-descriptions.ts --start-from 50 # Resume from ID 50
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import Firecrawl from '@mendable/firecrawl-js';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Configuration
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Rate limiting
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds
const MAX_RETRIES = 2;

// Parse command line arguments
const args = process.argv.slice(2);
const limitArg = args.find(arg => arg.startsWith('--limit='));
const startFromArg = args.find(arg => arg.startsWith('--start-from='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : null;
const START_FROM = startFromArg ? parseInt(startFromArg.split('=')[1]) : 0;

// Initialize clients
const firecrawl = new Firecrawl({ apiKey: FIRECRAWL_API_KEY });
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface Advisor {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  description: string | null;
  services_offered: string[] | null;
  specialties: string[] | null;
}

interface GenerationResult {
  id: string;
  name: string;
  success: boolean;
  description?: string;
  error?: string;
  firecrawlCost?: number;
  claudeCost?: number;
}

/**
 * Delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Scrape website content using Firecrawl
 */
async function scrapeWebsite(url: string): Promise<string | null> {
  try {
    console.log(`  🌐 Scraping ${url}...`);

    const result = await firecrawl.scrape(url, {
      formats: ['markdown'],
      onlyMainContent: true,
      timeout: 30000
    });

    if (result && result.markdown) {
      const content = result.markdown;
      // Limit content to first 4000 characters to avoid token limits
      const truncated = content.substring(0, 4000);
      console.log(`  ✅ Scraped ${truncated.length} characters`);
      return truncated;
    }

    console.log(`  ⚠️  No content found`);
    return null;
  } catch (error: any) {
    console.error(`  ❌ Scraping failed: ${error.message}`);
    return null;
  }
}

/**
 * Generate SEO-optimized description using Claude
 */
async function generateDescription(
  companyName: string,
  websiteContent: string | null,
  services: string[] | null,
  specialties: string[] | null
): Promise<string> {
  const servicesText = services && services.length > 0
    ? `Services: ${services.join(', ')}`
    : '';

  const specialtiesText = specialties && specialties.length > 0
    ? `Specialties: ${specialties.join(', ')}`
    : '';

  const prompt = `You are an expert SEO copywriter specializing in hockey industry content. Generate a compelling, search-engine-optimized description for this hockey advisory company.

Company Name: ${companyName}
${servicesText}
${specialtiesText}

${websiteContent ? `Website Content:\n${websiteContent}` : 'No website content available. Generate based on company name and services.'}

SEO OPTIMIZATION REQUIREMENTS:

1. LENGTH: Write EXACTLY 100-150 words (count carefully!)

2. KEYWORD STRATEGY:
   - Primary keywords: Include variations of "hockey advisor", "hockey agent", "hockey recruiting"
   - Secondary keywords: Use 3-5 of these naturally: player development, NCAA hockey, junior hockey, youth hockey, hockey training, college recruiting, professional hockey, hockey consultant, career guidance, talent evaluation
   - Long-tail keywords: Include phrases like "aspiring hockey players", "next level", "hockey journey", "hockey career"

3. STRUCTURE:
   - Opening sentence: Strong value proposition with primary keyword (what they do + who they help)
   - Middle: 2-3 sentences about services, expertise, and unique approach
   - Closing: Benefits and results clients can expect

4. SEO WRITING TECHNIQUES:
   - Use active voice and action verbs
   - Include power words: "expert", "proven", "specialized", "comprehensive", "dedicated"
   - Write for readability (short sentences, clear language)
   - Make it benefit-focused (what clients gain, not just what company does)
   - Ensure natural keyword density (keywords appear 2-3 times but feel organic)

5. CRITICAL RULES:
   - NO location, city, state, or address mentions
   - Write in third person
   - Be factual and credible
   - Make it unique to THIS company (not generic)
   - Focus on differentiation and value

6. TARGET AUDIENCE: Parents of youth players, junior hockey players, NCAA prospects, and aspiring professional athletes

Return ONLY the description text. No preamble, explanation, or extra formatting.`;

  try {
    console.log(`  🤖 Generating description with Claude...`);

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const description = message.content[0].type === 'text'
      ? message.content[0].text.trim()
      : '';

    if (description) {
      const wordCount = description.split(/\s+/).length;
      console.log(`  ✅ Generated ${wordCount} words`);
      return description;
    }

    throw new Error('No description generated');
  } catch (error: any) {
    console.error(`  ❌ Claude generation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Process a single advisor
 */
async function processAdvisor(advisor: Advisor): Promise<GenerationResult> {
  console.log(`\n📌 Processing: ${advisor.name}`);
  console.log(`   ID: ${advisor.id}`);
  console.log(`   Website: ${advisor.website_url || 'none'}`);

  try {
    let websiteContent: string | null = null;

    // Scrape website if available
    if (advisor.website_url) {
      websiteContent = await scrapeWebsite(advisor.website_url);
      await delay(1000); // Small delay between API calls
    }

    // Generate description
    const description = await generateDescription(
      advisor.name,
      websiteContent,
      advisor.services_offered,
      advisor.specialties
    );

    // Update database
    const { error } = await supabase
      .from('advisors')
      .update({ description })
      .eq('id', advisor.id);

    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }

    console.log(`  💾 Saved to database`);
    console.log(`  ✨ Description: ${description.substring(0, 100)}...`);

    return {
      id: advisor.id,
      name: advisor.name,
      success: true,
      description,
      firecrawlCost: websiteContent ? 0.001 : 0,
      claudeCost: 0.02
    };
  } catch (error: any) {
    console.error(`  ❌ Failed: ${error.message}`);

    return {
      id: advisor.id,
      name: advisor.name,
      success: false,
      error: error.message
    };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🏒 Hockey Advisor Description Generator\n');
  console.log('=' .repeat(80));
  console.log('\n📊 Configuration:');
  console.log(`   Firecrawl API: ${FIRECRAWL_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Anthropic API: ${ANTHROPIC_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Supabase: ${SUPABASE_URL ? '✅ Connected' : '❌ Missing'}`);
  console.log(`   Limit: ${LIMIT || 'All advisors'}`);
  console.log(`   Start from: ${START_FROM}`);

  if (!FIRECRAWL_API_KEY || !ANTHROPIC_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('\n❌ Missing required environment variables!');
    console.error('Please check .env.local for:');
    console.error('  - FIRECRAWL_API_KEY');
    console.error('  - ANTHROPIC_API_KEY');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    // Query advisors
    console.log('\n\n📋 Fetching advisors from database...\n');

    let query = supabase
      .from('advisors')
      .select('id, name, slug, website_url, description, services_offered, specialties')
      .not('website_url', 'is', null)
      .order('name');

    if (START_FROM > 0) {
      query = query.range(START_FROM, LIMIT ? START_FROM + LIMIT - 1 : 1000);
    } else if (LIMIT) {
      query = query.limit(LIMIT);
    }

    const { data: advisors, error } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!advisors || advisors.length === 0) {
      console.log('❌ No advisors found!');
      process.exit(0);
    }

    console.log(`✅ Found ${advisors.length} advisors to process\n`);
    console.log('=' .repeat(80));

    // Process advisors
    const results: GenerationResult[] = [];
    let successCount = 0;
    let failureCount = 0;
    let totalFirecrawlCost = 0;
    let totalClaudeCost = 0;

    for (let i = 0; i < advisors.length; i++) {
      const advisor = advisors[i];

      console.log(`\n[${i + 1}/${advisors.length}]`);

      const result = await processAdvisor(advisor);
      results.push(result);

      if (result.success) {
        successCount++;
        totalFirecrawlCost += result.firecrawlCost || 0;
        totalClaudeCost += result.claudeCost || 0;
      } else {
        failureCount++;
      }

      // Rate limiting
      if (i < advisors.length - 1) {
        console.log(`\n  ⏳ Waiting ${DELAY_BETWEEN_REQUESTS/1000}s before next request...`);
        await delay(DELAY_BETWEEN_REQUESTS);
      }
    }

    // Generate report
    console.log('\n\n' + '='.repeat(80));
    console.log('\n📊 GENERATION COMPLETE\n');
    console.log(`✅ Successful: ${successCount}/${advisors.length}`);
    console.log(`❌ Failed: ${failureCount}/${advisors.length}`);
    console.log(`\n💰 Estimated Costs:`);
    console.log(`   Firecrawl: $${totalFirecrawlCost.toFixed(2)}`);
    console.log(`   Claude: $${totalClaudeCost.toFixed(2)}`);
    console.log(`   Total: $${(totalFirecrawlCost + totalClaudeCost).toFixed(2)}`);

    // Save results to file
    const timestamp = new Date().toISOString().split('T')[0];
    const outputDir = path.join(process.cwd(), 'seo-research');
    const outputFile = path.join(outputDir, `description-generation-${timestamp}.json`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputFile, JSON.stringify({
      date: timestamp,
      totalProcessed: advisors.length,
      successful: successCount,
      failed: failureCount,
      costs: {
        firecrawl: totalFirecrawlCost,
        claude: totalClaudeCost,
        total: totalFirecrawlCost + totalClaudeCost
      },
      results
    }, null, 2));

    console.log(`\n📄 Report saved to: ${outputFile}`);

    if (failureCount > 0) {
      console.log(`\n⚠️  Failed Advisors:`);
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ All done!\n');

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { main as generateDescriptions };
