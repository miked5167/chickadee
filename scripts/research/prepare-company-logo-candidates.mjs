#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import sharp from 'sharp'

const projectRoot = resolve(import.meta.dirname, '..', '..')
const captureRoot = join(projectRoot, '.firecrawl', 'logo-branding-20261002')
const captureSummaryPath = join(captureRoot, 'summary.json')
const candidateRoot = join(projectRoot, '.firecrawl', 'logo-candidates-20261002')
const assetRoot = join(candidateRoot, 'assets')
const candidateSummaryPath = join(candidateRoot, 'summary.json')
const maxDownloadBytes = 12 * 1024 * 1024
const downloadConcurrency = 4
const darkBackgroundSlugs = new Set([
  'alpha-hockey-inc',
  'advancement-hockey-advising',
  'apx-advisors',
  'cal-sports-management',
  'driven-sports-group',
  'friesen-hockey',
  'ft-sports-management',
  'gryphon-sports-management',
  'hawkeye-hockey-services',
  'jrc-hockey-management',
  'lakonic-sports',
  'mcn-sports-advising',
  'meridian-hockey',
  'paragon-sports-consulting',
  'phenom-hockey-agency',
  'pro-guidance',
  'prosper-sports-group-inc',
  'select-hockey-management',
  'the-sports-corporation',
  'top-draft-hockey-ottawa',
  'wingman-hockey-group',
])
const manualExclusions = new Map([
  ['kb-advising', 'Detected inline image is a loading spinner, not the company logo'],
  ['ldc-talent', 'Official-site field resolves to Cook Stark Management, not LDC Talent'],
  ['optimize-sport', 'Detected image is a promotional player photo, not a company logo'],
  ['prep-hockey-advisors', 'Listed domain currently presents unrelated gambling branding'],
  ['tbc-hockey-advisors', 'Listed domain currently redirects to unrelated gambling branding'],
])
const genericPlatformImage = /(?:wix\.com\/favicon\.ico|static\.parastorage\.com\/client\/pfavico\.ico|img1\.wsimg\.com\/isteam\/ip\/static\/pwa-app\/logo-default\.png|yootheme\/packages\/theme-wordpress\/assets\/images\/apple-touch-icon\.png)/i

function dataImageBuffer(value) {
  const commaIndex = value.indexOf(',')
  const header = value.slice(0, commaIndex)
  const payload = value.slice(commaIndex + 1)
  if (commaIndex < 0 || !/^data:image\/[a-z0-9.+-]+(?:;[^,]*)?$/i.test(header)) {
    throw new Error('Unsupported data image')
  }
  return /;base64(?:;|$)/i.test(header)
    ? Buffer.from(payload, 'base64')
    : Buffer.from(decodeURIComponent(payload), 'utf8')
}

async function remoteImageBuffer(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'The Hockey Directory logo source review/1.0' },
  })
  if (!response.ok) throw new Error(`Image request returned ${response.status}`)
  const announcedSize = Number(response.headers.get('content-length') || 0)
  if (announcedSize > maxDownloadBytes) throw new Error('Image exceeds 12 MB limit')
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length > maxDownloadBytes) throw new Error('Image exceeds 12 MB limit')
  return buffer
}

