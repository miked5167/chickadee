#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..', '..')
const outputRoot = join(projectRoot, '.firecrawl', 'logo-branding-20261002')
const summaryPath = join(outputRoot, 'summary.json')
const directoryApi = process.env.LOGO_DIRECTORY_API || 'http://localhost:3000/api/advisors'
const firecrawlCommand = process.platform === 'win32' ? process.execPath : 'firecrawl'
const firecrawlCli = process.platform === 'win32'
  ? join(process.env.APPDATA || '', 'npm', 'node_modules', 'firecrawl-cli', 'dist', 'index.js')
  : null
const concurrency = 2
const requestIntervalMs = 6_500
const skipSlugs = new Set([
  '2112-hockey-agency',
  '3v-sports-management',
  '4d-hockey-training',
])
const socialHosts = /^(?:www\.)?(?:facebook\.com|instagram\.com|linkedin\.com|twitter\.com|x\.com)$/i

function runFirecrawl(args, logPath) {
  return new Promise((resolvePromise) => {
    mkdirSync(dirname(logPath), { recursive: true })
    const log = createWriteStream(logPath, { flags: 'w' })
    const commandArguments = firecrawlCli ? [firecrawlCli, ...args] : args
    const child = spawn(firecrawlCommand, commandArguments, {
      cwd: projectRoot,
      env: process.env,
      windowsHide: true,
      shell: false,
    })
    child.stdout.pipe(log)
    child.stderr.pipe(log)
    child.on('error', (error) => log.write(`\nPROCESS ERROR: ${error.message}\n`))
    child.on('close', (code) => {
      log.end()
      resolvePromise(code ?? 1)
    })
  })
}

async function fetchCompanies() {
  const companies = []
  for (let page = 1; page <= 3; page += 1) {
    const response = await fetch(`${directoryApi}?limit=100&page=${page}`)
    if (!response.ok) throw new Error(`Directory API returned ${response.status} for page ${page}`)
    const payload = await response.json()
    companies.push(...payload.advisors)
    if (companies.length >= payload.total) break
  }
  return companies
}

function classifyWebsite(value) {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return { reason: 'invalid-protocol' }
    if (socialHosts.test(url.hostname)) return { reason: 'social-profile-only' }
    url.hash = ''
    return { url: url.toString() }
  } catch {
    return { reason: 'missing-or-invalid-website' }
  }
}

function readExistingResult(company, website, outputPath) {
  if (!existsSync(outputPath)) return null
  try {
    const capture = JSON.parse(readFileSync(outputPath, 'utf8'))
    const source = capture.metadata?.sourceURL
    if (!source || new URL(source).hostname.replace(/^www\./, '') !== new URL(website).hostname.replace(/^www\./, '')) {
      return null
    }
    return {
      slug: company.slug,
      name: company.name,
      website,
      status: capture.branding?.logo ? 'candidate-found' : 'no-logo-found',
      output: outputPath,
      reused: true,
    }
  } catch {
    return null
  }
}

async function captureCompany(company, website) {
  const outputPath = join(outputRoot, `${company.slug}.json`)
  const logPath = join(outputRoot, `${company.slug}.log`)
  const existing = readExistingResult(company, website, outputPath)
  if (existing) return existing

  const scrape = async (url) => runFirecrawl([
    'scrape', url,
    '--format', 'branding',
    '--max-age', '2592000000',
    '--output', outputPath,
  ], logPath)

  let attemptedUrl = website
  let code = await scrape(attemptedUrl)
  if ((code !== 0 || !existsSync(outputPath)) && website.startsWith('https://')) {
    attemptedUrl = website.replace(/^https:/, 'http:')
    code = await scrape(attemptedUrl)
  }

  if (code !== 0 || !existsSync(outputPath)) {
    return { slug: company.slug, name: company.name, website, attemptedUrl, status: 'capture-failed', output: outputPath }
  }

  try {
    const capture = JSON.parse(readFileSync(outputPath, 'utf8'))
    return {
      slug: company.slug,
      name: company.name,
      website,
      attemptedUrl,
      status: capture.branding?.logo ? 'candidate-found' : 'no-logo-found',
      output: outputPath,
    }
  } catch {
    return { slug: company.slug, name: company.name, website, attemptedUrl, status: 'invalid-capture', output: outputPath }
  }
}

function saveSummary(results) {
  const counts = results.reduce((totals, result) => {
    totals[result.status] = (totals[result.status] || 0) + 1
    return totals
  }, {})
  writeFileSync(summaryPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    directoryApi,
    counts,
    results,
  }, null, 2)}\n`, 'utf8')
}

mkdirSync(outputRoot, { recursive: true })
const companies = await fetchCompanies()
const pending = []
const results = []

for (const company of companies) {
  if (skipSlugs.has(company.slug)) {
    results.push({ slug: company.slug, name: company.name, website: company.website_url, status: 'already-reviewed' })
    continue
  }
  const classified = classifyWebsite(company.website_url)
  if (!classified.url) {
    results.push({ slug: company.slug, name: company.name, website: company.website_url, status: classified.reason })
    continue
  }
  pending.push({ company, website: classified.url })
}

console.log(`Logo source review: ${companies.length} listings; ${pending.length} official websites to capture.`)
let nextIndex = 0
let completed = 0
let nextRequestAt = 0

async function worker() {
  while (nextIndex < pending.length) {
    const index = nextIndex
    nextIndex += 1
    const { company, website } = pending[index]
    const outputPath = join(outputRoot, `${company.slug}.json`)
    const existing = readExistingResult(company, website, outputPath)
    let result
    if (existing) {
      result = existing
    } else {
      const waitMs = Math.max(0, nextRequestAt - Date.now())
      nextRequestAt = Math.max(Date.now(), nextRequestAt) + requestIntervalMs
      if (waitMs > 0) await new Promise((resolvePromise) => setTimeout(resolvePromise, waitMs))
      result = await captureCompany(company, website)
    }
    results.push(result)
    completed += 1
    console.log(`[${completed}/${pending.length}] ${company.name}: ${result.status}${result.reused ? ' (cached)' : ''}`)
    saveSummary(results)
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()))
results.sort((a, b) => a.name.localeCompare(b.name))
saveSummary(results)
console.log(`Branding capture complete. Summary: ${summaryPath}`)
