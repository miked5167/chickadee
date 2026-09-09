#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { copyFileSync, createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { parse } from 'csv-parse/sync'

const projectRoot = resolve(import.meta.dirname, '..', '..')
const sourceCsv = join(projectRoot, 'data', 'transformed-advisors.csv')
const researchRoot = join(projectRoot, '.firecrawl', 'advisor-enrichment-20260822')
const manifestPath = join(researchRoot, 'manifest.json')
const firecrawlCommand = process.platform === 'win32' ? process.execPath : 'firecrawl'
const firecrawlCli = process.platform === 'win32'
  ? join(process.env.APPDATA || '', 'npm', 'node_modules', 'firecrawl-cli', 'dist', 'index.js')
  : null

function readNumberArgument(name, fallback) {
  const prefix = `--${name}=`
  const value = process.argv.find((argument) => argument.startsWith(prefix))
  if (!value) return fallback
  const parsed = Number(value.slice(prefix.length))
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`Invalid ${prefix} value`)
  return parsed
}

const startIndex = readNumberArgument('start', 0)
const requestedLimit = readNumberArgument('limit', Number.MAX_SAFE_INTEGER)
const requestIntervalMs = Math.max(0, readNumberArgument('request-interval-ms', 22_000))
const force = process.argv.includes('--force')
let nextRequestAt = 0

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'listing'
}

function validWebsite(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed || /^(?:not available|n\/?a|none|unknown)$/i.test(trimmed)) return null
  if (!/^https?:\/\//i.test(trimmed) && !/^[\w.-]+\.[a-z]{2,}(?:\/|$)/i.test(trimmed)) return null
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

function meaningfulLocationPart(value) {
  if (!value) return null
  const trimmed = String(value).trim()
  return /^(unknown|xx|n\/a|not available)$/i.test(trimmed) ? null : trimmed
}

function singleMarkdownScrapeArguments(url, outputPath) {
  return [
    'scrape', url,
    '--wait-for', '2500',
    '--only-main-content',
    '--format', 'markdown',
    '--json',
    '--pretty',
    '-o', outputPath,
  ]
}

async function waitForRequestSlot() {
  const waitMs = Math.max(0, nextRequestAt - Date.now())
  if (waitMs > 0) await new Promise((resolvePromise) => setTimeout(resolvePromise, waitMs))
  nextRequestAt = Date.now() + requestIntervalMs
}

async function runFirecrawl(args, logPath, commandWorkingDirectory = projectRoot) {
  await waitForRequestSlot()
  return new Promise((resolvePromise) => {
    mkdirSync(dirname(logPath), { recursive: true })
    const log = createWriteStream(logPath, { flags: 'a' })
    const commandArguments = firecrawlCli ? [firecrawlCli, ...args] : args
    const child = spawn(firecrawlCommand, commandArguments, {
      cwd: commandWorkingDirectory,
      env: process.env,
      windowsHide: true,
      shell: false,
    })

    child.stdout.pipe(log)
    child.stderr.pipe(log)
    child.on('error', (error) => {
      log.write(`\nPROCESS ERROR: ${error.message}\n`)
    })
    child.on('close', (code) => {
      log.end()
      resolvePromise({ code: code ?? 1 })
    })
  })
}

function saveManifest(records) {
  writeFileSync(manifestPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8')
}

mkdirSync(researchRoot, { recursive: true })

const rows = parse(readFileSync(sourceCsv, 'utf8'), {
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  trim: true,
})

const selectedRows = rows.slice(startIndex, startIndex + requestedLimit)
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : []
const manifestByIndex = new Map(manifest.map((record) => [record.index, record]))

console.log(`Researching ${selectedRows.length} listings, starting at index ${startIndex}.`)
console.log(`Raw evidence directory: ${researchRoot}`)

for (const [offset, row] of selectedRows.entries()) {
  const index = startIndex + offset
  const sequence = String(index + 1).padStart(3, '0')
  const slug = slugify(row.name)
  const listingDir = join(researchRoot, `${sequence}-${slug}`)
  const website = validWebsite(row.website_url)
  const siteOutput = join(listingDir, 'official-site-home.md')
  const googleOutput = join(listingDir, 'google-business.md')
  const batchLog = join(listingDir, 'firecrawl-batch.log')
  mkdirSync(listingDir, { recursive: true })

  const existing = manifestByIndex.get(index)
  if (!force && existing?.completed_at && existsSync(googleOutput) && (!website || existsSync(siteOutput))) {
    console.log(`[${sequence}/202] ${row.name}: already complete`)
    continue
  }

  console.log(`[${sequence}/202] ${row.name}: researching`)

  const location = [row.city, row.state, row.country]
    .map(meaningfulLocationPart)
    .filter(Boolean)
    .join(' ')
  const mapsQuery = encodeURIComponent(`${row.name} ${location}`.trim())
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`

  let batchStatus = 0
  if (website) {
    if (existsSync(googleOutput)) {
      const siteResult = await runFirecrawl(
        singleMarkdownScrapeArguments(website, siteOutput),
        batchLog,
      )
      batchStatus = siteResult.code
    } else {
      const batchArguments = [
        'scrape', website, mapsUrl,
        '--wait-for', '2500',
        '--format', 'markdown',
        '--json',
        '--pretty',
      ]
      const batchResult = await runFirecrawl(batchArguments, batchLog, listingDir)
      batchStatus = batchResult.code

      const batchOutputDir = join(listingDir, '.firecrawl')
      if (existsSync(batchOutputDir)) {
        const markdownFiles = readdirSync(batchOutputDir).filter((name) => name.endsWith('.md'))
        const googleFile = markdownFiles.find((name) => name.startsWith('google.com-maps-search'))
        const siteFile = markdownFiles.find((name) => !name.startsWith('google.com-maps-search'))
        if (googleFile) copyFileSync(join(batchOutputDir, googleFile), googleOutput)
        if (siteFile) copyFileSync(join(batchOutputDir, siteFile), siteOutput)
      }
    }
  } else {
    const googleResult = await runFirecrawl(
      singleMarkdownScrapeArguments(mapsUrl, googleOutput),
      batchLog,
    )
    batchStatus = googleResult.code
  }

  let siteStatus = website ? (existsSync(siteOutput) ? 0 : 1) : null
  if (website?.startsWith('https://') && siteStatus !== 0) {
    const fallbackWebsite = website.replace(/^https:/, 'http:')
    console.log(`[${sequence}/202] ${row.name}: retrying official site over HTTP`)
    const fallbackResult = await runFirecrawl(
      singleMarkdownScrapeArguments(fallbackWebsite, siteOutput),
      batchLog,
    )
    siteStatus = fallbackResult.code === 0 && existsSync(siteOutput) ? 0 : fallbackResult.code
  }

  const record = {
    index,
    listing_name: row.name,
    known_website: website,
    known_location: [row.address, row.city, row.state, row.zip_code, row.country]
      .map(meaningfulLocationPart)
      .filter(Boolean)
      .join(', '),
    official_site_status: siteStatus,
    google_business_status: existsSync(googleOutput) ? 0 : batchStatus || 1,
    evidence_directory: listingDir,
    completed_at: new Date().toISOString(),
  }
  manifestByIndex.set(index, record)
  saveManifest([...manifestByIndex.values()].sort((a, b) => a.index - b.index))
}

console.log('Research collection complete for the selected range.')
