/**
 * Transform the Google Maps CSV export to match our database schema
 */

import * as fs from 'fs'
import * as path from 'path'

const inputCsvPath = 'c:\\Users\\miked\\OneDrive\\Desktop\\The Hockey Directory\\Advisor Info\\Final Advisor Listing Nov 2 2025.csv'
const outputCsvPath = path.join(__dirname, '../data/transformed-advisors.csv')

// Read the CSV file
const csvContent = fs.readFileSync(inputCsvPath, 'utf-8')
const lines = csvContent.split('\n')
const headers = lines[0].split(',')

console.log('Original headers:', headers.slice(0, 10))

// Map column indices
const getColIndex = (name: string) => headers.findIndex(h => h.trim() === name)

const colMap = {
  title: getColIndex('title'),
  website: getColIndex('website'),
  street: getColIndex('street'),
  city: getColIndex('city'),
  state: getColIndex('state'),
  postalCode: getColIndex('postalCode'),
  countryCode: getColIndex('countryCode'),
  phone: getColIndex('phone'),
  advisor_name: getColIndex('advisor_name'),
  email: getColIndex('emails/0'),
  year_established: getColIndex('year_established'),
  twitter: getColIndex('twitters/0'),
  youtube: getColIndex('youtubes/0'),
  facebook: getColIndex('facebooks/0'),
  instagram: getColIndex('instagrams/0'),
  linkedin: getColIndex('linkedIns/0'),
  lat: getColIndex('location/lat'),
  lng: getColIndex('location/lng'),
}

console.log('Column mapping:', colMap)

// Output CSV headers matching our schema
const outputHeaders = [
  'name',
  'email',
  'phone',
  'website_url',
  'address',
  'city',
  'state',
  'zip_code',
  'country',
  'description',
  'years_in_business',
  'linkedin_url',
  'instagram_url',
  'twitter_url',
  'facebook_url',
  'logo_url',
  'is_published',
  'is_featured',
]

let outputLines: string[] = [outputHeaders.join(',')]

// Process each data row
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim()
  if (!line) continue

  // Parse CSV line (handling quoted values)
  const values: string[] = []
  let currentValue = ''
  let insideQuotes = false

  for (let j = 0; j < line.length; j++) {
    const char = line[j]

    if (char === '"') {
      insideQuotes = !insideQuotes
    } else if (char === ',' && !insideQuotes) {
      values.push(currentValue.trim())
      currentValue = ''
    } else {
      currentValue += char
    }
  }
  values.push(currentValue.trim()) // Add last value

  // Skip if not enough columns
  if (values.length < 10) {
    console.log(`Skipping row ${i}: insufficient columns`)
    continue
  }

  // Extract and clean data
  const name = values[colMap.title]?.replace(/^"|"$/g, '') || ''
  const email = values[colMap.email]?.replace(/^"|"$/g, '') || ''
  const phone = values[colMap.phone]?.replace(/^"|"$/g, '') || ''
  const website_url = values[colMap.website]?.replace(/^"|"$/g, '') || ''
  const address = values[colMap.street]?.replace(/^"|"$/g, '') || ''
  const city = values[colMap.city]?.replace(/^"|"$/g, '') || ''
  const state = values[colMap.state]?.replace(/^"|"$/g, '') || ''
  const zip_code = values[colMap.postalCode]?.replace(/^"|"$/g, '') || ''
  const country = values[colMap.countryCode]?.replace(/^"|"$/g, '') || 'US'
  const years_in_business = values[colMap.year_established]?.replace(/^"|"$/g, '') || ''
  const linkedin_url = values[colMap.linkedin]?.replace(/^"|"$/g, '') || ''
  const instagram_url = values[colMap.instagram]?.replace(/^"|"$/g, '') || ''
  const twitter_url = values[colMap.twitter]?.replace(/^"|"$/g, '') || ''
  const facebook_url = values[colMap.facebook]?.replace(/^"|"$/g, '') || ''

  // Skip if missing required fields (only name is truly required)
  if (!name) {
    console.log(`Skipping row ${i}: missing name`)
    continue
  }

  // Use placeholders for missing location data
  const finalCity = city || state || 'Unknown'
  const finalState = state || 'XX'

  // For email, if it's empty, use a placeholder (we'll need to update this logic)
  const finalEmail = email || `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`

  // Create output row
  const outputRow = [
    `"${name}"`,
    `"${finalEmail}"`,
    `"${phone}"`,
    `"${website_url}"`,
    `"${address}"`,
    `"${finalCity}"`,
    `"${finalState}"`,
    `"${zip_code}"`,
    `"${country}"`,
    `""`, // description
    `"${years_in_business}"`,
    `"${linkedin_url}"`,
    `"${instagram_url}"`,
    `"${twitter_url}"`,
    `"${facebook_url}"`,
    `""`, // logo_url
    `"true"`, // is_published
    `"false"`, // is_featured
  ]

  outputLines.push(outputRow.join(','))
}

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Write transformed CSV
fs.writeFileSync(outputCsvPath, outputLines.join('\n'), 'utf-8')

console.log(`\n✅ Transformed ${outputLines.length - 1} advisors`)
console.log(`📁 Output file: ${outputCsvPath}`)