async function normalizeCandidate(result) {
  const capturePath = join(captureRoot, `${result.slug}.json`)
  const capture = JSON.parse(readFileSync(capturePath, 'utf8'))
  const sourceImage = String(capture.branding?.logo || '').trim()
  if (!sourceImage) throw new Error('Capture has no logo candidate')
  if (manualExclusions.has(result.slug)) throw new Error(manualExclusions.get(result.slug))
  if (genericPlatformImage.test(sourceImage)) throw new Error('Detected image is a generic website-platform icon')
  if (!sourceImage.startsWith('data:image/') && !/^https?:\/\//i.test(sourceImage)) {
    throw new Error('Logo candidate uses an unsupported source')
  }

  const input = sourceImage.startsWith('data:image/')
    ? dataImageBuffer(sourceImage)
    : await remoteImageBuffer(sourceImage)
  const pipeline = sharp(input, { limitInputPixels: 40_000_000, animated: false }).rotate()
  const inputMetadata = await pipeline.metadata()
  if (!inputMetadata.width || !inputMetadata.height) throw new Error('Logo dimensions could not be read')

  const output = await pipeline
    .resize({ width: 800, height: 400, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer()
  const outputMetadata = await sharp(output).metadata()
  const assetPath = join(assetRoot, `${result.slug}.png`)
  writeFileSync(assetPath, output)

  return {
    slug: result.slug,
    name: result.name,
    website: result.website,
    sourcePage: capture.metadata?.url || capture.metadata?.sourceURL || result.website,
    sourceImage: sourceImage.startsWith('data:image/') ? (capture.metadata?.url || result.website) : sourceImage,
    sourceKind: sourceImage.startsWith('data:image/') ? 'official-inline-image' : 'official-image-url',
    brandName: capture.branding?.brandName || null,
    logoAlt: capture.branding?.images?.logoAlt || null,
    firecrawlConfidence: capture.branding?.confidence?.overall ?? null,
    background: darkBackgroundSlugs.has(result.slug) || capture.branding?.colorScheme === 'dark' ? 'dark' : 'light',
    input: {
      format: inputMetadata.format || null,
      width: inputMetadata.width,
      height: inputMetadata.height,
      bytes: input.length,
    },
    output: {
      path: assetPath,
      width: outputMetadata.width,
      height: outputMetadata.height,
      bytes: output.length,
      sha256: createHash('sha256').update(output).digest('hex'),
    },
  }
}

function xmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

async function createContactSheets(candidates) {
  const columns = 4
  const rows = 5
  const cellWidth = 330
  const cellHeight = 220
  const perSheet = columns * rows
  const sheets = []

  for (let offset = 0; offset < candidates.length; offset += perSheet) {
    const page = candidates.slice(offset, offset + perSheet)
    const composites = []
    for (const [pageIndex, candidate] of page.entries()) {
      const x = (pageIndex % columns) * cellWidth
      const y = Math.floor(pageIndex / columns) * cellHeight
      const logo = await sharp(candidate.output.path)
        .resize({ width: 285, height: 145, fit: 'inside', withoutEnlargement: true })
        .toBuffer()
      const metadata = await sharp(logo).metadata()
      const logoX = x + Math.round((cellWidth - (metadata.width || 0)) / 2)
      const logoY = y + Math.round((160 - (metadata.height || 0)) / 2)
      const label = `${offset + pageIndex + 1}. ${candidate.name}`
      const panelColor = candidate.background === 'dark' ? '#101b2d' : '#ffffff'
      composites.push({
        input: Buffer.from(`<svg width="${cellWidth}" height="${cellHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="${cellWidth}" height="160" fill="${panelColor}"/><rect y="160" width="${cellWidth}" height="60" fill="#f4f5f7"/><text x="12" y="188" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#111827">${xmlEscape(label)}</text><text x="12" y="208" font-family="Arial, sans-serif" font-size="11" fill="#4b5563">${xmlEscape(candidate.slug)}</text><rect x="0.5" y="0.5" width="${cellWidth - 1}" height="${cellHeight - 1}" fill="none" stroke="#cbd5e1"/></svg>`),
        left: x,
        top: y,
      })
      composites.push({ input: logo, left: logoX, top: logoY })
    }
    const sheetNumber = Math.floor(offset / perSheet) + 1
    const sheetPath = join(candidateRoot, `contact-sheet-${String(sheetNumber).padStart(2, '0')}.png`)
    await sharp({
      create: {
        width: columns * cellWidth,
        height: rows * cellHeight,
        channels: 4,
        background: '#e5e7eb',
      },
    }).composite(composites).png().toFile(sheetPath)
    sheets.push(sheetPath)
  }
  return sheets
}

if (!existsSync(captureSummaryPath)) throw new Error(`Missing capture summary: ${captureSummaryPath}`)
mkdirSync(assetRoot, { recursive: true })
const captureSummary = JSON.parse(readFileSync(captureSummaryPath, 'utf8'))
const sourceResults = captureSummary.results
  .filter((result) => result.status === 'candidate-found')
  .sort((a, b) => a.name.localeCompare(b.name))
const candidates = []
const failures = []
let nextIndex = 0

async function worker() {
  while (nextIndex < sourceResults.length) {
    const index = nextIndex
    nextIndex += 1
    const result = sourceResults[index]
    try {
      const candidate = await normalizeCandidate(result)
      candidates.push(candidate)
      console.log(`[${index + 1}/${sourceResults.length}] ${result.name}: prepared`)
    } catch (error) {
      failures.push({ slug: result.slug, name: result.name, website: result.website, reason: error.message })
      console.log(`[${index + 1}/${sourceResults.length}] ${result.name}: ${error.message}`)
    }
  }
}

await Promise.all(Array.from({ length: downloadConcurrency }, () => worker()))
candidates.sort((a, b) => a.name.localeCompare(b.name))
failures.sort((a, b) => a.name.localeCompare(b.name))
const contactSheets = await createContactSheets(candidates)
writeFileSync(candidateSummaryPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  captureGeneratedAt: captureSummary.generatedAt,
  candidateCount: candidates.length,
  failureCount: failures.length,
  candidates,
  failures,
  contactSheets,
}, null, 2)}\n`, 'utf8')
console.log(`Prepared ${candidates.length} logo candidates; ${failures.length} image downloads failed.`)
console.log(`Contact sheets: ${contactSheets.length}. Summary: ${candidateSummaryPath}`)
