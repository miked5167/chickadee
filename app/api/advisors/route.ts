import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Helper function to detect if search text is a state/province name and convert to abbreviation
function getStateAbbreviation(searchText: string): string | null {
  const normalized = searchText.toLowerCase().trim()

  const usStates: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY',
  }

  const canadianProvinces: Record<string, string> = {
    'alberta': 'AB', 'british columbia': 'BC', 'manitoba': 'MB',
    'new brunswick': 'NB', 'newfoundland and labrador': 'NL', 'newfoundland': 'NL',
    'northwest territories': 'NT', 'nova scotia': 'NS', 'nunavut': 'NU',
    'ontario': 'ON', 'prince edward island': 'PE', 'pei': 'PE',
    'quebec': 'QC', 'québec': 'QC',
    'saskatchewan': 'SK', 'yukon': 'YT',
  }

  if (usStates[normalized]) return usStates[normalized]
  if (canadianProvinces[normalized]) return canadianProvinces[normalized]
  return null
}

/**
 * GET /api/advisors
 * Search and filter companies (hockey advisor firms) with text search and pagination
 *
 * Query Parameters:
 * - country: string (filter by country: "US" or "CA")
 * - state: string (state/province abbreviation: "ON", "QC", "MA", "NY", etc.)
 * - sort: "name" | "recent"
 * - page: number (default: 1)
 * - limit: number (default: 30, max: 100)
 * - search: string (text search on name/description/city/state_province)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const country = searchParams.get('country')
    const searchState = searchParams.get('state')
    const sort = (searchParams.get('sort') || 'name') as string
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const limit = Math.min(
      searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 30,
      100
    )
    let searchText = searchParams.get('search')

    // Check if search text is a state/province name
    let detectedState: string | null = null
    if (searchText && searchText.trim().length > 0) {
      const stateAbbr = getStateAbbreviation(searchText)
      if (stateAbbr) {
        detectedState = stateAbbr
        searchText = null
      }
    }

    const supabase = await createClient()

    // Start building query
    let query = supabase
      .from('companies')
      .select('*', { count: 'exact' })

    // Country filtering
    if (country) {
      query = query.eq('country', country)
    }

    // State/Province filtering
    const effectiveState = searchState || detectedState
    if (effectiveState) {
      query = query.eq('state_province', effectiveState)
    }

    // Text search on name, description, city, and state_province
    if (searchText && searchText.trim().length > 0) {
      query = query.or(`name.ilike.%${searchText}%,description.ilike.%${searchText}%,city.ilike.%${searchText}%,state_province.ilike.%${searchText}%`)
    }

    // Execute query
    const { data: companies, error, count } = await query

    if (error) {
      console.error('Companies query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch advisors' },
        { status: 500 }
      )
    }

    let sortedCompanies = [...(companies || [])]

    // If there's a text search, add relevance scoring
    if (searchText && searchText.trim().length > 0) {
      const searchLower = searchText.toLowerCase().trim()

      sortedCompanies = sortedCompanies.map(company => ({
        ...company,
        relevanceScore: (() => {
          const nameLower = (company.name || '').toLowerCase()
          const cityLower = (company.city || '').toLowerCase()
          const descLower = (company.description || '').toLowerCase()

          if (nameLower.startsWith(searchLower)) return 100
          if (nameLower.includes(searchLower)) return 80
          if (cityLower.startsWith(searchLower)) return 60
          if (cityLower.includes(searchLower)) return 40
          if (descLower.includes(searchLower)) return 20
          return 0
        })()
      }))

      sortedCompanies.sort((a: any, b: any) => {
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore
        }
        return a.name.localeCompare(b.name)
      })
    } else {
      // Default sorting
      switch (sort) {
        case 'name':
          sortedCompanies.sort((a, b) => a.name.localeCompare(b.name))
          break
        case 'recent':
          sortedCompanies.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime()
            const dateB = new Date(b.created_at || 0).getTime()
            return dateB - dateA
          })
          break
        default:
          sortedCompanies.sort((a, b) => a.name.localeCompare(b.name))
      }
    }

    // Pagination
    const totalResults = sortedCompanies.length
    const totalPages = Math.ceil(totalResults / limit)
    const offset = (page - 1) * limit
    const paginatedCompanies = sortedCompanies.slice(offset, offset + limit)

    // Map to advisor-like shape for frontend compatibility
    const advisors = paginatedCompanies.map(c => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      city: c.city,
      state: c.state_province,
      country: c.country,
      description: c.description,
      logo_url: c.logo_url,
      verified: c.verified,
      website_url: c.website_url,
      phone: c.phone,
      email: c.email,
    }))

    return NextResponse.json({
      advisors,
      pagination: {
        page,
        limit,
        total: totalResults,
        totalPages,
        hasMore: page < totalPages,
        hasPrevious: page > 1,
      },
      filters: {
        country,
        state: effectiveState,
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
