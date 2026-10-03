import type { TagCatalog } from './types'

export const SORT_OPTIONS = [
  { value: 'name', label: 'Name A–Z' },
  { value: 'recent', label: 'Recently added' },
  { value: 'ep_clients', label: 'Elite Prospects clients · most first' },
] as const
export type DirectorySort = typeof SORT_OPTIONS[number]['value']
export type QueryValues = Record<string, string | string[] | undefined>
export type FilterState = {
  tags: string[]; country: string; state: string; search: string; sort: DirectorySort
  verified: boolean; remote: boolean; accepting: boolean
  lat: number | null; lng: number | null; radius: number; location: string
  page: number; limit: number; ids: string[]
}

export function queryParams(values: QueryValues) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, item)
  return params
}
const bounded = (value: string | null, fallback: number, min: number, max: number) => value?.trim() && Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Math.floor(Number(value)))) : fallback
export function parseFilterState(params: URLSearchParams, catalog?: TagCatalog): FilterState {
  const coordinate = (key: string, max: number) => {
    const raw = params.get(key)?.trim()
    const number = raw ? Number(raw) : NaN
    return Number.isFinite(number) && Math.abs(number) <= max ? number : null
  }
  const tags = params.getAll('tag').flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean)
  // Old shared pathway/service links resolve to exact approved labels, never substrings.
  if (catalog) for (const [key, group] of [['service', 'services'], ['pathway', 'pathways'], ['level', 'player_level'], ['language', 'languages']] as const) {
    const value = params.get(key)?.toLowerCase().trim()
    if (value) {
      const tag = catalog.tags.find((option) => option.group_key === group && (option.label.toLowerCase() === value || option.slug === value || option.id === value))
      tags.push(tag?.id || `${group}:unavailable`)
    }
  }
  const requestedSort = params.get('sort')
  return {
    tags: [...new Set(tags)].sort(), country: ['CA', 'US'].includes(params.get('country') || '') ? params.get('country')! : '',
    state: params.get('state')?.trim() || '', search: params.get('search')?.trim().slice(0, 200) || '',
    sort: SORT_OPTIONS.some((option) => option.value === requestedSort) ? requestedSort as DirectorySort : 'name',
    verified: params.get('verified') === 'true', remote: params.get('remote') === 'true', accepting: params.get('accepting') === 'true',
    lat: coordinate('lat', 90), lng: coordinate('lng', 180), radius: bounded(params.get('radius'), 100, 5, 1000), location: params.get('location')?.trim() || '',
    page: bounded(params.get('page'), 1, 1, 1_000_000), limit: bounded(params.get('limit'), 30, 1, 100),
    ids: (params.get('ids') || '').split(',').filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)).slice(0, 50),
  }
}
export function serializeFilterState(state: FilterState) {
  const params = new URLSearchParams()
  for (const tag of [...new Set(state.tags)].sort()) params.append('tag', tag)
  for (const key of ['country', 'state', 'search', 'location'] as const) if (state[key]) params.set(key, state[key])
  for (const key of ['verified', 'remote', 'accepting'] as const) if (state[key]) params.set(key, 'true')
  params.set('sort', state.sort)
  if (state.limit !== 30) params.set('limit', String(state.limit))
  params.set('page', String(state.page))
  if (state.lat !== null && state.lng !== null) {
    params.set('lat', String(state.lat)); params.set('lng', String(state.lng)); params.set('radius', String(state.radius))
  }
  if (state.ids.length) params.set('ids', state.ids.join(','))
  return params
}
export function filterHref(state: FilterState, basePath = '/listings') { return `${basePath}?${serializeFilterState(state)}` }
export function clearFilters(state: FilterState): FilterState {
  return { ...state, tags: [], country: '', state: '', search: '', verified: false, remote: false, accepting: false, lat: null, lng: null, location: '', page: 1, ids: [] }
}
export function activeFilterChips(state: FilterState, catalog: TagCatalog) {
  const chips = state.tags.map((id) => ({ key: id, label: catalog.tags.find((tag) => tag.id === id)?.label || 'Unavailable tag', state: { ...state, tags: state.tags.filter((tag) => tag !== id), page: 1 } }))
  for (const key of ['country', 'state', 'search', 'verified', 'remote', 'accepting'] as const) {
    if (!state[key]) continue
    const label = key === 'country' ? state.country === 'CA' ? 'Office: Canada' : 'Office: United States' : key === 'verified' ? 'Business connection verified' : key === 'remote' ? 'Remote available' : key === 'accepting' ? 'Accepting clients' : state[key] as string
    chips.push({ key, label, state: { ...state, [key]: typeof state[key] === 'boolean' ? false : '', page: 1 } })
  }
  if (state.lat !== null && state.lng !== null) chips.push({ key: 'location', label: `Within ${state.radius} miles`, state: { ...state, lat: null, lng: null, location: '', page: 1 } })
  return chips
}
