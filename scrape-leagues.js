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

async function scrapeLeagues() {
  try {
    console.log('Scraping leagues page...');

    // Scrape the main leagues page
    const result = await app.scrape('https://myhockeyrankings.com/leagues', {
      formats: ['markdown', 'html'],
    });

    console.log('Main page scraped successfully!');
    console.log('\n=== MARKDOWN CONTENT ===\n');
    console.log(result.markdown);

    // Save the results
    fs.writeFileSync('leagues-scrape-result.json', JSON.stringify(result, null, 2));
    fs.writeFileSync('leagues-content.md', result.markdown);

    console.log('\n\nResults saved to:');
    console.log('- leagues-scrape-result.json');
    console.log('- leagues-content.md');

    // Try to extract league links from the HTML
    if (result.html) {
      const leagueLinks = [];
      const linkRegex = /href="(\/league-info\?l=\d+)"/g;
      let match;

      while ((match = linkRegex.exec(result.html)) !== null) {
        const link = 'https://myhockeyrankings.com' + match[1];
        if (!leagueLinks.includes(link)) {
          leagueLinks.push(link);
        }
      }

      console.log(`\n\nFound ${leagueLinks.length} league links:`);
      leagueLinks.forEach(link => console.log(link));

      fs.writeFileSync('league-links.json', JSON.stringify(leagueLinks, null, 2));
      console.log('\nLeague links saved to league-links.json');
    }

  } catch (error) {
    console.error('Error scraping:', error);
    throw error;
  }
}

scrapeLeagues();
