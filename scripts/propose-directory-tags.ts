// Review-only export: public GET requests and local files; no database client or writer.
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import http from 'node:http'
import https from 'node:https'
import { proposeDirectoryTags, csvCell } from '../lib/tags/backfill'
import type { TagCatalog } from '../lib/tags/types'

async function main() {
  function option(name: string) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined }
  if (process.argv.some((arg) => /^(--apply|--write|--import|--approve)$/.test(arg))) throw new Error('This script only proposes tags. Database writes are not supported.')
  const output = path.resolve(option('--output') || 'data/enrichment/directory-tag-review')
  const timeout = Math.min(15000, Math.max(1000, Number(option('--timeout-ms') || 5000)))
  const concurrency = Math.min(8, Math.max(1, Number(option('--concurrency') || 4)))
  const catalog = JSON.parse(await readFile(path.resolve('data/directory-tags.json'), 'utf8')) as TagCatalog
  type Listing = { id: string; slug: string; name: string; description?: string | null; tagline?: string | null; website_url?: string | null; services?: string[]; specialties?: string[]; pathways?: string[] }
  let listings: Listing[]
  if (option('--input')) {
    const input = JSON.parse(await readFile(path.resolve(option('--input')!), 'utf8'))
    listings = Array.isArray(input) ? input : input.advisors || input.companies
  } else {
    listings = []
    let page = 1, pages = 1
    do {
      const response = await fetch(`https://thehockeydirectory.com/api/advisors?limit=100&page=${page}&sort=name`, { signal: AbortSignal.timeout(15000) })
      if (!response.ok) throw new Error('Public listing export failed.')
      const data = await response.json()
      listings.push(...data.advisors); pages = data.pagination.totalPages; page++
    } while (page <= pages)
  }
  if (!Array.isArray(listings)) throw new Error('Input must contain public listing records.')
  listings = [...new Map(listings.map((listing) => [listing.id, listing])).values()]
  await mkdir(output, { recursive: true })
  await writeFile(path.join(output, 'listing-input.json'), JSON.stringify(listings, null, 2))

  function publicAddress(address: string) {
    if (isIP(address) === 4) {
      const [a, b] = address.split('.').map(Number)
      return a > 0 && a < 224 && a !== 10 && a !== 127 && !(a === 169 && b === 254) && !(a === 172 && b >= 16 && b <= 31) && !(a === 192 && b === 168) && !(a === 100 && b >= 64 && b <= 127)
    }
    return isIP(address) === 6 && !/^(?:::|fc|fd|fe80|ff|2001:db8)/i.test(address)
  }
  async function website(urlValue: string, redirects = 0): Promise<{ source: string; text: string }> {
    const url = new URL(urlValue)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port && !['80', '443'].includes(url.port) || redirects > 3) throw new Error('Website URL is not a public HTTP page.')
    const addresses = await lookup(url.hostname, { all: true })
    if (!addresses.length || addresses.some((item) => !publicAddress(item.address))) throw new Error('Website resolves to a non-public address.')
    const address = addresses[0]
    const response = await new Promise<{ status: number; location?: string; text: string }>((resolve, reject) => {
      const request = (url.protocol === 'https:' ? https : http).get(url, { autoSelectFamily: false, lookup: (_hostname, _options, callback) => callback(null, address.address, address.family), headers: { 'User-Agent': 'HockeyDirectoryTagReview/1.0', Accept: 'text/html' } }, (incoming) => {
        let size = 0
        const chunks: Buffer[] = []
        incoming.on('data', (chunk: Buffer) => { size += chunk.length; if (size > 2_000_000) request.destroy(new Error('Website page is too large.')); else chunks.push(chunk) })
        incoming.on('end', () => resolve({ status: incoming.statusCode || 0, location: incoming.headers.location, text: Buffer.concat(chunks).toString('utf8') }))
        incoming.on('error', reject)
      })
      const timer = setTimeout(() => request.destroy(new Error('Website request timed out.')), timeout)
      request.on('close', () => clearTimeout(timer)); request.on('error', reject)
    })
    if (response.status >= 300 && response.status < 400 && response.location) return website(new URL(response.location, url).href, redirects + 1)
    if (response.status < 200 || response.status >= 300) throw new Error(`Website returned HTTP ${response.status}.`)
    return { source: url.href, text: response.text.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').slice(0, 150000) }
  }
  const cache = new Map<string, Promise<{ source: string; text: string }>>()
  const rows: string[][] = new Array(listings.length)
  const evidenceRows: string[][] = []
  let next = 0, completed = 0
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (next < listings.length) {
      const index = next++, listing = listings[index]
      const sources = [{ source: `https://thehockeydirectory.com/listings/${encodeURIComponent(listing.slug)}`, text: [listing.description, listing.tagline, ...(listing.services || []), ...(listing.specialties || []), ...(listing.pathways || [])].filter(Boolean).join('. ') }]
      let status = 'not provided'
      if (listing.website_url && !process.argv.includes('--skip-websites')) {
        try {
          if (!cache.has(listing.website_url)) cache.set(listing.website_url, website(listing.website_url))
          sources.push(await cache.get(listing.website_url)!); status = 'homepage checked'
        } catch (error) { status = error instanceof Error ? error.message : 'website unavailable' }
      } else if (process.argv.includes('--skip-websites')) status = 'not checked'
      const proposals = proposeDirectoryTags(catalog.tags, sources)
      const core = proposals.filter((proposal) => /^(services|pathways):/.test(proposal.tag_id))
      const valid = core.length >= 3 && core.length <= 5 && core.some((proposal) => proposal.tag_id.startsWith('services:'))
      rows[index] = [listing.id, listing.slug, listing.name, listing.website_url || '', proposals.map((proposal) => proposal.tag_id).join(';'), core.length.toString(), valid ? 'review every proposal' : 'needs manual core selection', status, 'pending', '', '']
      for (const evidence of proposals) evidenceRows.push([listing.id, listing.name, evidence.tag_id, evidence.label, evidence.source, evidence.excerpt, evidence.confidence])
      completed++
      if (completed % 20 === 0 || completed === listings.length) process.stdout.write(`Reviewed ${completed}/${listings.length} public listings; no database writes.\n`)
    }
  }))
  const csv = (headers: string[], values: string[][]) => [headers, ...values].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
  await writeFile(path.join(output, 'tag-proposals.csv'), csv(['company_id', 'slug', 'company_name', 'website_url', 'proposed_tag_ids', 'core_tag_count', 'selection_check', 'website_check', 'review_status', 'approved_tag_ids', 'review_notes'], rows))
  await writeFile(path.join(output, 'tag-evidence.csv'), csv(['company_id', 'company_name', 'tag_id', 'tag_label', 'source_url', 'excerpt', 'confidence'], evidenceRows.sort((a, b) => a[0].localeCompare(b[0]) || a[2].localeCompare(b[2]))))
  await writeFile(path.join(output, 'README.txt'), 'REVIEW REQUIRED. These are heuristic proposals, not verified facts. Review each evidence excerpt in context. Enter approved tag IDs only after review; choose 3–5 core Services/Pathways tags including a Service. Optional fit/region/language tags do not use core slots. Price is never inferred. Missing evidence is not evidence of absence. No database writes or import command are included.\n')
  process.stdout.write(`Saved review CSVs for ${listings.length} listings in ${output}. Database writes: zero.\n`)
}
main().catch((error) => { console.error(error instanceof Error ? error.message : 'Proposal export failed.'); process.exitCode = 1 })
