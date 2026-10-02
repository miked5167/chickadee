import type { createClient } from '@/lib/supabase/server'
import type { DirectoryTag } from '@/lib/tags/types'
import type { ListingCardDetails } from '@/lib/listing-cards'

type Client = Awaited<ReturnType<typeof createClient>>

// Optional card details are read in batches for the displayed companies only.
// Missing tables during rollout must not prevent the directory from rendering.
export async function enrichListingCards<T extends { id: string }>(supabase: Client, companies: T[]): Promise<Array<T & ListingCardDetails>> {
  if (!companies.length) return []
  const ids = [...new Set(companies.map((company) => company.id))]
  const [profiles, assignments] = await Promise.allSettled([
    supabase.from('company_profiles').select('company_id, tagline, player_levels, age_groups').in('company_id', ids),
    supabase.from('company_tags').select('company_id, directory_tags(id, group_key, slug, label, parent_id, display_order, is_active)').in('company_id', ids),
  ])
  const profilesById = new Map<string, ListingCardDetails>()
  const tagsById = new Map<string, DirectoryTag[]>()
  if (profiles.status === 'fulfilled' && !profiles.value.error) {
    for (const profile of profiles.value.data || []) profilesById.set(profile.company_id, {
      tagline: profile.tagline,
      player_levels: profile.player_levels || [],
      age_groups: profile.age_groups || [],
    })
  }
  if (assignments.status === 'fulfilled' && !assignments.value.error) {
    for (const assignment of assignments.value.data || []) {
      // The FK is many-to-one; tolerate array-shaped joins from older clients.
      const joined = assignment.directory_tags
      const tag = (Array.isArray(joined) ? joined[0] : joined) as DirectoryTag | null
      if (!tag?.is_active) continue
      const tags = tagsById.get(assignment.company_id) || []
      tags.push(tag)
      tagsById.set(assignment.company_id, tags)
    }
  }
  return companies.map((company) => ({ ...company, ...profilesById.get(company.id), card_tags: tagsById.get(company.id) || [] }))
}
