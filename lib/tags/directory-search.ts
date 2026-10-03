import { createClient } from '@/lib/supabase/server'
import { enrichListingCards } from '@/lib/listing-card-data'
import { publicPreviewFeedUrl } from '@/lib/preview/advisor-feed'
import { readTagCatalog } from './catalog'
import starter from '@/data/directory-tags.json'
import type { TagCatalog } from './types'
import { parseFilterState } from './filter-state'
import { filterDirectory, type DirectoryListing } from './filter-logic'
import { getStateAbbreviation, readPoint } from './search-location'

export async function searchDirectory(params: URLSearchParams) {
  let catalog: TagCatalog
  let catalogAvailable = true
  const preview = publicPreviewFeedUrl(new URLSearchParams())
  if (preview) {
    const response = await fetch(new URL('/api/directory-tags', preview), { cache: 'no-store' })
    if (response.ok) catalog = await response.json()
    else { catalog = starter as TagCatalog; catalogAvailable = false }
  } else {
    try { catalog = await readTagCatalog() }
    catch { catalog = starter as TagCatalog; catalogAvailable = false }
  }
  let listings: DirectoryListing[] = []
  if (preview) {
    let page = 1
    let pages = 1
    do {
      const response = await fetch(publicPreviewFeedUrl(new URLSearchParams({ limit: '100', page: String(page), sort: 'name' }))!, { cache: 'no-store' })
      if (!response.ok) throw new Error('The public directory preview is unavailable.')
      const data = await response.json()
      listings.push(...(data.advisors || []))
      pages = data.pagination?.totalPages || 1
      page++
    } while (page <= pages)
  } else {
    const supabase = await createClient()
    const { data: companies, error } = await supabase.from('companies').select('*')
    if (error) throw new Error('Company listings could not be loaded.')
    const ids = (companies || []).map((company) => company.id)
    const { data: profiles } = ids.length ? await supabase.from('company_profiles').select('company_id, offers_remote, accepting_clients, services, specialties, pathways').in('company_id', ids) : { data: [] }
    const profilesById = new Map((profiles || []).map((profile) => [profile.company_id, profile]))
    listings = await enrichListingCards(supabase, (companies || []).map((company) => {
      const point = readPoint(company.location)
      const profile = profilesById.get(company.id)
      return {
        id: company.id, slug: company.slug, name: company.name, description: company.description, city: company.city,
        state: company.state_province, country: company.country, verified: company.verified, logo_url: company.logo_url,
        website_url: company.website_url, created_at: company.created_at, latitude: point?.lat ?? null, longitude: point?.lng ?? null,
        offers_remote: profile?.offers_remote === true, accepting_clients: profile?.accepting_clients ?? null,
        services: profile?.services || [], specialties: profile?.specialties || [], pathways: profile?.pathways || [],
      }
    }))
  }
  if (!catalogAvailable) listings = listings.map((listing) => ({ ...listing, card_tags: [] }))
  const state = parseFilterState(params, catalog)
  const detectedState = getStateAbbreviation(state.search)
  if (detectedState) { state.state ||= detectedState; state.search = '' }
  return { ...filterDirectory(listings, state, catalog), catalog, catalogAvailable }
}
export type DirectorySearchResult = Awaited<ReturnType<typeof searchDirectory>>
