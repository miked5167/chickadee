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

// Map full state/province names to 2-letter codes
function normalizeStateCode(state: string, country: string): string {
  if (!state) return ''

  const stateUpper = state.trim().toUpperCase()

  // Already a 2-letter code
  if (stateUpper.length === 2) return stateUpper

  // Canadian provinces
  const canadianProvinces: Record<string, string> = {
    'ALBERTA': 'AB',
    'BRITISH COLUMBIA': 'BC',
    'MANITOBA': 'MB',
    'NEW BRUNSWICK': 'NB',
    'NEWFOUNDLAND AND LABRADOR': 'NL',
    'NORTHWEST TERRITORIES': 'NT',
    'NOVA SCOTIA': 'NS',
    'NUNAVUT': 'NU',
    'ONTARIO': 'ON',
    'PRINCE EDWARD ISLAND': 'PE',
    'QUEBEC': 'QC',
    'SASKATCHEWAN': 'SK',
    'YUKON': 'YT',
  }

  // US states
  const usStates: Record<string, string> = {
    'ALABAMA': 'AL',
    'ALASKA': 'AK',
    'ARIZONA': 'AZ',
    'ARKANSAS': 'AR',
    'CALIFORNIA': 'CA',
    'COLORADO': 'CO',
    'CONNECTICUT': 'CT',
    'DELAWARE': 'DE',
    'FLORIDA': 'FL',
    'GEORGIA': 'GA',
    'HAWAII': 'HI',
    'IDAHO': 'ID',
    'ILLINOIS': 'IL',
    'INDIANA': 'IN',
    'IOWA': 'IA',
    'KANSAS': 'KS',
    'KENTUCKY': 'KY',
    'LOUISIANA': 'LA',
    'MAINE': 'ME',
    'MARYLAND': 'MD',
    'MASSACHUSETTS': 'MA',
    'MICHIGAN': 'MI',
    'MINNESOTA': 'MN',
    'MISSISSIPPI': 'MS',
    'MISSOURI': 'MO',
    'MONTANA': 'MT',
    'NEBRASKA': 'NE',
    'NEVADA': 'NV',
    'NEW HAMPSHIRE': 'NH',
    'NEW JERSEY': 'NJ',
    'NEW MEXICO': 'NM',
    'NEW YORK': 'NY',
    'NORTH CAROLINA': 'NC',
    'NORTH DAKOTA': 'ND',
    'OHIO': 'OH',
    'OKLAHOMA': 'OK',
    'OREGON': 'OR',
    'PENNSYLVANIA': 'PA',
    'RHODE ISLAND': 'RI',
    'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD',
    'TENNESSEE': 'TN',
    'TEXAS': 'TX',
    'UTAH': 'UT',
    'VERMONT': 'VT',
    'VIRGINIA': 'VA',
    'WASHINGTON': 'WA',
    'WEST VIRGINIA': 'WV',
    'WISCONSIN': 'WI',
    'WYOMING': 'WY',
  }

  // Check appropriate mapping based on country
  if (country === 'CA' && canadianProvinces[stateUpper]) {
    return canadianProvinces[stateUpper]
  } else if (country === 'US' && usStates[stateUpper]) {
    return usStates[stateUpper]
  }

  // Try both mappings if no country match
  return canadianProvinces[stateUpper] || usStates[stateUpper] || state
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
    'Final Advisor Listing Nov 2 2025.csv'
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
    const email = row['emails/0'] || null

    if (!name) {
      console.warn(`Row ${i + 1}: Missing name, skipping`)
      skipped++
      continue
    }

    // Check if email already exists (only if email is provided)
    if (email) {
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
    }

    const slug = generateSlug(name)
    const latitude = row['location/lat'] ? parseFloat(row['location/lat']) : null
    const longitude = row['location/lng'] ? parseFloat(row['location/lng']) : null

    // Extract country code (US, CA, etc.)
    let country = row.countryCode || 'US'
    if (country === 'USA') country = 'US'
    if (country === 'Canada') country = 'CA'

    // Normalize state/province code
    let state = normalizeStateCode(row.state || '', country)
    if (row.state && !state) {
      console.warn(
        `Row ${i + 1}: ${name} - Could not normalize state: ${row.state}, using as-is`
      )
      state = row.state.substring(0, 2).toUpperCase()
    }

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
        email: email ? email.toLowerCase() : null,
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
        const location = row.city ? `${row.city}, ${state}` : state || 'location unknown'
        const contact = email || 'no email'
        console.log(`✓ Imported: ${name} (${location}) - ${contact}`)
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
