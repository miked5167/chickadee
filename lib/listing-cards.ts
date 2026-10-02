import type { DirectoryTag } from '@/lib/tags/types'
import type { EliteProspectsMeasurement } from '@/lib/research/elite-prospects'

export interface ListingCardDetails {
  tagline?: string | null
  card_tags?: DirectoryTag[]
  player_levels?: string[]
  age_groups?: string[]
  elite_prospects?: EliteProspectsMeasurement | null
}

export function cardTags(tags: DirectoryTag[] = []) {
  const active = tags.filter((tag) => tag.is_active)
  const ordered = (group: string) => active.filter((tag) => tag.group_key === group)
    .sort((a, b) => a.display_order - b.display_order || a.id.localeCompare(b.id))
  return [...ordered('services'), ...ordered('pathways')].slice(0, 5)
}

export function playerFit(details: ListingCardDetails) {
  const tags = (details.card_tags || []).filter((tag) => tag.is_active)
  const labels = (group: string, legacy: string[] = []) => {
    const approved = tags.filter((tag) => tag.group_key === group)
      .sort((a, b) => a.display_order - b.display_order || a.id.localeCompare(b.id)).map((tag) => tag.label)
    return [...new Set((approved.length ? approved : legacy).map((label) => label.trim()).filter(Boolean))]
  }
  const levels = labels('player_level', details.player_levels)
  const ages = labels('age_group', details.age_groups)
  return [levels.join(' / '), ages.length ? `Ages ${ages.join(', ')}` : ''].filter(Boolean).join(' · ')
}

export function cardSourceDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('en-CA', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}
