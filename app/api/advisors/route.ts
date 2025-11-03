import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/advisors
 * Search and filter advisors with location-based queries, full-text search, and pagination
 *
 * Query Parameters:
 * - location: string (city, state, zip)
 * - lat, lng: numbers (coordinates for distance search)
 * - radius: number (search radius in miles: 10, 25, 50, 100, 999)
 * - specialty: string[] (comma-separated specialties)
 * - minRating: number (minimum average rating 1-5)
 * - country: string (filter by country: "US" or "CA")
 * - state: string (state/province for priority sorting: "ON", "QC", "MA", "NY", etc.)
 * - sort: "distance" | "rating" | "reviews" | "name" | "recent"
 * - page: number (default: 1)
 * - limit: number (default: 30, max: 100)
 * - search: string (text search on name/description)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const location = searchParams.get('location')
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null
    const radius = searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : 50
    const specialtyParam = searchParams.get('specialty')
    const specialties = specialtyParam ? specialtyParam.split(',').map(s => s.trim()) : null
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : null
    const country = searchParams.get('country') // "US" or "CA"
    const searchState = searchParams.get('state') // "ON", "QC", "MA", "NY", etc.
    const sort = (searchParams.get('sort') || 'distance') as string
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const limit = Math.min(
      searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 30,
      100
    )
    const searchText = searchParams.get('search')

    const supabase = await createClient()

    // Validate coordinates if provided
    if ((lat !== null || lng !== null) && (lat === null || lng === null)) {
      return NextResponse.json(
        { error: 'Both lat and lng must be provided together' },
        { status: 400 }
      )
    }

    // Start building query
    let query = supabase
      .from('advisors')
      .select('*', { count: 'exact' })
      .eq('is_published', true)

    // Location-based filtering with PostGIS
    // Note: We don't filter out advisors without coordinates here
    // They will be included but with distance: null
    // This allows graceful degradation for advisors with incomplete location data

    // Specialty filtering
    if (specialties && specialties.length > 0) {
      // Use overlaps operator for array contains
      query = query.overlaps('specialties', specialties)
    }

    // Country filtering
    if (country) {
      query = query.eq('country', country)
    }

    // Rating filtering
    if (minRating !== null && minRating > 0) {
      query = query.gte('average_rating', minRating)
    }

    // Text search on name and description
    if (searchText && searchText.trim().length > 0) {
      query = query.or(`name.ilike.%${searchText}%,description.ilike.%${searchText}%`)
    }

    // Execute query
    const { data: advisors, error, count } = await query

    if (error) {
      console.error('Advisors query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch advisors' },
        { status: 500 }
      )
    }

    // Calculate distances if coordinates provided
    let advisorsWithDistance = advisors || []

    if (lat !== null && lng !== null) {
      advisorsWithDistance = (advisors || [])
        .map((advisor) => {
          if (!advisor.latitude || !advisor.longitude) {
            return {
              ...advisor,
              distance: null,
              hasCoordinates: false
            }
          }

          // Haversine formula for distance calculation
          const toRad = (deg: number) => (deg * Math.PI) / 180
          const R = 3959 // Earth radius in miles

          const dLat = toRad(advisor.latitude - lat)
          const dLng = toRad(advisor.longitude - lng)

          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat)) *
              Math.cos(toRad(advisor.latitude)) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2)

          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
          const distance = R * c

          return {
            ...advisor,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal
            hasCoordinates: true
          }
        })
        .filter((advisor) => {
          // Only filter out advisors WITH coordinates that are outside the radius
          // Keep advisors without coordinates (they'll appear at the end)
          if (advisor.distance === null) return true
          return advisor.distance <= radius
        })
    } else {
      // No location search - mark all advisors
      advisorsWithDistance = (advisors || []).map((advisor) => ({
        ...advisor,
        hasCoordinates: !!(advisor.latitude && advisor.longitude)
      }))
    }

    // Sorting
    let sortedAdvisors = [...advisorsWithDistance]

    switch (sort) {
      case 'distance':
        if (lat !== null && lng !== null) {
          sortedAdvisors.sort((a, b) => {
            // Priority 1: Same state/province as search location
            if (searchState) {
              const aIsSameState = a.state === searchState
              const bIsSameState = b.state === searchState

              // If one is same state and other isn't, prioritize same state
              if (aIsSameState && !bIsSameState) return -1
              if (!aIsSameState && bIsSameState) return 1

              // If both are same state, sort by distance (nulls last)
              if (aIsSameState && bIsSameState) {
                if (a.distance === null && b.distance === null) {
                  return (b.average_rating || 0) - (a.average_rating || 0)
                }
                if (a.distance === null) return 1
                if (b.distance === null) return -1
                return a.distance - b.distance
              }
            }

            // Priority 2: For non-matching states, distance takes precedence
            if (a.distance === null && b.distance === null) {
              // Both have no distance - group by state alphabetically
              const stateCompare = (a.state || '').localeCompare(b.state || '')
              if (stateCompare !== 0) return stateCompare
              return (b.average_rating || 0) - (a.average_rating || 0)
            }
            if (a.distance === null) return 1 // a goes after b
            if (b.distance === null) return -1 // b goes after a
            return a.distance - b.distance // Both have distance - sort ascending
          })
        }
        break

      case 'rating':
        sortedAdvisors.sort((a, b) => {
          const ratingA = a.average_rating || 0
          const ratingB = b.average_rating || 0
          return ratingB - ratingA // Highest first
        })
        break

      case 'reviews':
        sortedAdvisors.sort((a, b) => {
          const countA = a.review_count || 0
          const countB = b.review_count || 0
          return countB - countA // Most reviews first
        })
        break

      case 'name':
        sortedAdvisors.sort((a, b) => a.name.localeCompare(b.name))
        break

      case 'recent':
        sortedAdvisors.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime()
          const dateB = new Date(b.created_at || 0).getTime()
          return dateB - dateA // Newest first
        })
        break

      default:
        // Default to distance if coordinates provided, otherwise rating
        if (lat !== null && lng !== null) {
          sortedAdvisors.sort((a, b) => {
            // Priority 1: Same state/province as search location
            if (searchState) {
              const aIsSameState = a.state === searchState
              const bIsSameState = b.state === searchState

              // If one is same state and other isn't, prioritize same state
              if (aIsSameState && !bIsSameState) return -1
              if (!aIsSameState && bIsSameState) return 1

              // If both are same state, sort by distance (nulls last)
              if (aIsSameState && bIsSameState) {
                if (a.distance === null && b.distance === null) {
                  return (b.average_rating || 0) - (a.average_rating || 0)
                }
                if (a.distance === null) return 1
                if (b.distance === null) return -1
                return a.distance - b.distance
              }
            }

            // Priority 2: For non-matching states, distance takes precedence
            if (a.distance === null && b.distance === null) {
              // Both have no distance - group by state alphabetically
              const stateCompare = (a.state || '').localeCompare(b.state || '')
              if (stateCompare !== 0) return stateCompare
              return (b.average_rating || 0) - (a.average_rating || 0)
            }
            if (a.distance === null) return 1
            if (b.distance === null) return -1
            return a.distance - b.distance
          })
        } else {
          sortedAdvisors.sort((a, b) => {
            const ratingA = a.average_rating || 0
            const ratingB = b.average_rating || 0
            return ratingB - ratingA
          })
        }
    }

    // Pagination
    const totalResults = sortedAdvisors.length
    const totalPages = Math.ceil(totalResults / limit)
    const offset = (page - 1) * limit
    const paginatedAdvisors = sortedAdvisors.slice(offset, offset + limit)

    // Response
    return NextResponse.json({
      advisors: paginatedAdvisors,
      pagination: {
        page,
        limit,
        total: totalResults,
        totalPages,
        hasMore: page < totalPages,
        hasPrevious: page > 1,
      },
      filters: {
        location,
        lat,
        lng,
        radius,
        specialties,
        minRating,
        country,
        state: searchState,
        sort,
        search: searchText,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
