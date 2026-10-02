import 'server-only'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'
import type { CompanyResearch } from './company-research'

const evidence = { source_url: z.string().url(), quote: z.string().min(8) }
const fact = z.object({ text: z.string().min(1), ...evidence })
const schema = z.object({
  company_id: z.string(), slug: z.string(), name: z.string(), website_url: z.string().url(),
  status: z.enum(['draft', 'reviewed']),
  overview: z.array(fact), services: z.array(fact),
  team: z.array(z.object({ name:z.string().min(1), title:z.string().nullable(), bio:z.string().nullable(), linkedin_url:z.string().nullable(), ...evidence })),
  pricing: z.array(z.object({ name:z.string(), price:z.string(), details:z.string(), ...evidence })),
  company_linkedin: z.object({ url: z.string().url(), ...evidence }).optional(),
  sources: z.array(z.object({url:z.string().url(), captured_at:z.string()})),
})

// Deliberately development-only. Research drafts cannot enter production through a deployment.
// Importing into the database requires a separate reviewed, approved workflow.
export async function getLocalCompanyResearch(company: {id:string; slug:string; website_url:string | null}): Promise<CompanyResearch | null> {
  if (process.env.NODE_ENV !== 'development' || !/^[a-z0-9-]+$/.test(company.slug) || !company.website_url) return null
  try {
    const raw = await readFile(join(process.cwd(), '.firecrawl/profile-enrichment-20260912/results', `${company.slug}.json`), 'utf8')
    const result = schema.parse(JSON.parse(raw))
    const host = (value:string) => new URL(value).hostname.replace(/^www\./, '')
    if (result.company_id !== company.id || result.slug !== company.slug || host(result.website_url) !== host(company.website_url)) return null
    const allowed = new Set(result.sources.filter(source => ['http:', 'https:'].includes(new URL(source.url).protocol) && host(source.url) === host(company.website_url!)).map(source => source.url))
    for (const items of [result.overview, result.services, result.team, result.pricing, result.company_linkedin ? [result.company_linkedin] : []]) {
      if (items.some(item => !allowed.has(item.source_url))) return null
    }
    return result
  } catch { return null }
}
