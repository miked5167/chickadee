import starter from '@/data/directory-tags.json'
import type { TagCatalog } from './types'
import type { DirectoryListing } from './filter-logic'
export function tagPreviewEnabled() { return process.env.NODE_ENV === 'development' && !process.env.VERCEL_ENV }
export const previewCatalog = starter as TagCatalog
const records = [
  { name: 'North Star Demo Advising', country: 'CA', city: 'Toronto', state: 'ON', count: 45, tags: ['services:advisor', 'pathways:junior', 'pathways:ncaa', 'player_level:aaa', 'regions:ca-on', 'languages:english', 'age_group:15-17'] },
  { name: 'Maple Demo Advisors', country: 'CA', city: 'Vancouver', state: 'BC', count: 0, tags: ['services:advisor', 'pathways:prep-school', 'pathways:ncaa', 'player_level:aa', 'regions:ca-bc', 'languages:english', 'languages:french', 'age_group:13-14'] },
  { name: 'Harbour Demo Agency', country: 'US', city: 'Boston', state: 'MA', count: 128, tags: ['services:agent', 'pathways:junior', 'pathways:professional', 'player_level:aaa', 'regions:us-ma', 'languages:english', 'age_group:18-20'] },
  { name: 'Summit Demo Scouting', country: 'US', city: 'Minneapolis', state: 'MN', count: null, tags: ['services:scouting', 'services:video', 'pathways:junior', 'player_level:aa', 'regions:us-mn', 'languages:french'] },
  { name: 'Valley Demo Skills', country: 'CA', city: 'Ottawa', state: 'ON', count: null, tags: ['services:skills-coaching', 'services:video', 'pathways:prep-school', 'player_level:aa', 'regions:ca-on', 'languages:english'] },
]
export const previewListings: DirectoryListing[] = records.map((record, index) => ({
  ...record, id: `00000000-0000-4000-8000-00000000000${index + 1}`, slug: `tag-demo-${index + 1}`, logo_url: null,
  verified: index === 0, offers_remote: index !== 3, accepting_clients: index < 3,
  description: 'Fictional advisor for testing the tagging and filtering interface.',
  card_tags: previewCatalog.tags.filter((tag) => record.tags.includes(tag.id)),
  elite_prospects: record.count === null ? null : { match_status: 'exact', agency_name: record.name, client_count: record.count, source_url: 'https://www.eliteprospects.com/agent-portal/1/example', imported_at: '2026-10-02', source_observed_at: '2026-10-02' },
}))
