import Firecrawl from '@mendable/firecrawl-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const app = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

// Read the leagues
const leagues = JSON.parse(fs.readFileSync('leagues-parsed.json', 'utf-8'));

console.log(`Found ${leagues.length} leagues to scrape\n`);

// Store results
const results = [];
let successCount = 0;
let errorCount = 0;

// Function to extract associations from markdown
function extractAssociations(markdown, leagueId) {
  const associations = [];

  // Find the "### Associations" section
  const assocSectionMatch = markdown.match(/### Associations([\s\S]*?)(?=###|$)/);

  if (!assocSectionMatch) {
    console.log(`  ⚠️  No associations section found for league ${leagueId}`);
    return associations;
  }

  const assocSection = assocSectionMatch[1];

  // Extract lines that start with "- " and contain a location in parentheses
  // Pattern: - Name (City, State/Province)
  const assocPattern = /^- ([^(]+)\s*\(([^)]+)\)/gm;
  let match;

  while ((match = assocPattern.exec(assocSection)) !== null) {
    const name = match[1].trim();
    const location = match[2].trim();

    associations.push({
      name: name,
      location: location
    });
  }

  return associations;
}

// Function to scrape a single league
async function scrapeLeague(league, index) {
  try {
    console.log(`[${index + 1}/${leagues.length}] Scraping: ${league.name} (ID: ${league.id})`);

    const result = await app.scrape(league.url, {
      formats: ['markdown'],
    });

    const associations = extractAssociations(result.markdown, league.id);

    console.log(`  ✓ Found ${associations.length} associations`);

    return {
      ...league,
      associations: associations,
      associationCount: associations.length,
      scrapedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error(`  ✗ Error scraping league ${league.id}:`, error.message);
    return {
      ...league,
      associations: [],
      associationCount: 0,
      error: error.message,
      scrapedAt: new Date().toISOString()
    };
  }
}

// Function to add delay between requests
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main scraping function
async function scrapeAllLeagues() {
  console.log('Starting to scrape all leagues...\n');

  for (let i = 0; i < leagues.length; i++) {
    const league = leagues[i];

    const result = await scrapeLeague(league, i);
    results.push(result);

    if (result.error) {
      errorCount++;
    } else {
      successCount++;
    }

    // Save progress every 10 leagues
    if ((i + 1) % 10 === 0) {
      fs.writeFileSync('leagues-with-associations-progress.json', JSON.stringify(results, null, 2));
      console.log(`\n📊 Progress saved: ${i + 1}/${leagues.length} leagues scraped\n`);
    }

    // Add a small delay to avoid rate limiting (adjust as needed)
    if (i < leagues.length - 1) {
      await delay(1000); // 1 second delay between requests
    }
  }

  // Save final results
  fs.writeFileSync('leagues-with-associations.json', JSON.stringify(results, null, 2));

  // Create a summary
  const summary = {
    totalLeagues: leagues.length,
    successfulScrapes: successCount,
    failedScrapes: errorCount,
    totalAssociations: results.reduce((sum, r) => sum + r.associationCount, 0),
    scrapedAt: new Date().toISOString()
  };

  fs.writeFileSync('scrape-summary.json', JSON.stringify(summary, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('SCRAPING COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total leagues: ${summary.totalLeagues}`);
  console.log(`Successful: ${summary.successfulScrapes}`);
  console.log(`Failed: ${summary.failedScrapes}`);
  console.log(`Total associations found: ${summary.totalAssociations}`);
  console.log('\n✓ Results saved to leagues-with-associations.json');
  console.log('✓ Summary saved to scrape-summary.json');
}

// Run the scraper
scrapeAllLeagues().catch(console.error);
