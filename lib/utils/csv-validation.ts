import { z } from 'zod'

// US/Canada phone number validation (flexible format)
const phoneRegex = /^[\d\s\-\(\)\.+]+$/
const phoneSchema = z
  .string()
  .regex(phoneRegex, 'Invalid phone number format')
  .optional()
  .or(z.literal(''))

// Email validation
const emailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase()

// URL validation
const urlSchema = z
  .string()
  .url('Invalid URL format')
  .optional()
  .or(z.literal(''))

// US/Canada state codes (2-letter) - XX is allowed as placeholder for unknown
const stateCodeRegex = /^[A-Z]{2}$/
const stateSchema = z
  .string()
  .length(2, 'State must be 2-letter code')
  .regex(stateCodeRegex, 'State must be uppercase 2-letter code')
  .transform((val) => val.toUpperCase())
  .optional()
  .or(z.literal(''))
  .default('XX')

// Zip code validation (US: 5 digits, Canada: A1A 1A1)
const zipCodeRegex = /^(\d{5}(-\d{4})?|[A-Z]\d[A-Z]\s?\d[A-Z]\d)$/i
const zipCodeSchema = z
  .string()
  .regex(zipCodeRegex, 'Invalid zip/postal code format')
  .optional()
  .or(z.literal(''))

// Slug generation helper
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}

// CSV Row Schema
export const advisorCsvSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema,
  website_url: urlSchema,
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')).default('Unknown'),
  state: stateSchema,
  zip_code: zipCodeSchema,
  country: z
    .string()
    .length(2, 'Country must be 2-letter code')
    .default('US')
    .transform((val) => val.toUpperCase()),

  // Business details
  description: z.string().optional().or(z.literal('')),
  years_in_business: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? parseInt(val) : null)),
  services_offered: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val.split(',').map((s) => s.trim()) : [])),
  specialties: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val.split(',').map((s) => s.trim()) : [])),
  price_range: z.string().optional().or(z.literal('')),
  certification_info: z.string().optional().or(z.literal('')),

  // Social links
  linkedin_url: urlSchema,
  instagram_url: urlSchema,
  twitter_url: urlSchema,
  facebook_url: urlSchema,

  // Logo
  logo_url: urlSchema,

  // Status
  is_published: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => val === 'true' || val === '1')
    .default(false),
  is_featured: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => val === 'true' || val === '1')
    .default(false),
})

export type AdvisorCsvRow = z.infer<typeof advisorCsvSchema>

// Validation result type
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  data?: AdvisorCsvRow
}

// Validate a single CSV row
export function validateAdvisorRow(
  row: Record<string, string>,
  rowNumber: number
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const validatedData = advisorCsvSchema.parse(row)

    // Additional validation warnings
    if (!validatedData.description) {
      warnings.push('Missing description - data quality score will be lower')
    }
    if (!validatedData.phone) {
      warnings.push('Missing phone number - data quality score will be lower')
    }
    if (!validatedData.website_url) {
      warnings.push('Missing website URL - data quality score will be lower')
    }
    if (!validatedData.address) {
      warnings.push('Missing address - geocoding will not work')
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      data: validatedData,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(
        ...error.issues.map(
          (err) => `Row ${rowNumber}: ${err.path.join('.')} - ${err.message}`
        )
      )
    } else {
      errors.push(`Row ${rowNumber}: Unknown validation error`)
    }

    return {
      isValid: false,
      errors,
      warnings,
    }
  }
}

// Validate entire CSV dataset
export function validateCsvData(
  data: Record<string, string>[]
): {
  validRows: AdvisorCsvRow[]
  invalidRows: Array<{ row: Record<string, string>; errors: string[]; rowNumber: number }>
  warnings: Array<{ rowNumber: number; warnings: string[] }>
  summary: {
    total: number
    valid: number
    invalid: number
    withWarnings: number
  }
} {
  const validRows: AdvisorCsvRow[] = []
  const invalidRows: Array<{ row: Record<string, string>; errors: string[]; rowNumber: number }> =
    []
  const warnings: Array<{ rowNumber: number; warnings: string[] }> = []

  data.forEach((row, index) => {
    const rowNumber = index + 2 // +2 because row 1 is header, and index is 0-based
    const result = validateAdvisorRow(row, rowNumber)

    if (result.isValid && result.data) {
      validRows.push(result.data)
      if (result.warnings.length > 0) {
        warnings.push({ rowNumber, warnings: result.warnings })
      }
    } else {
      invalidRows.push({ row, errors: result.errors, rowNumber })
    }
  })

  return {
    validRows,
    invalidRows,
    warnings,
    summary: {
      total: data.length,
      valid: validRows.length,
      invalid: invalidRows.length,
      withWarnings: warnings.length,
    },
  }
}

// Check for duplicate emails
export function checkDuplicates(rows: AdvisorCsvRow[]): {
  duplicates: Array<{ email: string; count: number; rows: number[] }>
  hasDuplicates: boolean
} {
  const emailMap = new Map<string, number[]>()

  rows.forEach((row, index) => {
    const email = row.email.toLowerCase()
    if (!emailMap.has(email)) {
      emailMap.set(email, [])
    }
    emailMap.get(email)!.push(index + 2) // +2 for header and 0-based index
  })

  const duplicates = Array.from(emailMap.entries())
    .filter(([_, rows]) => rows.length > 1)
    .map(([email, rows]) => ({
      email,
      count: rows.length,
      rows,
    }))

  return {
    duplicates,
    hasDuplicates: duplicates.length > 0,
  }
}
