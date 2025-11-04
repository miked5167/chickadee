import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface CSVRow {
  advisor_name: string
  title: string
  'openingHours/0/day': string
  'openingHours/0/hours': string
  'openingHours/1/day': string
  'openingHours/1/hours': string
  'openingHours/2/day': string
  'openingHours/2/hours': string
  'openingHours/3/day': string
  'openingHours/3/hours': string
  'openingHours/4/day': string
  'openingHours/4/hours': string
  'openingHours/5/day': string
  'openingHours/5/hours': string
  'openingHours/6/day': string
  'openingHours/6/hours': string
  'linkedIns/0': string
  'instagrams/0': string
  'twitters/0': string
  'facebooks/0': string
  'youtubes/0': string
  'emails/0': string
}

async function importBusinessHours() {
  console.log('Starting business hours import...\n')

  // Read CSV file
  const csvPath = 'c:\\Users\\miked\\OneDrive\\Desktop\\The Hockey Directory\\Advisor Info\\Final Advisor Listing Nov 2 2025.csv'

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at: ${csvPath}`)
    process.exit(1)
  }

  let fileContent = fs.readFileSync(csvPath, 'utf-8')

  // Remove BOM (Byte Order Mark) if present
  if (fileContent.charCodeAt(0) === 0xFEFF) {
    fileContent = fileContent.slice(1)
  }

  const records: CSVRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true // Handle BOM
  })

  console.log(`Found ${records.length} records in CSV`)

  // Debug: show first record's keys
  if (records.length > 0) {
    const firstRecord = records[0] as any
    console.log('First 10 column names:', Object.keys(firstRecord).slice(0, 10))
    console.log('Sample data:', { title: firstRecord.title, advisor_name: firstRecord.advisor_name })
  }
  console.log()

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const row of records) {
    try {
      const advisorName = row.title?.trim()

      if (!advisorName) {
        skipped++
        continue
      }

      // Parse business hours from CSV
      const businessHours: Record<string, string> = {}

      for (let i = 0; i <= 6; i++) {
        const dayKey = `openingHours/${i}/day` as keyof CSVRow
        const hoursKey = `openingHours/${i}/hours` as keyof CSVRow

        const day = row[dayKey]?.trim()
        const hours = row[hoursKey]?.trim()

        if (day && hours) {
          // Clean up hours format (remove special characters)
          const cleanHours = hours
            .replace(/[​‌‍]/g, '') // Remove zero-width characters
            .replace(/\?/g, '') // Remove question marks
            .trim()

          businessHours[day] = cleanHours
        }
      }

      // Parse social links
      const socialUpdates: any = {}

      if (row['linkedIns/0']?.trim()) {
        socialUpdates.linkedin_url = row['linkedIns/0'].trim()
      }
      if (row['instagrams/0']?.trim()) {
        socialUpdates.instagram_url = row['instagrams/0'].trim()
      }
      if (row['twitters/0']?.trim()) {
        socialUpdates.twitter_url = row['twitters/0'].trim()
      }
      if (row['facebooks/0']?.trim()) {
        socialUpdates.facebook_url = row['facebooks/0'].trim()
      }
      if (row['youtubes/0']?.trim()) {
        socialUpdates.youtube_url = row['youtubes/0'].trim()
      }

      // Only update if we have business hours
      if (Object.keys(businessHours).length > 0) {
        socialUpdates.business_hours = businessHours
      }

      if (Object.keys(socialUpdates).length === 0) {
        skipped++
        continue
      }

      // Find advisor by name (case-insensitive)
      const { data: advisors, error: findError } = await supabase
        .from('advisors')
        .select('id, name')
        .ilike('name', advisorName)

      if (findError) {
        console.error(`Error finding advisor "${advisorName}":`, findError.message)
        errors++
        continue
      }

      if (!advisors || advisors.length === 0) {
        // Debug: show first few failures
        if (skipped < 5) {
          console.warn(`⚠️  Advisor not found: "${advisorName}" (length: ${advisorName.length})`)
        }
        skipped++
        continue
      }

      if (advisors.length > 1) {
        console.warn(`⚠️  Multiple matches for "${advisorName}", using first match`)
      }

      const advisor = advisors[0]

      // Update advisor with business hours and social links
      const { error: updateError } = await supabase
        .from('advisors')
        .update(socialUpdates)
        .eq('id', advisor.id)

      if (updateError) {
        console.error(`Error updating advisor "${advisorName}":`, updateError.message)
        errors++
        continue
      }

      console.log(`✓ Updated: ${advisorName}`)
      updated++
    } catch (error) {
      console.error(`Error processing row for "${row.title}":`, error)
      errors++
    }
  }

  console.log(`
Import completed:
  ✓ Updated: ${updated}
  ⊘ Skipped: ${skipped}
  ✗ Errors: ${errors}
  `)
}

// Run the import
importBusinessHours().catch(console.error)
