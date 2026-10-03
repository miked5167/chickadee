import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import starter from '@/data/directory-tags.json'
import type { TagCatalog } from '@/lib/tags/types'
import { parseFilterState } from '@/lib/tags/filter-state'
import { filterDirectory } from '@/lib/tags/filter-logic'
import { TaggedDirectoryResults } from '@/components/search/TaggedDirectoryResults'
import { TagFilterForm } from '@/components/search/TagFilterForm'
vi.mock('@/components/listing/DirectoryShortlistActions', () => ({ DirectoryShortlistActions: () => null }))
const catalog = starter as TagCatalog
const base = { id: 'example', slug: 'example', name: 'Example Advisor', country: 'CA', state: 'ON', city: 'Toronto', verified: true, description: 'Hockey guidance for families.', logo_url: null, card_tags: catalog.tags.filter((tag) => ['services:advisor', 'pathways:ncaa', 'player_level:aaa'].includes(tag.id)) }
describe('directory HTML without JavaScript', () => {
  it('contains cards, result count, removable chips, search form and shareable pagination', () => {
    const state = parseFilterState(new URLSearchParams('tag=services:advisor&tag=pathways:ncaa&limit=1'), catalog)
    const data = { ...filterDirectory([base, { ...base, id: 'second', slug: 'second' }], state, catalog), catalog, catalogAvailable: true }
    const html = renderToStaticMarkup(createElement(TaggedDirectoryResults, { data }))
    expect(html).toContain('Example Advisor'); expect(html).toContain('>2</strong>')
    expect(html).toContain('/listings/example'); expect(html).toContain('Clear all filters')
    expect(html).toContain('method="get"'); expect(html).toContain('name="tag"')
    expect(html).toContain('tag=pathways%3Ancaa&amp;tag=services%3Aadvisor'); expect(html).toContain('page=2')
  })
  it('renders visible labels, real counts and disabled zero options without a pricing group', () => {
    const state = parseFilterState(new URLSearchParams(), catalog)
    const data = filterDirectory([base], state, catalog)
    const html = renderToStaticMarkup(createElement(TagFilterForm, { catalog, state, facets: data.facets, count: data.pagination.total }))
    expect(html).toContain('NCAA (1)'); expect(html).toContain('U SPORTS (0)')
    expect(html).toContain('disabled=""'); expect(html).toContain('<legend')
    expect(html).toContain('Apply (1 result)'); expect(html).not.toContain('Typical engagement price')
    expect(html).toContain('name="sort"'); expect(html).toContain('ep_clients')
  })
})
