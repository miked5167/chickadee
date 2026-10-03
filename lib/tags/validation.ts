import { z } from 'zod'
import { TAG_GROUP_KEYS, type DirectoryTag } from './types'

export const tagSelectionSchema = z.array(z.string().regex(/^[a-z_]+:[a-z0-9]+(-[a-z0-9]+)*$/)).min(3).max(100)
  .refine((ids) => new Set(ids).size === ids.length, 'Duplicate tags are not allowed.')

// The database repeats these checks so direct API calls cannot bypass them.
export function validateTagSelection(ids: string[], catalog: DirectoryTag[]): string[] {
  const selected = tagSelectionSchema.parse(ids)
  const active = new Map(catalog.filter((tag) => tag.is_active).map((tag) => [tag.id, tag]))
  const tags = selected.map((id) => active.get(id))
  if (tags.some((tag) => !tag)) throw new Error('Choose only active, approved tags.')
  const core = tags.filter((tag) => tag?.group_key === 'services' || tag?.group_key === 'pathways')
  if (core.length < 3 || core.length > 5 || !core.some((tag) => tag?.group_key === 'services')) {
    throw new Error('Choose 3 to 5 Services and Pathways tags, including at least one Service.')
  }
  if (tags.filter((tag) => tag?.group_key === 'price_range').length > 1) throw new Error('Choose at most one price range.')
  return [...selected].sort()
}

export const tagSuggestionSchema = z.object({
  company_id: z.string().uuid().optional(),
  claim_id: z.string().uuid().optional(),
  group_key: z.enum(TAG_GROUP_KEYS),
  label: z.string().trim().min(2).max(100),
  reason: z.string().trim().min(10).max(1000),
}).strict().refine((value) => Boolean(value.company_id) !== Boolean(value.claim_id), 'Choose one company or pending claim.')

export const tagReviewSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve'), slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(80), label: z.string().trim().min(2).max(100), note: z.string().trim().max(1000).optional() }).strict(),
  z.object({ action: z.literal('reject'), note: z.string().trim().max(1000).optional() }).strict(),
])

export function suggestedTagSlug(label: string) {
  return label.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80).replace(/-$/, '')
}
