import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateDistance, isValidCoordinate } from '@/lib/utils/distance'
import { publicPreviewFeedUrl, publicPreviewProfileUrl } from '@/lib/preview/advisor-feed'

export const dynamic = 'force-dynamic'

type PointValue =
  | { type?: string; coordinates?: [number, number] }
  | string
  | null

function readPoint(value: PointValue): { lat: number; lng: number } | null {
  if (value && typeof value === 'object' && Array.isArray(value.coordinates)) {
    const [lng, lat] = value.coordinates
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
  }

  if (typeof value === 'string') {
    const match = value.match(/POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i)
    if (match) return { lng: Number(match[1]), lat: Number(match[2]) }
  }

  return null
}

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
    const previewFeedUrl = publicPreviewFeedUrl(searchParams)
    if (previewFeedUrl) {
      const previewResponse = await fetch(previewFeedUrl, { cache: 'no-store' })
      if (!previewResponse.ok) {
        return NextResponse.json({ error: 'The public preview feed is temporarily unavailable.' }, { status: 502 })
      }
      const previewPayload = await previewResponse.json() as { advisors?: Array<Record<string, unknown> & { slug?: string }> }
      if (previewPayload.advisors) {
        previewPayload.advisors = previewPayload.advisors.map((advisor) => ({
          ...advisor,
          profile_url: typeof advisor.slug === 'string' ? publicPreviewProfileUrl(advisor.slug) : null,
        }))
      }
      return NextResponse.json(previewPayload, {
        headers: { 'Cache-Control': 'private, no-store' },
      })
    }

    const country = searchParams.get('country')
    const requestedIds = (searchParams.get('ids') || '').split(',').map((id) => id.trim()).filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)).slice(0, 50)
    const searchState = searchParams.get('state')
    const specialty = searchParams.get('specialty')?.trim() || null
    const service = searchParams.get('service')?.trim() || null
    const pathway = searchParams.get('pathway')?.trim() || null
    const playerLevel = searchParams.get('level')?.trim() || null
    const language = searchParams.get('language')?.trim() || null
    const pricingModel = searchParams.get('pricing')?.trim() || null
    const remoteOnly = searchParams.get('remote') === 'true'
    const acceptingOnly = searchParams.get('accepting') === 'true'
    const verified = searchParams.get('verified') === 'true'
    const latitude = Number(searchParams.get('lat'))
    const longitude = Number(searchParams.get('lng'))
    const radius = Math.min(Math.max(Number(searchParams.get('radius') || '100'), 5), 1000)
    const hasCoordinates = isValidCoordinate(latitude, longitude)
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
      .select('*')

    if (requestedIds.length > 0) query = query.in('id', requestedIds)

    // Country filtering
    if (country) {
      query = query.eq('country', country)
    }

    if (verified) {
      query = query.eq('verified', true)
    }

    // State/Province filtering
    const effectiveState = searchState || detectedState
    if (effectiveState) {
      query = query.eq('state_province', effectiveState)
    }

    // Text search on name, description, city, and state_province
    if (searchText && searchText.trim().length > 0) {
      const safeSearchText = searchText.trim().replace(/[,%().]/g, ' ').replace(/\s+/g, ' ')
      query = query.or(`name.ilike.%${safeSearchText}%,description.ilike.%${safeSearchText}%,city.ilike.%${safeSearchText}%,state_province.ilike.%${safeSearchText}%`)
    }

    // Execute query
    const { data: companies, error } = await query

    if (error) {
      console.error('Companies query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch advisors' },
        { status: 500 }
      )
    }

    const companyIds = (companies || []).map((company) => company.id)
    const profilesByCompany = new Map<string, Record<string, unknown>>()
    const advisorsByCompany = new Map<string, Array<{ specialties?: string[] | null }>>()
    if (companyIds.length > 0) {
      const [profilesResult, advisorsResult] = await Promise.all([
        supabase.from('company_profiles').select('*').in('company_id', companyIds),
        supabase.from('advisors').select('company_id, specialties').in('company_id', companyIds).eq('active', true),
      ])

      if (profilesResult.error) {
        console.warn('Company profiles are not available yet:', profilesResult.error.code)
      } else {
        for (const profile of profilesResult.data || []) profilesByCompany.set(profile.company_id, profile)
      }

      if (advisorsResult.error) {
        console.warn('Advisor specialties are not available:', advisorsResult.error.code)
      } else {
        for (const advisor of advisorsResult.data || []) {
          const current = advisorsByCompany.get(advisor.company_id) || []
          current.push({ specialties: advisor.specialties })
          advisorsByCompany.set(advisor.company_id, current)
        }
      }
    }

    let sortedCompanies = (companies || []).map((company) => ({
      ...company,
      advisors: advisorsByCompany.get(company.id) || [],
      profile: profilesByCompany.get(company.id) || null,
    }))

    const includesText = (values: unknown, wanted: string) =>
      Array.isArray(values) && values.some((value) => typeof value === 'string' && value.toLocaleLowerCase().includes(wanted.toLocaleLowerCase()))

    if (specialty) {
      sortedCompanies = sortedCompanies.filter((company) =>
        includesText(company.profile?.specialties, specialty)
        || includesText(company.profile?.services, specialty)
        || (company.advisors || []).some((advisor: { specialties?: string[] | null }) =>
          includesText(advisor.specialties, specialty),
        ),
      )
    }

    if (service) sortedCompanies = sortedCompanies.filter((company) => includesText(company.profile?.services, service))
    if (pathway) sortedCompanies = sortedCompanies.filter((company) => includesText(company.profile?.pathways, pathway))
    if (playerLevel) sortedCompanies = sortedCompanies.filter((company) => includesText(company.profile?.player_levels, playerLevel))
    if (language) sortedCompanies = sortedCompanies.filter((company) => includesText(company.profile?.languages, language))
    if (pricingModel) sortedCompanies = sortedCompanies.filter((company) => includesText(company.profile?.pricing_models, pricingModel))
    if (remoteOnly) sortedCompanies = sortedCompanies.filter((company) => company.profile?.offers_remote === true)
    if (acceptingOnly) sortedCompanies = sortedCompanies.filter((company) => company.profile?.accepting_clients === true)

    if (hasCoordinates) {
      sortedCompanies = sortedCompanies
        .map((company) => {
          const point = readPoint(company.location as PointValue)
          if (!point) return { ...company, distanceMiles: null }
          return {
            ...company,
            distanceMiles: calculateDistance(latitude, longitude, point.lat, point.lng),
          }
        })
        .filter((company) => company.distanceMiles !== null && company.distanceMiles <= radius)
    }

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

      sortedCompanies.sort((a, b) => {
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore
        }
        return a.name.localeCompare(b.name)
      })
    } else if (hasCoordinates) {
      sortedCompanies.sort((a, b) => (a.distanceMiles ?? Number.POSITIVE_INFINITY) - (b.distanceMiles ?? Number.POSITIVE_INFINITY))
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
    const advisors = paginatedCompanies.map(c => {
      const point = readPoint(c.location as PointValue)
      return ({
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
      specialties: Array.from(new Set((c.advisors || []).flatMap((advisor: { specialties?: string[] | null }) => advisor.specialties || []))).slice(0, 6),
      services: Array.isArray(c.profile?.services) ? c.profile.services : [],
      pathways: Array.isArray(c.profile?.pathways) ? c.profile.pathways : [],
      offers_remote: c.profile?.offers_remote === true,
      accepting_clients: typeof c.profile?.accepting_clients === 'boolean' ? c.profile.accepting_clients : null,
      tagline: typeof c.profile?.tagline === 'string' ? c.profile.tagline : null,
      latitude: point?.lat ?? null,
      longitude: point?.lng ?? null,
      distance: c.distanceMiles ?? null,
    })})

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
        specialty,
        service,
        pathway,
        level: playerLevel,
        language,
        pricing: pricingModel,
        remote: remoteOnly,
        accepting: acceptingOnly,
        ids: requestedIds,
        verified,
        radius: hasCoordinates ? radius : null,
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
