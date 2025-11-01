/**
 * Script to import advisors from the CSV file
 * Run with: npx tsx scripts/import-advisors.ts
 */

import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// CSV column mapping
interface CsvRow {
  title: string
  website: string
  street: string
  city: string
  state: string
  postalCode: string
  countryCode: string
  phone: string
  advisor_name: string
  'emails/0': string
  year_established: string
  'twitters/0': string
  'youtubes/0': string
  'facebooks/0': string
  'instagrams/0': string
  'linkedIns/0': string
  'location/lat': string
  'location/lng': string
}

// Parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result.map((val) => val.replace(/^"|"$/g, ''))
}

// Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Main import function
async function importAdvisors() {
  const csvPath = path.join(
    'C:',
    'Users',
    'miked',
    'OneDrive',
    'Desktop',
    'The Hockey Directory',
    'Advisor Info',
    'Final Hockey Advisor List Oct 28 2025.csv'
  )

  console.log('Reading CSV file...')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const lines = csvContent.split('\n').filter((line) => line.trim())

  // Remove BOM if present
  const headers = lines[0]
    .replace(/^\uFEFF/, '')
    .split(',')
    .map((h) => h.trim().replace(/"/g, ''))

  console.log(`Found ${lines.length - 1} advisors in CSV`)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0 || !values[0]) continue

    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    // Map CSV to our schema
    const name = row.title || ''
    const email = row['emails/0'] || ''

    if (!name) {
      console.warn(`Row ${i + 1}: Missing name, skipping`)
      skipped++
      continue
    }

    if (!email) {
      console.warn(`Row ${i + 1}: ${name} - Missing email, skipping`)
      skipped++
      continue
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('advisors')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      console.log(`Row ${i + 1}: ${name} - Email already exists, skipping`)
      skipped++
      continue
    }

    const slug = generateSlug(name)
    const latitude = row['location/lat'] ? parseFloat(row['location/lat']) : null
    const longitude = row['location/lng'] ? parseFloat(row['location/lng']) : null

    // Extract country code (US, CA, etc.)
    let country = row.countryCode || 'US'
    if (country === 'USA') country = 'US'
    if (country === 'Canada') country = 'CA'

    // State code validation
    let state = row.state || ''
    if (state.length > 2) {
      console.warn(`Row ${i + 1}: ${name} - State code too long: ${state}, skipping`)
      skipped++
      continue
    }
    state = state.toUpperCase()

    // Build description from advisor_name if available
    let description = ''
    if (row.advisor_name && row.advisor_name !== name) {
      description = `Advisor: ${row.advisor_name}`
    }

    // Calculate years in business
    let yearsInBusiness = null
    if (row.year_established) {
      const yearEst = parseInt(row.year_established)
      if (!isNaN(yearEst)) {
        yearsInBusiness = new Date().getFullYear() - yearEst
      }
    }

    try {
      const { error } = await supabase.from('advisors').insert({
        name,
        slug,
        email: email.toLowerCase(),
        phone: row.phone || null,
        website_url: row.website || null,
        address: row.street || null,
        city: row.city || null,
        state: state || null,
        zip_code: row.postalCode || null,
        country,
        latitude,
        longitude,
        description: description || null,
        years_in_business: yearsInBusiness,
        twitter_url: row['twitters/0'] || null,
        facebook_url: row['facebooks/0'] || null,
        instagram_url: row['instagrams/0'] || null,
        linkedin_url: row['linkedIns/0'] || null,
        is_published: true,
        is_featured: false,
      })

      if (error) {
        console.error(`Row ${i + 1}: ${name} - Error:`, error.message)
        errors.push(`${name}: ${error.message}`)
        skipped++
      } else {
        imported++
        console.log(`✓ Imported: ${name} (${email})`)
      }
    } catch (err) {
      console.error(`Row ${i + 1}: ${name} - Exception:`, err)
      errors.push(`${name}: ${err}`)
      skipped++
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log('\n=== Import Complete ===')
  console.log(`Total rows: ${lines.length - 1}`)
  console.log(`Imported: ${imported}`)
  console.log(`Skipped: ${skipped}`)

  if (errors.length > 0) {
    console.log('\nErrors:')
    errors.forEach((err) => console.log(`  - ${err}`))
  }

  // Update PostGIS locations for advisors with lat/lng
  console.log('\nUpdating PostGIS locations...')
  const { error: updateError } = await supabase.rpc('update_postgis_locations')

  if (updateError) {
    console.error('Failed to update PostGIS locations:', updateError)
  } else {
    console.log('✓ PostGIS locations updated')
  }
}

// Run the import
importAdvisors()
  .then(() => {
    console.log('\n✓ Import script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n✗ Import failed:', error)
    process.exit(1)
  })
