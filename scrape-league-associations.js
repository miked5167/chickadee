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

// Test with the first league that has ID 601
const testLeague = { id: 601, url: 'https://myhockeyrankings.com/league-info?l=601' };

async function scrapeLeagueInfo(league) {
  try {
    console.log(`Scraping league ${league.id}...`);

    const result = await app.scrape(league.url, {
      formats: ['markdown'],
    });

    console.log('\n=== MARKDOWN CONTENT ===\n');
    console.log(result.markdown);

    // Save the test result
    fs.writeFileSync(`league-${league.id}-test.md`, result.markdown);
    fs.writeFileSync(`league-${league.id}-test.json`, JSON.stringify(result, null, 2));

    console.log(`\n✓ Saved test results for league ${league.id}`);

  } catch (error) {
    console.error('Error scraping:', error);
    throw error;
  }
}

// Test with one league first
scrapeLeagueInfo(testLeague);
