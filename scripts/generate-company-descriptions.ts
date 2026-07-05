/**
 * A4 — Generate factual descriptions for companies that are missing one.
 *
 * Uses ONLY known structured fields (name, city, state/province, country,
 * client_count, agency_tier, website domain). No web scraping, no AI, no
 * superlatives, no invented history. Template-with-variation so pages don't
 * share identical copy (variant chosen deterministically from the company id).
 * Each description is ~60-100 words and mentions the city + "hockey advisor/agency"
 * for SEO.
 *
 * Depends on A2 (client_count / agency_tier). If those columns don't exist yet the
 * script still runs, treating them as unknown.
 *
 * SAFETY: dry-run by default (prints samples). Pass --write to persist, in batches
 *         of 25. Run scripts/backup-database.sh BEFORE running with --write.
 *
 * Usage:
 *   npx tsx scripts/generate-company-descriptions.ts             # dry run + samples
 *   npx tsx scripts/generate-company-descriptions.ts --write
 *   npx tsx scripts/generate-company-descriptions.ts --limit=50
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const limitArg = args.find((a) => a.startsWith('--limit='))
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : null
const BATCH_SIZE = 25

interface Company {
  id: string
  name: string
  city: string | null
  state_province: string | null
  country: string | null
  client_count: number | null
  agency_tier: string | null
  website_url: string | null
}

/** Stable non-negative hash of a string (for deterministic variant selection). */
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function pick<T>(variants: T[], seed: number): T {
  return variants[seed % variants.length]
}

function countryName(code: string | null): string {
  if (code === 'CA') return 'Canada'
  if (code === 'US') return 'the United States'
  return 'North America'
}

/** Is this more naturally an "agency" or an individual "advisor"? Name-based only. */
function kindFor(name: string): 'agency' | 'advisor' {
  return /management|sports|agency|group|consult|associates|partners/i.test(name) ? 'agency' : 'advisor'
}

function domainOf(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

function buildDescription(c: Company): string {
  const seed = hash(c.id || c.name)
  const kind = kindFor(c.name)
  const location = [c.city, c.state_province].filter(Boolean).join(', ') || countryName(c.country)
  const hasCity = Boolean(c.city)

  const sentences: string[] = []

  // 1) Identity + location (always includes "hockey advisor/agency"; city when known).
  sentences.push(
    pick(
      [
        `${c.name} is a hockey ${kind} based in ${location}.`,
        `Based in ${location}, ${c.name} is a hockey ${kind}.`,
        `${c.name} is a hockey ${kind} serving families in and around ${location}.`,
      ],
      seed
    )
  )

  // 2) What a hockey advisor does (category-level facts — true, not agency-specific claims).
  sentences.push(
    pick(
      [
        `Hockey advisors guide players and families through the decisions that shape a career — team placement, development, and the recruiting process.`,
        `A hockey ${kind} helps families weigh options across AAA, junior, prep school, and NCAA pathways and plan a route that fits the player.`,
        `The work spans player development, team and program placement, and college recruiting, helping families navigate each step with better information.`,
      ],
      seed + 1
    )
  )

  // 3) Client count (only when known — never fabricated).
  if (typeof c.client_count === 'number' && c.client_count > 0) {
    sentences.push(
      pick(
        [
          `${c.name} currently represents ${c.client_count} players.`,
          `The ${kind} represents ${c.client_count} players across its roster.`,
        ],
        seed + 2
      )
    )
  }

  // 4) Coverage / website (factual add-ons for length + SEO).
  const domain = domainOf(c.website_url)
  const coverage = pick(
    [
      `It works with hockey families across ${countryName(c.country)}.`,
      `Its clients include hockey families throughout ${countryName(c.country)}.`,
    ],
    seed + 3
  )
  sentences.push(coverage)
  if (domain) sentences.push(`More information is available at ${domain}.`)

  // 5) Ensure a reasonable length floor without inventing agency-specific claims.
  const filler = [
    `Families researching hockey advisors typically compare experience, the pathways an advisor knows best, and how they communicate.`,
    hasCity
      ? `For families near ${c.city}, working with a local hockey ${kind} can help with region-specific league and school decisions.`
      : `Working with a hockey ${kind} can help with league, school, and development decisions at every level.`,
  ]
  let fi = 0
  let text = sentences.join(' ')
  while (wordCount(text) < 60 && fi < filler.length) {
    sentences.push(filler[fi++])
    text = sentences.join(' ')
  }

  // Trim if we somehow ran long (keep whole sentences).
  if (wordCount(text) > 100) {
    const kept: string[] = []
    for (const s of sentences) {
      if (wordCount([...kept, s].join(' ')) > 100) break
      kept.push(s)
    }
    text = kept.join(' ')
  }

  return text
}

async function main() {
  console.log('🏒 Company description generator (factual, fields-only)\n')
  console.log(`   Mode: ${WRITE ? '✍️  WRITE (batches of 25)' : '🔎 DRY RUN (samples only)'}`)

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('\n❌ Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const fullCols = 'id, name, city, state_province, country, client_count, agency_tier, website_url'
  const baseCols = 'id, name, city, state_province, country, website_url'

  const runQuery = (cols: string) =>
    supabase.from('companies').select(cols).or('description.is.null,description.eq.')

  let { data, error } = await runQuery(fullCols)
  if (error && /client_count|agency_tier|column/i.test(error.message)) {
    console.warn('   ⚠️  client_count/agency_tier not found — run the A2 migration first. Proceeding without them.')
    ;({ data, error } = await runQuery(baseCols))
  }
  if (error) {
    console.error(`\n❌ Failed to load companies: ${error.message}`)
    process.exit(1)
  }

  let companies = ((data as unknown as Company[]) || []).map((c) => ({
    client_count: null,
    agency_tier: null,
    ...c,
  }))
  if (LIMIT) companies = companies.slice(0, LIMIT)
  console.log(`   Companies missing a description: ${companies.length}`)

  if (companies.length === 0) {
    console.log('   Nothing to do.')
    return
  }

  const generated = companies.map((c) => ({ id: c.id, name: c.name, description: buildDescription(c) }))

  // Show a few samples.
  console.log('\n   Samples:')
  for (const g of generated.slice(0, 3)) {
    console.log(`\n   • ${g.name} (${g.description.trim().split(/\s+/).length} words)`)
    console.log(`     ${g.description}`)
  }

  if (!WRITE) {
    console.log('\n🔎 Dry run complete — no changes written. Re-run with --write to apply.')
    console.log('   (Run scripts/backup-database.sh first.)')
    return
  }

  let ok = 0
  let failed = 0
  for (let i = 0; i < generated.length; i++) {
    const g = generated[i]
    const { error: upErr } = await supabase
      .from('companies')
      .update({ description: g.description })
      .eq('id', g.id)
    if (upErr) {
      failed++
      console.error(`   ❌ ${g.name}: ${upErr.message}`)
    } else {
      ok++
    }
    if ((i + 1) % BATCH_SIZE === 0) console.log(`   …${i + 1}/${generated.length} written`)
  }

  console.log(`\n✅ Wrote ${ok} descriptions (${failed} failed).`)
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}

export { main as generateCompanyDescriptions }
