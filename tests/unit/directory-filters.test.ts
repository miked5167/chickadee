import { describe, expect, it } from 'vitest'
import starter from '@/data/directory-tags.json'
import type { TagCatalog } from '@/lib/tags/types'
import { filterDirectory, type DirectoryListing } from '@/lib/tags/filter-logic'
import { activeFilterChips, clearFilters, parseFilterState, queryParams, serializeFilterState } from '@/lib/tags/filter-state'
const catalog = starter as TagCatalog
const state = (query = '') => parseFilterState(new URLSearchParams(query), catalog)
const listing = (id: string, tags: string[], count: number | null): DirectoryListing => ({
  id, name: id, slug: id, country: id === 'Bravo' ? 'US' : 'CA', state: null, city: null, description: 'Independent hockey advice', logo_url: null, verified: id === 'Alpha', offers_remote: id !== 'Charlie', accepting_clients: true,
  card_tags: catalog.tags.filter((tag) => tags.includes(tag.id)),
  elite_prospects: count === null ? null : { match_status: 'exact', agency_name: id, client_count: count, source_url: 'https://www.eliteprospects.com/agent-portal/1/example', source_observed_at: null, imported_at: '2026-10-02' },
})
const listings = [listing('Alpha', ['services:advisor', 'pathways:ncaa', 'player_level:aaa', 'regions:ca-on'], 0), listing('Bravo', ['services:agent', 'pathways:professional', 'player_level:aaa'], 23), listing('Charlie', ['services:advisor', 'pathways:u-sports', 'player_level:aa'], null)]
describe('controlled directory filters', () => {
  it('ORs options within a group and ANDs different groups', () => {
    expect(filterDirectory(listings, state('tag=services:advisor&tag=services:agent&tag=player_level:aaa'), catalog).advisors.map((row) => row.id)).toEqual(['Alpha', 'Bravo'])
    expect(filterDirectory(listings, state('tag=services:advisor&tag=pathways:professional'), catalog).pagination.total).toBe(0)
  })
  it('counts options with other groups applied, independently of pagination', () => {
    const result = filterDirectory(listings, state('tag=player_level:aaa&limit=1'), catalog)
    expect(result.pagination.total).toBe(2); expect(result.advisors).toHaveLength(1)
    expect(result.facets.tags['services:advisor']).toBe(1)
    expect(result.facets.tags['pathways:u-sports']).toBe(0)
    expect(result.facets.tags['player_level:aa']).toBe(1)
  })
  it('treats served provinces as coverage of their parent country', () => {
    expect(filterDirectory(listings, state('tag=regions:ca'), catalog).advisors.map((row) => row.id)).toEqual(['Alpha'])
  })
  it('never substitutes free text or retired tags for approved assignments', () => {
    const retired = { ...catalog, tags: catalog.tags.map((tag) => ({ ...tag, is_active: tag.id !== 'pathways:ncaa' })) }
    expect(filterDirectory(listings, state('tag=pathways:ncaa'), retired).pagination.total).toBe(0)
    expect(filterDirectory([{ ...listings[0], card_tags: [], pathways: ['NCAA'] }], state('tag=pathways:ncaa'), catalog).pagination.total).toBe(0)
  })
  it('sorts stored EP counts above unknowns, preserving zero and ignoring unsafe sources', () => {
    expect(filterDirectory(listings, state('sort=ep_clients'), catalog).advisors.map((row) => row.id)).toEqual(['Bravo', 'Alpha', 'Charlie'])
    const unsafe = { ...listings[1], elite_prospects: { ...listings[1].elite_prospects!, source_url: 'https://example.com', client_count: 1_000_000 } }
    expect(filterDirectory([unsafe, listings[0]], state('sort=ep_clients'), catalog).advisors[0].id).toBe('Alpha')
  })
  it('applies flags and country with contextual counts', () => {
    const result = filterDirectory(listings, state('verified=true'), catalog)
    expect(result.pagination.total).toBe(1); expect(result.facets.flags.verified).toBe(1); expect(result.facets.countries.US).toBe(0)
  })
  it('handles empty results and invalid pagination without NaN or negative offsets', () => {
    expect(filterDirectory(listings, state('tag=pathways:missing&page=-5&limit=bad'), catalog).pagination).toMatchObject({ page: 1, limit: 30, total: 0 })
    expect(filterDirectory(listings, state('page=999&limit=2'), catalog).pagination.page).toBe(2)
  })
})
describe('shareable filter URL state', () => {
  it('round-trips repeated tags, zero coordinates, sort, flags and search', () => {
    const value = state('tag=services:advisor&tag=pathways:ncaa&tag=pathways:ncaa&search=hockey&lat=0&lng=0&radius=50&remote=true&sort=ep_clients&limit=15&page=2')
    expect(parseFilterState(serializeFilterState(value), catalog)).toEqual(value); expect(value.tags).toHaveLength(2)
  })
  it('preserves repeated values from Next.js query objects', () => {
    expect(queryParams({ tag: ['services:advisor', 'pathways:ncaa'], page: '2' }).getAll('tag')).toHaveLength(2)
  })
  it('removes one tag while preserving siblings and resets pagination', () => {
    const chips = activeFilterChips(state('tag=services:advisor&tag=pathways:ncaa&page=3'), catalog)
    expect(chips[0].state.tags).toHaveLength(1); expect(chips[0].state.page).toBe(1)
  })
  it('clears narrowing filters while retaining sort and page size', () => {
    const value = clearFilters(state('tag=services:advisor&country=CA&search=test&lat=0&lng=0&verified=true&sort=ep_clients&limit=60&page=3'))
    expect(serializeFilterState(value).toString()).toBe('sort=ep_clients&limit=60&page=1')
  })
  it('maps old exact pathway links and rejects substring matches', () => {
    expect(state('pathway=NCAA').tags).toEqual(['pathways:ncaa'])
    expect(state('pathway=NCA').tags).toEqual(['pathways:unavailable'])
  })
})
