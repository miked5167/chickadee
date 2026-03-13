'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdvisorCard } from '@/components/listing/AdvisorCard'
import { Pagination } from '@/components/search/Pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FaSearch, FaTimes } from 'react-icons/fa'

interface Advisor {
  id: string
  slug: string
  name: string
  city: string | null
  state: string | null
  country: string
  description: string | null
  verified: boolean
  logo_url: string | null
  website_url?: string | null
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
  hasPrevious: boolean
}

interface SearchResultsProps {
  searchParams: {
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
  }
}

export function SearchResults({ searchParams }: SearchResultsProps) {
  const router = useRouter()
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(searchParams.search || '')

  useEffect(() => {
    const fetchAdvisors = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()

        if (searchParams.country) params.set('country', searchParams.country)
        if (searchParams.state) params.set('state', searchParams.state)
        if (searchParams.sort) params.set('sort', searchParams.sort)
        if (searchParams.page) params.set('page', searchParams.page)
        if (searchParams.search) params.set('search', searchParams.search)

        const response = await fetch(`/api/advisors?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch advisors')
        }

        const data = await response.json()

        setAdvisors(data.advisors || [])
        setPagination(data.pagination || null)
      } catch (err) {
        console.error('Error fetching advisors:', err)
        setError('Failed to load advisors. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchAdvisors()
  }, [searchParams])

  useEffect(() => {
    setSearchInput(searchParams.search || '')
  }, [searchParams.search])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedInput = searchInput.trim()

    const params = new URLSearchParams(window.location.search)

    if (!trimmedInput) {
      params.delete('search')
      params.set('page', '1')
      router.push(`/listings?${params.toString()}`)
      return
    }

    params.set('search', trimmedInput)
    params.set('page', '1')
    router.push(`/listings?${params.toString()}`)
  }

  const removeFilter = (filterKey: string) => {
    const params = new URLSearchParams(window.location.search)
    params.delete(filterKey)
    params.set('page', '1')
    router.push(`/listings?${params.toString()}`)
  }

  const getActiveFilters = () => {
    const filters: Array<{ key: string; label: string }> = []

    if (searchParams.search) {
      filters.push({ key: 'search', label: `Search: "${searchParams.search}"` })
    }

    if (searchParams.country) {
      const countryLabel = searchParams.country === 'US' ? 'United States' : 'Canada'
      filters.push({ key: 'country', label: countryLabel })
    }

    return filters
  }

  const activeFilters = getActiveFilters()

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hockey-blue mx-auto"></div>
        <p className="mt-4 text-gray-600">Searching for advisors...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Text Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Search by name or keyword..."
              value={searchInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
              className="pl-10"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <Button type="submit">
            Search
          </Button>
        </form>
      </div>

      {/* Active Filter Badges */}
      {activeFilters.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <div
                key={`${filter.key}-${index}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-hockey-blue/10 text-hockey-blue rounded-full text-sm border border-hockey-blue/20"
              >
                <span>{filter.label}</span>
                <button
                  onClick={() => removeFilter(filter.key)}
                  className="hover:text-hockey-blue/70 transition-colors"
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="mb-6">
        <p className="text-gray-600">
          {pagination && (
            <>
              Found <span className="font-semibold">{pagination.total}</span>{' '}
              {pagination.total === 1 ? 'advisor' : 'advisors'}
            </>
          )}
        </p>
      </div>

      {/* Empty State */}
      {advisors.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No advisors found
          </h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search filters or expanding your search radius
          </p>
          <a
            href="/listings"
            className="inline-block px-6 py-3 bg-hockey-blue text-white rounded-lg hover:bg-blue-800"
          >
            View All Advisors
          </a>
        </div>
      )}

      {/* Results Grid */}
      {advisors.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {advisors.map((advisor) => (
              <AdvisorCard
                key={advisor.id}
                advisor={advisor}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              hasMore={pagination.hasMore}
              hasPrevious={pagination.hasPrevious}
              searchParams={searchParams}
            />
          )}
        </>
      )}
    </div>
  )
}
