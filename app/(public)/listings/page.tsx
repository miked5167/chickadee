import { Metadata } from 'next'
import { Suspense } from 'react'
import { SearchResults } from '@/components/search/SearchResults'
import { AdvisorFilters } from '@/components/search/AdvisorFilters'
import { ComparisonTray } from '@/components/listing/ComparisonTray'

interface ListingsPageProps {
  searchParams: Promise<{
    location?: string
    lat?: string
    lng?: string
    radius?: string
    specialty?: string
    service?: string
    pathway?: string
    level?: string
    language?: string
    pricing?: string
    remote?: string
    accepting?: string
    minRating?: string
    country?: string
    state?: string
    sort?: string
    page?: string
    search?: string
    featured?: string
    priceRange?: string
    pricingStructure?: string
    verified?: string
  }>
}

export async function generateMetadata({ searchParams }: ListingsPageProps): Promise<Metadata> {
  const params = await searchParams
  const hasFilters = Object.values(params).some(Boolean)

  return {
    title: params.location ? `Hockey Advisors near ${params.location}` : 'Find Hockey Advisors',
    description: 'Search hockey advisor companies by name, location, specialty, or verified business connection across Canada and the United States.',
    alternates: { canonical: '/listings' },
    robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
  }
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
    <div className="min-h-screen bg-ice-white">
      {/* Page Header */}
      <div className="rink-grid border-b-4 border-red-line bg-arena-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-goal-gold">Hockey advisor directory</p>
          <h1 className="font-display text-4xl font-extrabold uppercase leading-none md:text-6xl">
            {pageTitle}
          </h1>
          <p className="mt-3 max-w-2xl text-ice-blue">
            Search 202 company listings, then review the people and details behind each business before making contact.
          </p>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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
      <ComparisonTray />
    </div>
  )
}
