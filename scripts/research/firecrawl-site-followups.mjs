#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..', '..')
const inputPath = join(projectRoot, 'data', 'enrichment', 'advisor-research-20260822', 'first-pass.json')
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
const maxPages = Math.max(1, readNumberArgument('max-pages', 5))
const requestIntervalMs = Math.max(0, readNumberArgument('request-interval-ms', 22_000))

function runFirecrawl(args, logPath, workingDirectory) {
  return new Promise((resolvePromise) => {
    const log = createWriteStream(logPath, { flags: 'a' })
    const commandArguments = firecrawlCli ? [firecrawlCli, ...args] : args
    const child = spawn(firecrawlCommand, commandArguments, {
      cwd: workingDirectory,
      env: process.env,
      windowsHide: true,
      shell: false,
    })
    child.stdout.pipe(log)
    child.stderr.pipe(log)
    child.on('close', (code) => {
      log.end()
      resolvePromise(code ?? 1)
    })
  })
}

function normalizeUrl(value) {
  try {
    const url = new URL(value)
    url.hash = ''
    if (/\.(?:avif|gif|jpe?g|png|svg|webp|ico|mp4|mov|avi|zip)(?:$|\?)/i.test(url.pathname)) return null
    if (/\/(?:_next\/image|images?|media)(?:\/|$)/i.test(url.pathname)) return null
    if ([...url.searchParams.values()].some((part) => /\.(?:avif|gif|jpe?g|png|svg|webp|ico)(?:$|[?&#])/i.test(part))) return null
    return url.toString()
  } catch {
    return null
  }
}

const records = JSON.parse(readFileSync(inputPath, 'utf8'))
  .slice(startIndex, startIndex + requestedLimit)
const candidates = records
  .map((record) => {
    const knownHost = (() => {
      try { return new URL(record.known_website).hostname.replace(/^www\./, '').toLowerCase() } catch { return null }
    })()
    if (knownHost && /^(?:facebook\.com|instagram\.com|linkedin\.com|twitter\.com|x\.com)$/.test(knownHost)) {
      return { record, pages: [] }
    }
    const pages = Object.values(record.site?.discovered_pages || {})
      .map(normalizeUrl)
      .filter(Boolean)
    return { record, pages: [...new Set(pages)].slice(0, maxPages) }
  })
  .filter((candidate) => candidate.pages.length > 0)

console.log(`Downloading targeted pages for ${candidates.length} advisor sites.`)
for (const [candidateIndex, { record, pages }] of candidates.entries()) {
  const followupDir = join(record.evidence_directory, 'site-followup')
  const markerPath = join(followupDir, 'complete.json')
  const logPath = join(followupDir, 'firecrawl.log')
  mkdirSync(followupDir, { recursive: true })

  if (existsSync(markerPath)) {
    const marker = JSON.parse(readFileSync(markerPath, 'utf8'))
    const lastCompletion = existsSync(logPath)
      ? readFileSync(logPath, 'utf8').split(/\r?\n/).filter((line) => line.startsWith('Completed:')).at(-1)
      : null
    const hasPartialFailure = /,\s*[1-9][0-9]* failed$/.test(lastCompletion || '')
    if (marker.exit_code === 0 && !hasPartialFailure) {
      console.log(`[${candidateIndex + 1}/${candidates.length}] ${record.listing_name}: already complete`)
      continue
    }
  }

  console.log(`[${candidateIndex + 1}/${candidates.length}] ${record.listing_name}: ${pages.length} targeted pages`)
  const args = [
    'scrape', ...pages,
    '--wait-for', '1500',
    '--only-main-content',
    '--format', 'markdown',
    '--json',
    '--pretty',
  ]
  if (pages.length === 1) args.push('-o', join(followupDir, 'page-1.md'))

  const code = await runFirecrawl(args, logPath, followupDir)
  writeFileSync(markerPath, `${JSON.stringify({
    listing_name: record.listing_name,
    urls: pages,
    exit_code: code,
    completed_at: new Date().toISOString(),
  }, null, 2)}\n`, 'utf8')

  if (candidateIndex < candidates.length - 1) {
    // Firecrawl counts every URL in a batch toward the per-minute request limit.
    // Keep the effective rate below ten pages per minute, including multi-page batches.
    const throttleMs = Math.max(requestIntervalMs, pages.length * 6_500)
    await new Promise((resolvePromise) => setTimeout(resolvePromise, throttleMs))
  }
}

console.log('Targeted advisor-site follow-ups complete.')
