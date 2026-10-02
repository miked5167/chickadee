export const TAG_GROUP_KEYS = ['services', 'pathways', 'player_level', 'age_group', 'regions', 'languages', 'price_range'] as const
export type TagGroupKey = typeof TAG_GROUP_KEYS[number]

export interface DirectoryTagGroup {
  key: TagGroupKey
  label: string
  display_order: number
  is_core: boolean
  filter_enabled: boolean
}

export interface DirectoryTag {
  id: string
  group_key: TagGroupKey
  slug: string
  label: string
  parent_id: string | null
  display_order: number
  is_active: boolean
}

export interface TagCatalog {
  groups: DirectoryTagGroup[]
  tags: DirectoryTag[]
}

export interface TagSuggestion {
  id: string
  requester_user_id: string
  company_id: string | null
  claim_id: string | null
  group_key: TagGroupKey
  label: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  approved_tag_id: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
  created_at: string
}
