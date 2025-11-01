'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, XCircle, AlertTriangle, Upload, FileText } from 'react-icons/fi'

interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
  geocodingResults?: {
    successful: number
    failed: number
  }
}

interface ValidationSummary {
  total: number
  valid: number
  invalid: number
  withWarnings: number
}

export function CsvImporter() {
  const [file, setFile] = useState<File | null>(null)
  const [validationResult, setValidationResult] = useState<{
    summary: ValidationSummary
    errors: string[]
    warnings: Array<{ rowNumber: number; warnings: string[] }>
  } | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [shouldGeocode, setShouldGeocode] = useState(false)
  const [skipDuplicates, setSkipDuplicates] = useState(true)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setValidationResult(null)
      setImportResult(null)
    }
  }

  const handleValidate = async () => {
    if (!file) return

    setIsValidating(true)
    setValidationResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/csv/validate', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Validation failed')
      }

      const result = await response.json()
      setValidationResult(result)
    } catch (error) {
      console.error('Validation error:', error)
      alert('Failed to validate CSV file')
    } finally {
      setIsValidating(false)
    }
  }

  const handleImport = async () => {
    if (!file || !validationResult) return

    if (validationResult.summary.invalid > 0) {
      alert('Cannot import CSV with invalid rows. Please fix errors first.')
      return
    }

    if (!confirm(`Import ${validationResult.summary.valid} advisors?`)) {
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('geocode', shouldGeocode.toString())
      formData.append('skipDuplicates', skipDuplicates.toString())

      const response = await fetch('/api/admin/csv/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const result = await response.json()
      setImportResult(result)

      // Clear file input after successful import
      if (result.success) {
        setFile(null)
        setValidationResult(null)
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Failed to import CSV file')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Advisors from CSV</CardTitle>
          <CardDescription>
            Upload a CSV file to bulk import advisor listings. The file will be validated before import.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div>
            <label
              htmlFor="csv-file"
              className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-gray-400 focus:outline-none"
            >
              <div className="flex flex-col items-center space-y-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {file ? file.name : 'Click to select CSV file'}
                </span>
              </div>
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Import Options */}
          {file && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-sm">Import Options</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={shouldGeocode}
                    onChange={(e) => setShouldGeocode(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">
                    Geocode addresses (adds lat/lng using Google Maps API)
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Skip duplicate emails</span>
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {file && (
            <div className="flex gap-3">
              <Button
                onClick={handleValidate}
                disabled={isValidating}
                variant="outline"
              >
                {isValidating ? 'Validating...' : 'Validate CSV'}
              </Button>
              {validationResult && validationResult.summary.valid > 0 && (
                <Button
                  onClick={handleImport}
                  disabled={isImporting || validationResult.summary.invalid > 0}
                >
                  {isImporting ? 'Importing...' : `Import ${validationResult.summary.valid} Advisors`}
                </Button>
              )}
            </div>
          )}

          {/* Validation Results */}
          {validationResult && (
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <div className="text-2xl font-bold">{validationResult.summary.total}</div>
                      <div className="text-xs text-gray-600">Total Rows</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold text-green-600">
                        {validationResult.summary.valid}
                      </div>
                      <div className="text-xs text-gray-600">Valid</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <XCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                      <div className="text-2xl font-bold text-red-600">
                        {validationResult.summary.invalid}
                      </div>
                      <div className="text-xs text-gray-600">Invalid</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                      <div className="text-2xl font-bold text-yellow-600">
                        {validationResult.summary.withWarnings}
                      </div>
                      <div className="text-xs text-gray-600">Warnings</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Validation Errors:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {validationResult.errors.slice(0, 10).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                      {validationResult.errors.length > 10 && (
                        <li>... and {validationResult.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Data Quality Warnings:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {validationResult.warnings.slice(0, 5).map((warning, i) => (
                        <li key={i}>
                          Row {warning.rowNumber}: {warning.warnings.join(', ')}
                        </li>
                      ))}
                      {validationResult.warnings.length > 5 && (
                        <li>... and {validationResult.warnings.length - 5} more warnings</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <Alert variant={importResult.success ? 'default' : 'destructive'}>
              {importResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">
                    {importResult.success ? 'Import Completed' : 'Import Failed'}
                  </div>
                  <div className="text-sm">
                    <div>Imported: {importResult.imported} advisors</div>
                    <div>Skipped: {importResult.skipped} advisors</div>
                    {importResult.geocodingResults && (
                      <div className="mt-2">
                        <div>Geocoded: {importResult.geocodingResults.successful} addresses</div>
                        <div>Failed geocoding: {importResult.geocodingResults.failed} addresses</div>
                      </div>
                    )}
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <div className="font-medium">Errors:</div>
                      <ul className="list-disc list-inside text-sm">
                        {importResult.errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Bar */}
          {(isValidating || isImporting) && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                {isValidating ? 'Validating CSV data...' : 'Importing advisors...'}
              </div>
              <Progress value={isImporting ? 50 : 100} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Format Info */}
      <Card>
        <CardHeader>
          <CardTitle>Required CSV Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p>Your CSV file must include the following columns:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
              <li><strong>name</strong> - Business name (required)</li>
              <li><strong>email</strong> - Contact email (required, must be unique)</li>
              <li><strong>city</strong> - City (required)</li>
              <li><strong>state</strong> - 2-letter state/province code (required)</li>
              <li><strong>country</strong> - 2-letter country code (defaults to US)</li>
              <li><strong>phone</strong> - Contact phone number</li>
              <li><strong>website_url</strong> - Website URL</li>
              <li><strong>address</strong> - Street address</li>
              <li><strong>zip_code</strong> - Postal/ZIP code</li>
              <li><strong>description</strong> - Business description</li>
              <li>And more optional fields (social media, specialties, etc.)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
