import { createAdminClient } from '@/lib/supabase/server'
import { geocodeAddress } from './geocoding'
import {
  validateCsvData,
  checkDuplicates,
  generateSlug,
  type AdvisorCsvRow,
} from './csv-validation'

/**
 * Parse CSV text to array of objects
 */
export function parseCsvText(csvText: string): Record<string, string>[] {
  const lines = csvText.split('\n').filter((line) => line.trim())
  if (lines.length === 0) return []

  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0) continue

    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }

  return rows
}

/**
 * Parse a CSV line handling quoted values
 */
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

/**
 * Import advisors from CSV data to database
 */
export async function importAdvisorsFromCsv(
  csvData: Record<string, string>[],
  options: {
    geocode?: boolean
    skipDuplicates?: boolean
  } = {}
): Promise<{
  success: boolean
  imported: number
  skipped: number
  errors: string[]
  geocodingResults?: {
    successful: number
    failed: number
  }
}> {
  const errors: string[] = []
  let imported = 0
  let skipped = 0
  let geocodingSuccessful = 0
  let geocodingFailed = 0

  try {
    // Validate CSV data
    const validation = validateCsvData(csvData)

    if (validation.summary.invalid > 0) {
      validation.invalidRows.forEach((row) => {
        errors.push(...row.errors)
      })
    }

    if (validation.validRows.length === 0) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: ['No valid rows to import', ...errors],
      }
    }

    // Check for duplicates within CSV
    const duplicateCheck = checkDuplicates(validation.validRows)
    if (duplicateCheck.hasDuplicates && !options.skipDuplicates) {
      duplicateCheck.duplicates.forEach((dup) => {
        errors.push(
          `Duplicate email '${dup.email}' found in rows: ${dup.rows.join(', ')}`
        )
      })
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors,
      }
    }

    const supabase = createAdminClient()

    // Check for existing emails in database
    const emails = validation.validRows
      .map((row) => row.email?.toLowerCase())
      .filter((email): email is string => email !== undefined)

    const { data: existingAdvisors } = await supabase
      .from('advisors')
      .select('email')
      .in('email', emails)

    const existingEmails = new Set(
      existingAdvisors?.map((a) => a.email?.toLowerCase()).filter((e): e is string => e !== undefined) || []
    )

    // Prepare advisors for insert
    const advisorsToInsert = []

    for (const row of validation.validRows) {
      if (!row.email) {
        errors.push(`Row missing email: ${row.name}`)
        continue
      }

      const email = row.email.toLowerCase()

      if (existingEmails.has(email)) {
        if (options.skipDuplicates) {
          skipped++
          continue
        } else {
          errors.push(`Email ${email} already exists in database`)
          continue
        }
      }

      // Generate slug
      const slug = generateSlug(row.name)

      // Geocode if requested and address available
      let latitude: number | null = null
      let longitude: number | null = null

      if (options.geocode && row.address) {
        const geocodeResult = await geocodeAddress(
          row.address,
          row.city,
          row.state,
          row.zip_code,
          row.country
        )

        if (geocodeResult.success) {
          latitude = geocodeResult.latitude ?? null
          longitude = geocodeResult.longitude ?? null
          geocodingSuccessful++
        } else {
          geocodingFailed++
          console.warn(
            `Geocoding failed for ${row.name}: ${geocodeResult.error}`
          )
        }

        // Small delay to respect API rate limits
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      advisorsToInsert.push({
        name: row.name,
        slug,
        email: row.email.toLowerCase(),
        phone: row.phone || null,
        website_url: row.website_url || null,
        address: row.address || null,
        city: row.city,
        state: row.state,
        zip_code: row.zip_code || null,
        country: row.country,
        latitude,
        longitude,
        description: row.description || null,
        years_in_business: row.years_in_business,
        services_offered: row.services_offered,
        specialties: row.specialties,
        price_range: row.price_range || null,
        certification_info: row.certification_info || null,
        linkedin_url: row.linkedin_url || null,
        instagram_url: row.instagram_url || null,
        twitter_url: row.twitter_url || null,
        facebook_url: row.facebook_url || null,
        logo_url: row.logo_url || null,
        is_published: row.is_published,
        is_featured: row.is_featured,
      })
    }

    // Bulk insert
    if (advisorsToInsert.length > 0) {
      const { data, error } = await supabase
        .from('advisors')
        .insert(advisorsToInsert)
        .select('id')

      if (error) {
        errors.push(`Database insert error: ${error.message}`)
        return {
          success: false,
          imported: 0,
          skipped,
          errors,
        }
      }

      imported = data?.length || 0

      // Update PostGIS location field for geocoded advisors
      if (options.geocode) {
        const { error: updateError } = await supabase.rpc('update_postgis_locations')

        if (updateError) {
          console.warn('Failed to update PostGIS locations:', updateError)
          // Don't fail the import for this
        }
      }
    }

    return {
      success: true,
      imported,
      skipped,
      errors,
      geocodingResults: options.geocode
        ? {
            successful: geocodingSuccessful,
            failed: geocodingFailed,
          }
        : undefined,
    }
  } catch (error) {
    console.error('Import error:', error)
    return {
      success: false,
      imported,
      skipped,
      errors: [
        ...errors,
        error instanceof Error ? error.message : 'Unknown import error',
      ],
    }
  }
}

/**
 * Log import to csv_import_logs table
 */
export async function logCsvImport(
  userId: string,
  filename: string,
  totalRows: number,
  successfulRows: number,
  failedRows: number,
  errors: string[]
) {
  const supabase = createAdminClient()

  await supabase.from('csv_import_logs').insert({
    imported_by: userId,
    filename,
    total_rows: totalRows,
    successful_rows: successfulRows,
    failed_rows: failedRows,
    errors: errors.length > 0 ? errors : null,
  })
}
