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

// Read the current leagues data
const allLeagues = JSON.parse(fs.readFileSync('leagues-with-associations.json', 'utf-8'));

// Find the failed leagues (ones with errors or 0 associations that timed out)
const failedLeagueIds = [7, 134, 197, 611, 627, 696, 798, 799, 800];

const failedLeagues = allLeagues.filter(l => failedLeagueIds.includes(l.id));

console.log(`Found ${failedLeagues.length} failed leagues to retry:\n`);
failedLeagues.forEach(l => {
  console.log(`  - League ${l.id}: ${l.name}`);
});
console.log('');

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
    console.log(`[${index + 1}/${failedLeagues.length}] Retrying: ${league.name} (ID: ${league.id})`);

    const result = await app.scrape(league.url, {
      formats: ['markdown'],
    });

    const associations = extractAssociations(result.markdown, league.id);

    console.log(`  ✓ Found ${associations.length} associations`);

    return {
      ...league,
      associations: associations,
      associationCount: associations.length,
      scrapedAt: new Date().toISOString(),
      error: undefined // Clear any previous error
    };

  } catch (error) {
    console.error(`  ✗ Error scraping league ${league.id}:`, error.message);
    return {
      ...league,
      error: error.message,
      scrapedAt: new Date().toISOString()
    };
  }
}

// Function to add delay between requests
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main retry function
async function retryFailedLeagues() {
  console.log('Starting retry for failed leagues...\n');

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < failedLeagues.length; i++) {
    const league = failedLeagues[i];

    const result = await scrapeLeague(league, i);
    results.push(result);

    if (result.error) {
      errorCount++;
    } else {
      successCount++;
    }

    // Add a delay between requests
    if (i < failedLeagues.length - 1) {
      await delay(2000); // 2 second delay between retries
    }
  }

  // Merge the results back into the main file
  const updatedLeagues = allLeagues.map(league => {
    const retried = results.find(r => r.id === league.id);
    return retried || league;
  });

  // Save updated results
  fs.writeFileSync('leagues-with-associations.json', JSON.stringify(updatedLeagues, null, 2));

  // Calculate new totals
  const newTotalAssociations = updatedLeagues.reduce((sum, l) => sum + (l.associationCount || 0), 0);
  const successfulLeagues = updatedLeagues.filter(l => !l.error).length;
  const failedCount = updatedLeagues.filter(l => l.error).length;

  // Update summary
  const summary = {
    totalLeagues: updatedLeagues.length,
    successfulScrapes: successfulLeagues,
    failedScrapes: failedCount,
    totalAssociations: newTotalAssociations,
    scrapedAt: new Date().toISOString()
  };

  fs.writeFileSync('scrape-summary.json', JSON.stringify(summary, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('RETRY COMPLETE');
  console.log('='.repeat(60));
  console.log(`Retried: ${failedLeagues.length} leagues`);
  console.log(`Successful: ${successCount}`);
  console.log(`Still failed: ${errorCount}`);
  console.log(`\nOverall statistics:`);
  console.log(`Total leagues: ${summary.totalLeagues}`);
  console.log(`Total successful: ${summary.successfulScrapes}`);
  console.log(`Total failed: ${summary.failedScrapes}`);
  console.log(`Total associations: ${summary.totalAssociations}`);
  console.log('\n✓ Updated leagues-with-associations.json');
  console.log('✓ Updated scrape-summary.json');

  // List any still-failed leagues
  if (errorCount > 0) {
    console.log('\n⚠️  Still failed leagues:');
    results.filter(r => r.error).forEach(l => {
      console.log(`  - League ${l.id}: ${l.name} (${l.error})`);
    });
  }
}

// Run the retry
retryFailedLeagues().catch(console.error);
