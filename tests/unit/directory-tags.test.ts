import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import taxonomy from '@/data/directory-tags.json'
import { validateTagSelection, tagSuggestionSchema, suggestedTagSlug } from '@/lib/tags/validation'
import type { DirectoryTag } from '@/lib/tags/types'
import { validateDirectoryTagMigration } from '../../scripts/database/directory-tags-contract.mjs'
import { generateTagSeed } from '../../scripts/database/generate-tag-seed.mjs'

const tags = taxonomy.tags as DirectoryTag[]
const core = ['services:advisor', 'pathways:junior', 'pathways:ncaa']

describe('controlled tag selection', () => {
  it('counts only Services and Pathways toward the 3-5 requirement', () => {
    const selection = [...core, 'player_level:aaa', 'age_group:15-17', 'regions:ca-on', 'languages:english', 'languages:french']
    expect(validateTagSelection(selection, tags)).toEqual([...selection].sort())
  })
  it.each([
    ['services:advisor', 'pathways:ncaa'],
    ['services:advisor', 'services:agent', 'services:scouting', 'services:video', 'services:recruiting', 'pathways:ncaa'],
    ['pathways:prep-school', 'pathways:junior', 'pathways:ncaa'],
    ['services:advisor', 'pathways:ncaa', 'languages:english', 'languages:french'],
  ])('rejects an invalid core selection: %j', (...selection) => {
    expect(() => validateTagSelection(selection as string[], tags)).toThrow()
  })
  it('rejects duplicates, unknown IDs, retired tags and multiple price bands', () => {
    expect(() => validateTagSelection([...core, core[0]], tags)).toThrow()
    expect(() => validateTagSelection([...core, 'languages:invented'], tags)).toThrow('approved')
    expect(() => validateTagSelection(core, tags.map((tag) => tag.id === core[0] ? { ...tag, is_active: false } : tag))).toThrow('approved')
    expect(() => validateTagSelection([...core, 'price_range:under-1000', 'price_range:10000-plus'], tags)).toThrow('at most one')
  })
  it('does not accept a partial label match as a controlled tag', () => {
    expect(() => validateTagSelection(['services:advisor', 'pathways:junior', 'pathways:nc'], tags)).toThrow('approved')
  })
})

describe('starter taxonomy and seed', () => {
  it('reflects the agreed player fit and keeps pricing hidden', () => {
    expect(tags.filter((tag) => tag.group_key === 'player_level').map((tag) => tag.slug)).toEqual(['aa', 'aaa', 'prep-high-school', 'junior', 'college-university', 'professional'])
    expect(tags.filter((tag) => tag.group_key === 'age_group').map((tag) => tag.slug)).toEqual(['13-14', '15-17', '18-20', '21-plus'])
    expect(taxonomy.groups.find((group) => group.key === 'price_range')?.filter_enabled).toBe(false)
    expect(new Set(tags.map((tag) => tag.id)).size).toBe(tags.length)
    expect(tags.filter((tag) => tag.parent_id === 'regions:ca')).toHaveLength(13)
    expect(tags.filter((tag) => tag.parent_id === 'regions:us')).toHaveLength(50)
  })
  it('keeps the SQL seed in sync and preserves administrator changes on rerun', () => {
    const seed = readFileSync(path.join(process.cwd(), 'supabase/seeds/directory-tags.sql'), 'utf8')
    expect(seed).toBe(generateTagSeed(taxonomy))
    expect(seed).not.toMatch(/ON CONFLICT[^;]+DO UPDATE/)
    expect(seed).not.toMatch(/INSERT INTO public\.(companies|company_tags|claim_tags|listing_claims)\b/)
  })
})

describe('suggestion validation', () => {
  const value = { company_id: '10000000-0000-4000-8000-000000000001', group_key: 'languages', label: 'Spanish', reason: 'Clients request this language.' }
  it('requires exactly one owned-listing or pending-claim context', () => {
    expect(tagSuggestionSchema.safeParse(value).success).toBe(true)
    expect(tagSuggestionSchema.safeParse({ ...value, claim_id: value.company_id }).success).toBe(false)
    expect(tagSuggestionSchema.safeParse({ ...value, company_id: undefined }).success).toBe(false)
  })
  it('rejects client-supplied approval, reviewer identity and arbitrary groups', () => {
    expect(tagSuggestionSchema.safeParse({ ...value, status: 'approved' }).success).toBe(false)
    expect(tagSuggestionSchema.safeParse({ ...value, reviewed_by: value.company_id }).success).toBe(false)
    expect(tagSuggestionSchema.safeParse({ ...value, group_key: 'invented' }).success).toBe(false)
    expect(suggestedTagSlug('Français / Québec')).toBe('francais-quebec')
  })
})

describe('tag migration scope and guards', () => {
  const migration = readFileSync(path.join(process.cwd(), 'supabase/migrations/20261002000000_directory_tags.sql'), 'utf8')
  it('accepts the additive migration', () => expect(() => validateDirectoryTagMigration(migration)).not.toThrow())
  it('rejects mutations to existing data or schema and removed authorization guards', () => {
    for (const changed of [
      migration + '\nDELETE FROM public.companies;',
      migration + '\nALTER TABLE public.companies OWNER TO authenticated;',
      migration.replace('auth.uid() IS NULL OR NOT public.is_admin()', 'false'),
      migration.replace('core_count NOT BETWEEN 3 AND 5 OR service_count < 1', 'false'),
      migration.replace('FROM PUBLIC, anon, authenticated;', 'FROM authenticated;'),
    ]) expect(() => validateDirectoryTagMigration(changed)).toThrow()
  })
})
