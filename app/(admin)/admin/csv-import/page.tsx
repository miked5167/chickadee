import { Metadata } from 'next'
import { CsvImporter } from '@/components/admin/CsvImporter'

export const metadata: Metadata = {
  title: 'CSV Import - Admin',
  description: 'Bulk import advisor listings from CSV',
}

export default function CsvImportPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">CSV Import</h1>
        <p className="text-gray-600">
          Bulk import advisor listings from a CSV file. Files are validated before import.
        </p>
      </div>

      <CsvImporter />
    </div>
  )
}
