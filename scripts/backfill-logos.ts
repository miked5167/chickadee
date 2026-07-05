/**
 * A3 (step 2) — Backfill companies.logo_url from the EP agency map.
 *
 * For every company with an empty logo_url:
 *   1. match by normalized name to data/ep-agency-id-map.json
 *      (falls back to ep-advisors-logos.json if the map hasn't been scraped yet)
 *   2. VERIFY the candidate logo URL actually returns HTTP 200 + a real image
 *      (not a placeholder, not 0 bytes)
 *   3. only then set logo_url
 *
 * DECISION GATE (per task): if more than ~150 logos resolve, do NOT silently pick
 * how to store them. This script STOPS and asks you to choose:
 *   --mode=mirror   (recommended) download each image and upload to Supabase
 *                   Storage, then point logo_url at our own public URL. Avoids
 *                   depending on EP's CDN / hotlinking.
 *   --mode=hotlink  set logo_url directly to the EP files URL.
 * (Note: the repo currently mirrors one-off logos via Cloudinary; the task
 *  specifies Supabase Storage, which is what --mode=mirror uses.)
 *
 * SAFETY: dry-run by default. Pass --write to persist. Run scripts/backup-database.sh
 *         BEFORE running with --write.
 *
 * Usage:
 *   npx tsx scripts/backfill-logos.ts                       # dry run: match + verify + report
 *   npx tsx scripts/backfill-logos.ts --mode=mirror --write
 *   npx tsx scripts/backfill-logos.ts --mode=hotlink --write
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const modeArg = args.find((a) => a.startsWith('--mode='))
const MODE = modeArg ? (modeArg.split('=')[1] as 'mirror' | 'hotlink') : null

const RESOLVE_GATE = 150
const STORAGE_BUCKET = 'company-logos'
const LOGO_PLACEHOLDER = 'placeholders/no-logo-available'
const MIN_IMAGE_BYTES = 512
const DELAY_MS = 250

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim()
}

interface MapEntry {
  id: string
  slug: string
  name: string
  logoUrl: string | null
}

function loadLogoMap(): Map<string, string> {
  const primary = path.join(__dirname, '../data/ep-agency-id-map.json')
  const fallback = path.join(__dirname, '../ep-advisors-logos.json')
  const file = fs.existsSync(primary) ? primary : fallback
  console.log(`   Logo map: ${path.relative(process.cwd(), file)}`)
  const entries = JSON.parse(fs.readFileSync(file, 'utf8')) as MapEntry[]
  const map = new Map<string, string>()
  for (const e of entries) {
    if (e.logoUrl && !e.logoUrl.includes(LOGO_PLACEHOLDER)) {
      map.set(normalizeName(e.name), e.logoUrl)
    }
  }
  return map
}

/** HTTP-verify a logo URL is a real, non-empty image. Returns bytes or null. */
async function verifyImage(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.byteLength < MIN_IMAGE_BYTES) return null
    return { buffer, contentType }
  } catch {
    return null
  }
}

function extFromContentType(ct: string): string {
  if (ct.includes('png')) return 'png'
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg'
  if (ct.includes('webp')) return 'webp'
  if (ct.includes('svg')) return 'svg'
  return 'png'
}

async function main() {
  console.log('🏒 Logo backfill (EliteProspects → companies.logo_url)\n')
  console.log(`   Mode: ${WRITE ? '✍️  WRITE' : '🔎 DRY RUN'}  •  Storage mode: ${MODE ?? '(none chosen)'}`)

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('\n❌ Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const logoMap = loadLogoMap()
  console.log(`   Non-placeholder logos in map: ${logoMap.size}`)

  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, logo_url')
    .or('logo_url.is.null,logo_url.eq.')
  if (error) {
    console.error(`\n❌ Failed to load companies: ${error.message}`)
    process.exit(1)
  }
  console.log(`   Companies missing a logo: ${companies?.length || 0}`)

  // 1) Match by normalized name.
  const matched = (companies || [])
    .map((c) => ({ ...c, candidate: logoMap.get(normalizeName(c.name)) }))
    .filter((c): c is typeof c & { candidate: string } => Boolean(c.candidate))
  console.log(`   Matched to a candidate logo: ${matched.length}`)

  // 2) Verify each candidate is a real image.
  const verified: { id: string; name: string; url: string; buffer: Buffer; contentType: string }[] = []
  for (let i = 0; i < matched.length; i++) {
    const m = matched[i]
    const img = await verifyImage(m.candidate)
    if (img) verified.push({ id: m.id, name: m.name, url: m.candidate, ...img })
    if ((i + 1) % 25 === 0) console.log(`   verifying …${i + 1}/${matched.length}`)
    await delay(DELAY_MS)
  }
  console.log(`   Verified real images: ${verified.length}`)

  // 3) Decision gate.
  if (verified.length > RESOLVE_GATE && !MODE) {
    console.log(
      `\n🛑 ${verified.length} logos resolved (> ${RESOLVE_GATE}). Choose how to store them before writing:`
    )
    console.log('   • Recommended: --mode=mirror  (copy into Supabase Storage; no EP-CDN dependency)')
    console.log('   • Or:          --mode=hotlink (point logo_url straight at EP files URLs)')
    console.log('   Re-run with a --mode=… and --write. (Run scripts/backup-database.sh first.)')
    return
  }

  if (!WRITE) {
    console.log('\n🔎 Dry run complete — no changes written.')
    console.log(`   Coverage: matched=${matched.length}, verified=${verified.length} (of ${companies?.length || 0} missing).`)
    console.log('   Re-run with --mode=mirror|hotlink and --write to apply.')
    return
  }

  const mode = MODE ?? 'mirror'
  let set = 0
  let failed = 0

  for (let i = 0; i < verified.length; i++) {
    const v = verified[i]
    try {
      let finalUrl = v.url

      if (mode === 'mirror') {
        const ext = extFromContentType(v.contentType)
        const objectPath = `${v.id}.${ext}`
        const { error: upErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(objectPath, v.buffer, { contentType: v.contentType, upsert: true })
        if (upErr) throw new Error(`storage upload: ${upErr.message}`)
        finalUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath).data.publicUrl
      }

      const { error: dbErr } = await supabase
        .from('companies')
        .update({ logo_url: finalUrl })
        .eq('id', v.id)
      if (dbErr) throw new Error(dbErr.message)
      set++
    } catch (e) {
      failed++
      console.error(`   ❌ ${v.name}: ${(e as Error).message}`)
    }
    if ((i + 1) % 25 === 0) console.log(`   writing …${i + 1}/${verified.length}`)
  }

  console.log(`\n✅ Coverage — matched: ${matched.length} / verified: ${verified.length} / set: ${set} (${failed} failed), mode=${mode}`)
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}

export { main as backfillLogos }
