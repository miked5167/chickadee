import { describe, expect, it, vi } from 'vitest'
import { enrichListingCards } from '@/lib/listing-card-data'
import { cardTags, playerFit } from '@/lib/listing-cards'
import type { DirectoryTag } from '@/lib/tags/types'

function tag(group: DirectoryTag['group_key'], label: string, order = 0, active = true): DirectoryTag {
  return { id: `${group}:${label.toLowerCase()}`, group_key: group, label, slug: label.toLowerCase(), parent_id: null, display_order: order, is_active: active }
}

function database(responses: Record<string, unknown>) {
  const queries: Array<{ table: string; ids: string[] }> = []
  const from = vi.fn((table: string) => ({ select: vi.fn(() => ({ in: vi.fn((_column: string, ids: string[]) => {
    queries.push({ table, ids })
    return responses[table] instanceof Error ? Promise.reject(responses[table]) : Promise.resolve(responses[table] || { data: [], error: null })
  }) })) }))
  return { client: { from } as unknown as Parameters<typeof enrichListingCards>[0], from, queries }
}

describe('listing card details', () => {
  it('batches only displayed company IDs and attaches the correct profile and active tags', async () => {
    const active = tag('pathways', 'NCAA')
    const retired = tag('services', 'Retired', 0, false)
    const db = database({
      company_profiles: { data: [{ company_id: 'b', tagline: 'Published summary', player_levels: ['AAA'], age_groups: ['15–17'] }], error: null },
      company_tags: { data: [
        { company_id: 'a', directory_tags: active }, { company_id: 'b', directory_tags: [retired] },
        { company_id: 'a', directory_tags: null },
      ], error: null },
    })
    const companies = [{ id: 'a', name: 'First' }, { id: 'b', name: 'Second' }]
    const result = await enrichListingCards(db.client, companies)
    expect(db.queries.every((query) => query.ids.join(',') === 'a,b')).toBe(true)
    expect(result[0].card_tags).toEqual([active])
    expect(result[1]).toMatchObject({ name: 'Second', tagline: 'Published summary', player_levels: ['AAA'], age_groups: ['15–17'], card_tags: [] })
    expect(companies[0]).toEqual({ id: 'a', name: 'First' })
  })

  it('keeps cards usable with missing tag tables and a rejected optional profile query', async () => {
    const db = database({ company_profiles: new Error('Connection unavailable'), company_tags: { data: null, error: { code: '42P01' } } })
    expect(await enrichListingCards(db.client, [{ id: 'a', description: 'Existing description' }])).toEqual([{ id: 'a', description: 'Existing description', card_tags: [] }])
  })

  it('makes no supporting queries for empty results', async () => {
    const db = database({})
    expect(await enrichListingCards(db.client, [])).toEqual([])
    expect(db.from).not.toHaveBeenCalled()
  })

  it('uses active core tags only and respects catalog order and the five-chip limit', () => {
    const tags = [tag('pathways', 'NCAA'), tag('services', 'Recruiting', 2), tag('services', 'Advisor', 1), tag('languages', 'English'), tag('services', 'Retired', 0, false)]
    expect(cardTags(tags).map((item) => item.label)).toEqual(['Advisor', 'Recruiting', 'NCAA'])
    expect(cardTags([...tags, tag('pathways', 'Junior', 1), tag('pathways', 'Prep', 2), tag('pathways', 'Professional', 3)])).toHaveLength(5)
  })

  it('prefers approved player-fit tags over legacy fields without inventing an age or level', () => {
    expect(playerFit({ card_tags: [tag('player_level', 'AAA'), tag('age_group', '15–17')], player_levels: ['A'], age_groups: ['Under 12'] })).toBe('AAA · Ages 15–17')
    expect(playerFit({ player_levels: [' AA ', 'AA', '', 'AAA'] })).toBe('AA / AAA')
    expect(playerFit({ age_groups: ['18–20'] })).toBe('Ages 18–20')
    expect(playerFit({})).toBe('')
  })
})
