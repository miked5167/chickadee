/**
 * Remove advisor names from the start of descriptions
 * Pattern: "Advisor Name: Description" -> "Description"
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Supabase credentials are required');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function removeNamesFromDescriptions() {
  try {
    console.log('Fetching advisors with name prefix in descriptions...');

    // Fetch all advisors that have their name at the start of description
    const { data: advisors, error } = await supabase
      .from('advisors')
      .select('id, name, description')
      .not('description', 'is', null);

    if (error) {
      throw error;
    }

    if (!advisors || advisors.length === 0) {
      console.log('No advisors found');
      return;
    }

    console.log(`Found ${advisors.length} total advisors with descriptions`);

    let updatedCount = 0;
    const updates = [];

    for (const advisor of advisors) {
      const name = advisor.name;
      const description = advisor.description;

      if (!description) continue;

      // Check if description starts with "Name: " (case-insensitive)
      const namePrefixPattern = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*`, 'i');

      if (namePrefixPattern.test(description)) {
        // Find the actual prefix to remove (preserving original case)
        const match = description.match(namePrefixPattern);
        if (!match) continue;

        // Remove the name prefix
        let newDescription = description.substring(match[0].length).trim();

        // If it starts with a newline, remove it
        newDescription = newDescription.replace(/^\n+/, '');

        updates.push({
          id: advisor.id,
          name: advisor.name,
          oldStart: description.substring(0, 60),
          newStart: newDescription.substring(0, 60)
        });

        // Update the database
        const { error: updateError } = await supabase
          .from('advisors')
          .update({ description: newDescription })
          .eq('id', advisor.id);

        if (updateError) {
          console.error(`Error updating ${advisor.name}:`, updateError);
        } else {
          updatedCount++;
          console.log(`✓ Updated ${advisor.name}`);
        }
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total advisors checked: ${advisors.length}`);
    console.log(`Descriptions updated: ${updatedCount}`);

    if (updates.length > 0) {
      console.log('\n=== Sample Updates ===');
      updates.slice(0, 5).forEach(update => {
        console.log(`\n${update.name}:`);
        console.log(`  Before: ${update.oldStart}...`);
        console.log(`  After:  ${update.newStart}...`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

removeNamesFromDescriptions();
