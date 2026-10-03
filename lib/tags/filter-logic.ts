import type { ListingCardDetails } from '@/lib/listing-cards'
import type { TagCatalog, TagGroupKey } from './types'
import type { FilterState } from './filter-state'
import { hasEliteProspectsCount } from '@/lib/research/elite-prospects'
import { calculateDistance } from '@/lib/utils/distance'

export interface DirectoryListing extends ListingCardDetails {
  id: string; slug: string; name: string; country: string; state: string | null; city: string | null
  description: string | null; verified: boolean; logo_url: string | null; website_url?: string | null
  created_at?: string | null; offers_remote?: boolean; accepting_clients?: boolean | null
  latitude?: number | null; longitude?: number | null; distance?: number | null
  specialties?: string[]; services?: string[]; pathways?: string[]
}
export type DirectoryFacets = { tags: Record<string, number>; countries: Record<string, number>; flags: Record<'verified' | 'remote' | 'accepting', number> }

export function filterDirectory(listings: DirectoryListing[], state: FilterState, catalog: TagCatalog) {
  const enabled = new Set(catalog.groups.filter((group) => group.filter_enabled).map((group) => group.key))
  const active = new Map(catalog.tags.filter((tag) => tag.is_active && enabled.has(tag.group_key)).map((tag) => [tag.id, tag]))
  const assignments = new Map(listings.map((listing) => {
    const ids = new Set<string>()
    for (const tag of listing.card_tags || []) {
      let option = active.get(tag.id)
      const visited = new Set<string>()
      while (option && !visited.has(option.id)) { ids.add(option.id); visited.add(option.id); option = option.parent_id ? active.get(option.parent_id) : undefined }
    }
    return [listing.id, ids]
  }))
  const groups = new Map<TagGroupKey | 'unknown', string[]>()
  for (const id of state.tags) {
    const group = active.get(id)?.group_key || 'unknown'
    groups.set(group, [...(groups.get(group) || []), id])
  }
  const located = listings.map((listing) => ({ ...listing, distance: state.lat !== null && state.lng !== null && listing.latitude != null && listing.longitude != null ? calculateDistance(state.lat, state.lng, listing.latitude, listing.longitude) : null }))
  const matches = (listing: DirectoryListing, omit?: string) => {
    if (state.ids.length && !state.ids.includes(listing.id)) return false
    if (omit !== 'country' && state.country && listing.country !== state.country) return false
    if (state.state && listing.state !== state.state) return false
    if (state.search && ![listing.name, listing.description, listing.city, listing.state, listing.tagline].some((value) => value?.toLocaleLowerCase().includes(state.search.toLocaleLowerCase()))) return false
    if (omit !== 'verified' && state.verified && !listing.verified) return false
    if (omit !== 'remote' && state.remote && !listing.offers_remote) return false
    if (omit !== 'accepting' && state.accepting && listing.accepting_clients !== true) return false
    if (state.lat !== null && state.lng !== null && (listing.distance == null || listing.distance > state.radius)) return false
    return [...groups].every(([group, ids]) => group === omit || ids.some((id) => assignments.get(listing.id)?.has(id)))
  }
  const facets: DirectoryFacets = { tags: {}, countries: {}, flags: { verified: 0, remote: 0, accepting: 0 } }
  for (const tag of active.values()) facets.tags[tag.id] = located.filter((listing) => matches(listing, tag.group_key) && assignments.get(listing.id)?.has(tag.id)).length
  for (const country of ['CA', 'US']) facets.countries[country] = located.filter((listing) => matches(listing, 'country') && listing.country === country).length
  for (const key of ['verified', 'remote', 'accepting'] as const) facets.flags[key] = located.filter((listing) => matches(listing, key) && (key === 'verified' ? listing.verified : key === 'remote' ? listing.offers_remote : listing.accepting_clients === true)).length
  const matched = located.filter((listing) => matches(listing))
  const count = (listing: DirectoryListing) => hasEliteProspectsCount(listing.elite_prospects || null) ? listing.elite_prospects!.client_count : null
  matched.sort((a, b) => {
    if (state.sort === 'ep_clients') {
      const left = count(a), right = count(b)
      if (left !== right) return left === null ? 1 : right === null ? -1 : right! - left!
    } else if (state.sort === 'recent') {
      const difference = (Date.parse(b.created_at || '') || 0) - (Date.parse(a.created_at || '') || 0)
      if (difference) return difference
    } else if (state.lat !== null && state.lng !== null && a.distance !== b.distance) return (a.distance ?? Infinity) - (b.distance ?? Infinity)
    return a.name.localeCompare(b.name, 'en') || a.id.localeCompare(b.id)
  })
  const total = matched.length
  const totalPages = Math.ceil(total / state.limit)
  const page = Math.min(state.page, Math.max(1, totalPages))
  return { advisors: matched.slice((page - 1) * state.limit, page * state.limit), facets, pagination: { page, limit: state.limit, total, totalPages, hasMore: page < totalPages, hasPrevious: page > 1 }, state: { ...state, page } }
}
