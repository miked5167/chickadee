import { createClient } from '@/lib/supabase/server'
import type { DirectoryTag, DirectoryTagGroup, TagCatalog } from './types'

export async function readTagCatalog(): Promise<TagCatalog> {
  const supabase = await createClient()
  const [groups, tags] = await Promise.all([
    supabase.from('directory_tag_groups').select('key, label, display_order, is_core, filter_enabled').order('display_order'),
    supabase.from('directory_tags').select('id, group_key, slug, label, parent_id, display_order, is_active').eq('is_active', true).order('display_order').order('id'),
  ])
  if (groups.error || tags.error || !groups.data?.length) throw new Error('The tag catalog is unavailable.')
  return { groups: groups.data as DirectoryTagGroup[], tags: (tags.data || []) as DirectoryTag[] }
}
