import { describe, expect, it } from 'vitest'
import starter from '@/data/directory-tags.json'
import type { TagCatalog } from '@/lib/tags/types'
import { proposeDirectoryTags, csvCell } from '@/lib/tags/backfill'
const catalog = starter as TagCatalog
describe('review-only tag proposals', () => {
  it('attaches evidence, distinguishes AA from AAA, and never guesses prices or language', () => {
    const results = proposeDirectoryTags(catalog.tags, [{ source: 'https://example.com', text: 'Hockey advisors support AAA players with NCAA recruiting and video analysis.' }])
    const ids = results.map((tag) => tag.tag_id)
    expect(ids).toContain('player_level:aaa'); expect(ids).not.toContain('player_level:aa')
    expect(ids).toContain('pathways:ncaa'); expect(ids).toContain('services:video'); expect(ids).toContain('services:advisor')
    expect(ids.some((id) => /^(price_range|languages):/.test(id))).toBe(false)
    expect(results.every((tag) => tag.confidence === 'review_required' && tag.source === 'https://example.com')).toBe(true)
  })
  it('does not turn a nearby denial into a service recommendation', () => {
    expect(proposeDirectoryTags(catalog.tags, [{ source: 'listing', text: 'We do not offer video analysis.' }])).toEqual([])
  })
  it('uses explicit age and language evidence without inferring an age from league mentions', () => {
    const ids = proposeDirectoryTags(catalog.tags, [{ source: 'listing', text: 'NCAA guidance for ages 21+. Consultations in French.' }]).map((tag) => tag.tag_id)
    expect(ids).toContain('age_group:21-plus'); expect(ids).toContain('languages:french')
    expect(ids).not.toContain('age_group:18-20')
  })
  it('requires explicit coverage evidence, independently of an office address', () => {
    expect(proposeDirectoryTags(catalog.tags, [{ source: 'listing', text: 'Our office is in Ontario.' }])).toEqual([])
    expect(proposeDirectoryTags(catalog.tags, [{ source: 'listing', text: 'We serve families across Ontario.' }]).map((tag) => tag.tag_id)).toContain('regions:ca-on')
  })
  it('escapes spreadsheet formulas, commas, quotes and newlines', () => {
    expect(csvCell('=IMPORTXML("example")')).toBe('"\'=IMPORTXML(""example"")"')
    expect(csvCell('a,b\nc')).toBe('"a,b\nc"')
  })
})
