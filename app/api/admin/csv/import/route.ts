import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/supabase/auth'
import { parseCsvText, importAdvisorsFromCsv, logCsvImport } from '@/lib/utils/csv-import'

/**
 * POST /api/admin/csv/import
 * Imports advisors from CSV file
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const [admin, user] = await Promise.all([isAdmin(), getCurrentUser()])

    if (!admin || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get file and options from form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const geocode = formData.get('geocode') === 'true'
    const skipDuplicates = formData.get('skipDuplicates') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 })
    }

    // Read file content
    const csvText = await file.text()

    // Parse CSV
    const csvData = parseCsvText(csvText)

    if (csvData.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 })
    }

    // Import advisors
    const result = await importAdvisorsFromCsv(csvData, {
      geocode,
      skipDuplicates,
    })

    // Log the import
    await logCsvImport(
      user.id,
      file.name,
      csvData.length,
      result.imported,
      result.skipped + result.errors.length,
      result.errors
    )

    // Return results
    return NextResponse.json(result)
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json(
      {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : 'Unknown import error'],
      },
      { status: 500 }
    )
  }
}
