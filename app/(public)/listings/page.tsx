import { Metadata } from 'next'
import { Suspense } from 'react'
import { SearchResults } from '@/components/search/SearchResults'
import { AdvisorFilters } from '@/components/search/AdvisorFilters'

export const metadata: Metadata = {
  title: 'Search Hockey Advisors | The Hockey Directory',
  description:
    'Find and compare hockey advisors across North America. Filter by location, specialty, and rating to find the perfect advisor for your hockey journey.',
}

interface ListingsPageProps {
  searchParams: Promise<{
    location?: string
    lat?: string
    lng?: string
    radius?: string
    specialty?: string
    minRating?: string
    country?: string
    state?: string
    sort?: string
    page?: string
    search?: string
    featured?: string
    priceRange?: string
    pricingStructure?: string
  }>
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const params = await searchParams

  // Build dynamic title based on search
  const pageTitle = params.search
    ? `Hockey Advisors matching "${params.search}"`
    : params.location
    ? `Hockey Advisors near ${params.location}`
    : 'Search Hockey Advisors'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {pageTitle}
          </h1>
          <p className="text-gray-600">
            Find verified hockey advisors to help guide your player's journey
          </p>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <AdvisorFilters showLocationFilters={!!params.lat} />
          </aside>

          {/* Search Results */}
          <div className="flex-1">
            <Suspense
              fallback={
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hockey-blue mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading advisors...</p>
                </div>
              }
            >
              <SearchResults searchParams={params} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
