/**
 * A2 backfill — populate companies.client_count and companies.agency_tier
 * from data/agencies-status-review.csv.
 *
 * CSV columns: Agency Name, Clients Served, Country, Published, Status
 *
 * Matching: case-insensitive EXACT match on name (lowercased + whitespace-collapsed).
 *           We do NOT guess/fuzzy-match. Unmatched + ambiguous rows are written to a
 *           review file so a human can reconcile them.
 *
 * Tier:  >=100 clients -> 'elite_pro', 20-99 -> 'established', else 'family_advisor'.
 *
 * SAFETY: dry-run by default. Pass --write to persist. Run scripts/backup-database.sh
 *         (or your own backup) BEFORE running with --write.
 *
 * Usage:
 *   npx tsx scripts/backfill-agency-data.ts               # dry run (no writes)
 *   npx tsx scripts/backfill-agency-data.ts --write       # apply to DB
 *   npx tsx scripts/backfill-agency-data.ts --limit=20    # process first 20 CSV rows
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { parse } from 'csv-parse/sync'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const limitArg = args.find((a) => a.startsWith('--limit='))
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : null

type Tier = 'elite_pro' | 'established' | 'family_advisor'

function tierFor(clientCount: number | null): Tier {
  if (clientCount !== null && clientCount >= 100) return 'elite_pro'
  if (clientCount !== null && clientCount >= 20) return 'established'
  return 'family_advisor'
}

/** Normalize a name for case-insensitive exact matching. */
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim()
}

interface CsvRow {
  'Agency Name': string
  'Clients Served': string
  Country: string
  Published: string
  Status: string
}

async function main() {
  console.log('🏒 Agency data backfill (client_count, agency_tier)\n')
  console.log(`   Mode: ${WRITE ? '✍️  WRITE' : '🔎 DRY RUN (no DB writes)'}`)

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('\n❌ Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // --- Load CSV ---
  const csvPath = path.join(__dirname, '../data/agencies-status-review.csv')
  const rows = parse(fs.readFileSync(csvPath, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[]
  const csvRows = LIMIT ? rows.slice(0, LIMIT) : rows
  console.log(`   CSV rows: ${csvRows.length}${LIMIT ? ` (limited from ${rows.length})` : ''}`)

  // --- Load companies and index by normalized name (detect ambiguous names) ---
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, client_count, agency_tier')
  if (error) {
    console.error(`\n❌ Failed to load companies: ${error.message}`)
    process.exit(1)
  }

  const byName = new Map<string, { id: string; name: string }[]>()
  for (const c of companies || []) {
    const key = normalizeName(c.name)
    const list = byName.get(key) || []
    list.push({ id: c.id, name: c.name })
    byName.set(key, list)
  }

  const unmatched: { agencyName: string; reason: string }[] = []
  const updates: { id: string; name: string; client_count: number | null; agency_tier: Tier }[] = []

  for (const row of csvRows) {
    const agencyName = row['Agency Name']?.trim()
    if (!agencyName) continue

    const matches = byName.get(normalizeName(agencyName))
    if (!matches || matches.length === 0) {
      unmatched.push({ agencyName, reason: 'no company with this name' })
      continue
    }
    if (matches.length > 1) {
      unmatched.push({ agencyName, reason: `ambiguous — ${matches.length} companies share this name` })
      continue
    }

    const raw = (row['Clients Served'] ?? '').toString().replace(/[^0-9]/g, '')
    const clientCount = raw.length > 0 ? parseInt(raw, 10) : null

    updates.push({
      id: matches[0].id,
      name: matches[0].name,
      client_count: clientCount,
      agency_tier: tierFor(clientCount),
    })
  }

  // --- Report ---
  const tierCounts = updates.reduce(
    (acc, u) => ((acc[u.agency_tier] = (acc[u.agency_tier] || 0) + 1), acc),
    {} as Record<Tier, number>
  )
  console.log(`\n📊 Matched: ${updates.length} / ${csvRows.length}`)
  console.log(`   Tiers: elite_pro=${tierCounts.elite_pro || 0}, established=${tierCounts.established || 0}, family_advisor=${tierCounts.family_advisor || 0}`)
  console.log(`   Unmatched/ambiguous: ${unmatched.length}`)

  if (unmatched.length > 0) {
    const stamp = new Date().toISOString().slice(0, 10)
    const outFile = path.join(__dirname, `../data/agency-backfill-unmatched-${stamp}.json`)
    fs.writeFileSync(outFile, JSON.stringify(unmatched, null, 2))
    console.log(`   ⚠️  Unmatched rows written to ${path.relative(process.cwd(), outFile)} for human review`)
  }

  if (!WRITE) {
    console.log('\n🔎 Dry run complete — no changes written. Re-run with --write to apply.')
    console.log('   (Run scripts/backup-database.sh first.)')
    return
  }

  // --- Apply updates (per-row; small dataset) ---
  let ok = 0
  let failed = 0
  for (let i = 0; i < updates.length; i++) {
    const u = updates[i]
    const { error: upErr } = await supabase
      .from('companies')
      .update({ client_count: u.client_count, agency_tier: u.agency_tier })
      .eq('id', u.id)
    if (upErr) {
      failed++
      console.error(`   ❌ ${u.name}: ${upErr.message}`)
    } else {
      ok++
    }
    if ((i + 1) % 25 === 0) console.log(`   …${i + 1}/${updates.length}`)
  }

  console.log(`\n✅ Wrote ${ok} rows (${failed} failed).`)
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}

export { main as backfillAgencyData }
