import { Metadata } from 'next'
import Link from 'next/link'
import { TaggedDirectoryResults } from '@/components/search/TaggedDirectoryResults'
import { searchDirectory } from '@/lib/tags/directory-search'
import { queryParams, type QueryValues } from '@/lib/tags/filter-state'
import { AdvisorFilters } from '@/components/search/AdvisorFilters'
import { ComparisonTray } from '@/components/listing/ComparisonTray'

interface ListingsPageProps {
  searchParams: Promise<QueryValues & {
    tag?: string | string[]
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
  let results
  try { results = await searchDirectory(queryParams(params)) } catch {
    return <main className="mx-auto max-w-5xl p-8"><h1 className="text-3xl font-bold">Directory temporarily unavailable</h1><p className="mt-4">Results could not be loaded. Please try again shortly.</p><Link href="/listings" className="mt-4 inline-flex min-h-11 items-center text-hockey-blue underline">Try again</Link></main>
  }

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
            Find advisors by their services, pathways and player fit, then review their profiles before making contact.
          </p>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <AdvisorFilters initialData={results} />
          </aside>

          {/* Search Results */}
          <div className="min-w-0 flex-1">
            <TaggedDirectoryResults key={queryParams(params).toString()} data={results} />
          </div>
        </div>
      </div>
      <ComparisonTray />
    </div>
  )
}
