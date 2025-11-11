/**
 * Client Count Scraping Script
 *
 * Scrapes agency client counts from Elite Prospects and updates our database.
 *
 * Usage:
 *   npm run scrape-client-counts
 *   npm run scrape-client-counts -- --dry-run
 *
 * Options:
 *   --dry-run    Show matches without updating database
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Supabase credentials are required');
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Types
interface AgencyData {
  name: string;
  clientCount: number;
}

interface Advisor {
  id: string;
  name: string;
  clients_served: number | null;
}

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

/**
 * Load agencies from JSON file
 */
async function scrapeAgencies(): Promise<AgencyData[]> {
  console.log('📂 Loading Elite Prospects agency data...\n');

  try {
    const fs = await import('fs/promises');
    const dataPath = path.resolve(__dirname, '../data/elite-prospects-agencies.json');

    const fileContent = await fs.readFile(dataPath, 'utf-8');
    const agencies: AgencyData[] = JSON.parse(fileContent);

    // Filter out agencies with 0 clients
    const validAgencies = agencies.filter(a => a.clientCount > 0);

    console.log(`✅ Loaded ${validAgencies.length} agencies (${agencies.length - validAgencies.length} with 0 clients excluded)\n`);
    return validAgencies;

  } catch (error) {
    console.error('❌ Error loading agency data:', error);
    throw error;
  }
}

/**
 * Normalize agency names for matching
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')     // Normalize spaces
    .trim();
}

/**
 * Find matching advisors in database
 */
async function findMatches(agencies: AgencyData[]): Promise<Map<string, { advisor: Advisor; agency: AgencyData }>> {
  console.log('🔎 Searching for matches in database...\n');

  const matches = new Map<string, { advisor: Advisor; agency: AgencyData }>();

  // Get all advisors from database
  const { data: advisors, error } = await supabase
    .from('advisors')
    .select('id, name, clients_served')
    .eq('is_published', true);

  if (error) {
    throw new Error(`Failed to fetch advisors: ${error.message}`);
  }

  if (!advisors || advisors.length === 0) {
    console.log('⚠️  No advisors found in database');
    return matches;
  }

  // Create normalized name lookup
  const advisorsByNormalizedName = new Map<string, Advisor>();
  advisors.forEach((advisor) => {
    const normalized = normalizeName(advisor.name);
    advisorsByNormalizedName.set(normalized, advisor);
  });

  // Find matches
  for (const agency of agencies) {
    const normalized = normalizeName(agency.name);
    const advisor = advisorsByNormalizedName.get(normalized);

    if (advisor) {
      matches.set(advisor.id, { advisor, agency });
    }
  }

  console.log(`✅ Found ${matches.size} matches out of ${agencies.length} agencies\n`);
  return matches;
}

/**
 * Display matches for review
 */
function displayMatches(matches: Map<string, { advisor: Advisor; agency: AgencyData }>) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 MATCHES FOUND');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  matches.forEach(({ advisor, agency }) => {
    const currentCount = advisor.clients_served || 'none';
    console.log(`• ${advisor.name}`);
    console.log(`  Elite Prospects: ${agency.clientCount} clients`);
    console.log(`  Current DB: ${currentCount}`);
    console.log(`  ${currentCount === 'none' || currentCount !== agency.clientCount ? '→ Will update' : '→ Already up to date'}`);
    console.log('');
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Update database with client counts
 */
async function updateDatabase(matches: Map<string, { advisor: Advisor; agency: AgencyData }>) {
  console.log('💾 Updating database...\n');

  let updateCount = 0;
  let skipCount = 0;

  for (const [advisorId, { advisor, agency }] of matches) {
    // Skip if already has the same count
    if (advisor.clients_served === agency.clientCount) {
      skipCount++;
      continue;
    }

    const { error } = await supabase
      .from('advisors')
      .update({ clients_served: agency.clientCount })
      .eq('id', advisorId);

    if (error) {
      console.error(`❌ Failed to update ${advisor.name}:`, error.message);
    } else {
      console.log(`✅ Updated ${advisor.name}: ${agency.clientCount} clients`);
      updateCount++;
    }
  }

  console.log(`\n✨ Updated ${updateCount} advisor(s)`);
  if (skipCount > 0) {
    console.log(`⏭️  Skipped ${skipCount} advisor(s) (already up to date)`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🏒 Elite Prospects Client Count Scraper\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made to database\n');
  }

  try {
    // Step 1: Scrape agencies
    const agencies = await scrapeAgencies();

    if (agencies.length === 0) {
      console.log('⚠️  No agencies found. Exiting.');
      return;
    }

    // Step 2: Find matches
    const matches = await findMatches(agencies);

    if (matches.size === 0) {
      console.log('⚠️  No matches found. Exiting.');
      return;
    }

    // Step 3: Display matches
    displayMatches(matches);

    // Step 4: Update database (unless dry run)
    if (!isDryRun) {
      await updateDatabase(matches);
    } else {
      console.log('ℹ️  Dry run complete. Use without --dry-run to update database.\n');
    }

    console.log('\n✅ Done!\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
