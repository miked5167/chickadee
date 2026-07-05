/**
 * A3 (step 1) — Scrape the EliteProspects agent-portal index to build a
 * name -> { id, logoUrl } map, saved to data/ep-agency-id-map.json.
 *
 * Agent-portal URLs look like:  https://www.eliteprospects.com/agent-portal/{id}/{slug}
 * Logo files look like:         https://files.eliteprospects.com/layout/agency/{id-or-hash}.png
 * (the hashed form must be read from the agency page; it is not always {id}.png)
 *
 * POLITENESS (hard requirements):
 *   - 1 request/second (configurable via --delay=ms, min 1000)
 *   - a real, identifying User-Agent
 *   - STOP and report if we look blocked (HTTP 403/429, or a captcha/challenge body)
 *
 * This is a READ-ONLY scrape of a third-party site. It writes only a local JSON
 * file; it does NOT touch the database.
 *
 * Usage:
 *   npx tsx scripts/scrape-ep-agency-ids.ts                  # crawl index only (ids from listing)
 *   npx tsx scripts/scrape-ep-agency-ids.ts --with-logos     # also visit each agency page for its logo
 *   npx tsx scripts/scrape-ep-agency-ids.ts --max-pages=5    # limit index pages (testing)
 *
 * NOTE: EP's exact index path/pagination can change. INDEX_URL/PAGE_PARAM are set
 * as documented assumptions — verify against the live site before a full run.
 */

import * as path from 'path'
import * as fs from 'fs'

const args = process.argv.slice(2)
const WITH_LOGOS = args.includes('--with-logos')
const maxPagesArg = args.find((a) => a.startsWith('--max-pages='))
const MAX_PAGES = maxPagesArg ? parseInt(maxPagesArg.split('=')[1], 10) : 200
const delayArg = args.find((a) => a.startsWith('--delay='))
const DELAY_MS = Math.max(1000, delayArg ? parseInt(delayArg.split('=')[1], 10) : 1000)

// Documented assumptions — adjust if EP changes its site structure.
const INDEX_URL = 'https://www.eliteprospects.com/agents'
const PAGE_PARAM = 'page'
const USER_AGENT =
  'TheHockeyDirectoryBot/1.0 (+https://thehockeydirectory.com; contact: info@thehockeydirectory.com)'

const OUT_FILE = path.join(__dirname, '../data/ep-agency-id-map.json')
const LOGO_PLACEHOLDER = 'placeholders/no-logo-available'

interface AgencyEntry {
  id: string
  slug: string
  name: string
  url: string
  logoUrl: string | null
}

class BlockedError extends Error {}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
  })
  if (res.status === 403 || res.status === 429) {
    throw new BlockedError(`Blocked by EP (HTTP ${res.status}) at ${url}`)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} at ${url}`)
  const body = await res.text()
  if (/captcha|are you a robot|access denied|cf-challenge/i.test(body)) {
    throw new BlockedError(`Challenge/captcha page detected at ${url}`)
  }
  return body
}

/** Extract agent-portal links (id, slug) from an index page's HTML. */
function parseAgencyLinks(html: string): { id: string; slug: string }[] {
  const re = /\/agent-portal\/(\d+)\/([a-z0-9._-]+)/gi
  const seen = new Set<string>()
  const out: { id: string; slug: string }[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    if (!seen.has(m[1])) {
      seen.add(m[1])
      out.push({ id: m[1], slug: m[2] })
    }
  }
  return out
}

/** Read the real logo URL from an agency page (falls back to files/agency/{id}.png). */
function parseLogoUrl(html: string, id: string): string | null {
  const re = /https:\/\/files\.eliteprospects\.com\/layout\/agency\/[^"'\s)]+/gi
  const matches = html.match(re) || []
  const real = matches.find((u) => !u.includes(LOGO_PLACEHOLDER))
  if (real) return real
  // Deterministic fallback pattern (only valid for some agencies).
  return `https://files.eliteprospects.com/layout/agency/${id}.png`
}

function slugToName(slug: string): string {
  return slug.replace(/[-_]+/g, ' ').replace(/\./g, '. ').replace(/\s+/g, ' ').trim()
}

async function main() {
  console.log('🕷️  EliteProspects agency-id scraper\n')
  console.log(`   Index: ${INDEX_URL}`)
  console.log(`   Delay: ${DELAY_MS}ms/request  •  Max pages: ${MAX_PAGES}  •  Logos: ${WITH_LOGOS ? 'yes' : 'no'}`)

  const entries = new Map<string, AgencyEntry>()

  try {
    // 1) Crawl index pages until a page yields no new agencies.
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = `${INDEX_URL}?${PAGE_PARAM}=${page}`
      const html = await fetchHtml(url)
      const links = parseAgencyLinks(html)
      const newLinks = links.filter((l) => !entries.has(l.id))

      for (const l of newLinks) {
        entries.set(l.id, {
          id: l.id,
          slug: l.slug,
          name: slugToName(l.slug),
          url: `https://www.eliteprospects.com/agent-portal/${l.id}/${l.slug}`,
          logoUrl: null,
        })
      }

      console.log(`   page ${page}: +${newLinks.length} agencies (total ${entries.size})`)
      if (newLinks.length === 0) {
        console.log('   No new agencies on this page — assuming end of index.')
        break
      }
      await delay(DELAY_MS)
    }

    // 2) Optionally visit each agency page to resolve its real logo URL.
    if (WITH_LOGOS) {
      const list = [...entries.values()]
      for (let i = 0; i < list.length; i++) {
        const e = list[i]
        try {
          const html = await fetchHtml(e.url)
          e.logoUrl = parseLogoUrl(html, e.id)
        } catch (err) {
          if (err instanceof BlockedError) throw err
          console.warn(`   ⚠️  ${e.name}: ${(err as Error).message}`)
        }
        if ((i + 1) % 25 === 0) console.log(`   logos …${i + 1}/${list.length}`)
        await delay(DELAY_MS)
      }
    }
  } catch (err) {
    if (err instanceof BlockedError) {
      console.error(`\n🛑 STOPPING — ${err.message}`)
      console.error('   Saving partial results collected so far.')
    } else {
      throw err
    }
  }

  const result = [...entries.values()]
  fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2))
  console.log(`\n✅ Saved ${result.length} agencies to ${path.relative(process.cwd(), OUT_FILE)}`)
  const withLogos = result.filter((e) => e.logoUrl && !e.logoUrl.includes(LOGO_PLACEHOLDER)).length
  if (WITH_LOGOS) console.log(`   With a resolved (non-placeholder) logo: ${withLogos}`)
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}

export { main as scrapeEpAgencyIds }
