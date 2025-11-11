/**
 * Add Missing Agencies Script
 *
 * Adds agencies from Elite Prospects that don't exist in our database.
 * All new agencies are added as UNPUBLISHED (is_published: false) so they
 * won't appear in the directory until manually approved in the dashboard.
 *
 * Usage:
 *   npm run add-missing-agencies
 *   npm run add-missing-agencies -- --dry-run
 *
 * Options:
 *   --dry-run    Show what would be added without making changes
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
  country: string;
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
async function loadAgencies(): Promise<AgencyData[]> {
  console.log('📂 Loading Elite Prospects agency data...\n');

  try {
    const fs = await import('fs/promises');
    const dataPath = path.resolve(__dirname, '../data/elite-prospects-agencies.json');

    const fileContent = await fs.readFile(dataPath, 'utf-8');
    const agencies: AgencyData[] = JSON.parse(fileContent);

    // Filter out agencies with 0 clients
    const validAgencies = agencies.filter(a => a.clientCount > 0);

    console.log(`✅ Loaded ${validAgencies.length} agencies\n`);
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
 * Generate slug from agency name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .trim();
}

/**
 * Find unmatched agencies (exist in Elite Prospects but not in our DB)
 */
async function findUnmatchedAgencies(agencies: AgencyData[]): Promise<AgencyData[]> {
  console.log('🔎 Finding agencies not in database...\n');

  // Get all advisors from database
  const { data: advisors, error } = await supabase
    .from('advisors')
    .select('id, name');

  if (error) {
    throw new Error(`Failed to fetch advisors: ${error.message}`);
  }

  if (!advisors || advisors.length === 0) {
    console.log('⚠️  No advisors found in database');
    return agencies;
  }

  // Create normalized name lookup
  const advisorNormalizedNames = new Set(
    advisors.map(advisor => normalizeName(advisor.name))
  );

  // Find agencies that don't exist in our database
  const unmatched = agencies.filter(agency => {
    const normalized = normalizeName(agency.name);
    return !advisorNormalizedNames.has(normalized);
  });

  console.log(`✅ Found ${unmatched.length} agencies not in database (${agencies.length - unmatched.length} already exist)\n`);
  return unmatched;
}

/**
 * Display unmatched agencies
 */
function displayUnmatched(agencies: AgencyData[]) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 AGENCIES TO BE ADDED (UNPUBLISHED)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Group by country
  const byCountry = agencies.reduce((acc, agency) => {
    if (!acc[agency.country]) {
      acc[agency.country] = [];
    }
    acc[agency.country].push(agency);
    return acc;
  }, {} as Record<string, AgencyData[]>);

  for (const [country, countryAgencies] of Object.entries(byCountry)) {
    console.log(`\n${country === 'CA' ? '🇨🇦 CANADA' : '🇺🇸 USA'} (${countryAgencies.length} agencies)\n`);

    countryAgencies.forEach((agency, index) => {
      console.log(`${index + 1}. ${agency.name}`);
      console.log(`   Clients: ${agency.clientCount}`);
      console.log(`   Status: Will be added as UNPUBLISHED`);
      console.log('');
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Add agencies to database
 */
async function addAgenciesToDatabase(agencies: AgencyData[]) {
  console.log('💾 Adding agencies to database...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const agency of agencies) {
    const slug = generateSlug(agency.name);

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('advisors')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      console.log(`⚠️  Skipped ${agency.name}: Slug already exists`);
      errorCount++;
      continue;
    }

    // Insert new advisor (UNPUBLISHED)
    const { error } = await supabase
      .from('advisors')
      .insert({
        name: agency.name,
        slug: slug,
        clients_served: agency.clientCount,
        country: agency.country,
        is_published: false,  // UNPUBLISHED by default
        is_claimed: false,
        is_verified: false,
        data_quality_score: 25, // Low score since we only have name + client count
        needs_review: true,     // Flag for manual review
      });

    if (error) {
      console.error(`❌ Failed to add ${agency.name}:`, error.message);
      errorCount++;
    } else {
      console.log(`✅ Added ${agency.name} (${agency.clientCount} clients) - UNPUBLISHED`);
      successCount++;
    }
  }

  console.log(`\n✨ Successfully added ${successCount} agencies`);
  if (errorCount > 0) {
    console.log(`⚠️  Failed to add ${errorCount} agencies`);
  }

  console.log('\n📝 NOTE: All agencies added as UNPUBLISHED.');
  console.log('   Use your dashboard to review and publish them.\n');
}

/**
 * Main function
 */
async function main() {
  console.log('🏒 Add Missing Agencies from Elite Prospects\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made to database\n');
  }

  try {
    // Step 1: Load agencies
    const agencies = await loadAgencies();

    if (agencies.length === 0) {
      console.log('⚠️  No agencies found. Exiting.');
      return;
    }

    // Step 2: Find unmatched agencies
    const unmatched = await findUnmatchedAgencies(agencies);

    if (unmatched.length === 0) {
      console.log('✅ All agencies from Elite Prospects are already in your database!');
      return;
    }

    // Step 3: Display unmatched agencies
    displayUnmatched(unmatched);

    // Step 4: Add to database (unless dry run)
    if (!isDryRun) {
      await addAgenciesToDatabase(unmatched);
    } else {
      console.log('ℹ️  Dry run complete. Use without --dry-run to add agencies.\n');
    }

    console.log('✅ Done!\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
