import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/supabase/auth'
import { parseCsvText, validateCsvData } from '@/lib/utils/csv-import'

/**
 * POST /api/admin/csv/validate
 * Validates CSV file without importing
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File

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

    // Validate data
    const validation = validateCsvData(csvData)

    // Return validation results
    return NextResponse.json({
      summary: validation.summary,
      errors: validation.invalidRows.flatMap((row) => row.errors),
      warnings: validation.warnings,
    })
  } catch (error) {
    console.error('CSV validation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to validate CSV',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
