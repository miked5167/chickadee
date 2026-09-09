#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parse } from 'csv-parse/sync'

const projectRoot = resolve(import.meta.dirname, '..', '..')
const sourceCsv = join(projectRoot, 'data', 'transformed-advisors.csv')
const eliteProspectsPath = join(projectRoot, 'data', 'elite-prospects-agencies.json')
// The repository first added this Elite Prospects snapshot on 2025-11-11.
const eliteProspectsSnapshotDate = '2025-11-11'
const evidenceRoot = join(projectRoot, '.firecrawl', 'advisor-enrichment-20260822')
const outputRoot = join(projectRoot, 'data', 'enrichment', 'advisor-research-20260822')

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

function normalizeName(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\b(incorporated|inc|limited|ltd|llc|corp|corporation)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hostname(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}

function normalizeWebsite(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed || /^(?:not available|n\/?a|none|unknown)$/i.test(trimmed)) return null
  if (!/^https?:\/\//i.test(trimmed) && !/^[\w.-]+\.[a-z]{2,}(?:\/|$)/i.test(trimmed)) return null
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

function markdownLinks(markdown) {
  const links = []
  const pattern = /\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g
  let match
  while ((match = pattern.exec(markdown)) !== null) {
    links.push({ label: match[1].replace(/\\/g, '').trim(), url: match[2] })
  }
  return links
}

function cleanLines(markdown) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('![]('))
}

function readCapturedMarkdown(path) {
  if (!existsSync(path)) return null
  const raw = readFileSync(path, 'utf8')
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed.markdown === 'string') return parsed.markdown
    if (typeof parsed.data?.markdown === 'string') return parsed.data.markdown
  } catch {
    // Plain Markdown captures are expected for the batch files.
  }
  return raw
}

function readSiteFollowupMarkdown(listingDir) {
  const followupDir = join(listingDir, 'site-followup')
  const markerPath = join(followupDir, 'complete.json')
  if (!existsSync(markerPath)) return []
  try {
    const marker = JSON.parse(readFileSync(markerPath, 'utf8'))
    if (marker.exit_code !== 0) return []
  } catch {
    return []
  }
  const captures = []
  const singlePage = join(followupDir, 'page-1.md')
  if (existsSync(singlePage)) captures.push(readCapturedMarkdown(singlePage))
  const batchDir = join(followupDir, '.firecrawl')
  if (existsSync(batchDir)) {
    for (const name of readdirSync(batchDir).filter((value) => value.endsWith('.md')).sort()) {
      captures.push(readCapturedMarkdown(join(batchDir, name)))
    }
  }
  return [...new Set(captures.filter(Boolean))]
}

function readWebsiteDiscovery(listingDir) {
  const path = join(listingDir, 'website-discovery.json')
  if (!existsSync(path)) return null
  try {
    const payload = JSON.parse(readFileSync(path, 'utf8'))
    return {
      query: payload.query || null,
      searched_at: payload.searched_at || null,
      results: Array.isArray(payload.results) ? payload.results : [],
      note: 'Search candidates only; no replacement website was automatically accepted.',
    }
  } catch {
    return null
  }
}

function firstMatch(values, pattern) {
  for (const value of values) {
    const match = value.match(pattern)
    if (match) return match[1] || match[0]
  }
  return null
}

function extractSite(markdown, knownWebsite) {
  if (!markdown) return null
  const links = markdownLinks(markdown)
  const lines = cleanLines(markdown)
  const pageLinks = links.filter((link) => hostname(link.url) === hostname(knownWebsite))
  const socialUrls = links
    .map((link) => link.url)
    .filter((url) => /instagram\.com|facebook\.com|linkedin\.com|twitter\.com|x\.com|youtube\.com|tiktok\.com/i.test(url))
  const relevant = {}
  for (const link of pageLinks) {
    const text = `${link.label} ${link.url}`.toLowerCase()
    if (!relevant.about && /about|our-story|who-we-are/.test(text)) relevant.about = link.url
    if (!relevant.services && /service|advis|representation|program/.test(text)) relevant.services = link.url
    if (!relevant.team && /team|staff|people|agents|advisors/.test(text)) relevant.team = link.url
    if (!relevant.contact && /contact|get-in-touch|book|consult/.test(text)) relevant.contact = link.url
    if (!relevant.clients && /client|talent|athlete|players|roster/.test(text)) relevant.clients = link.url
  }

  const paragraphs = lines.filter((line) => {
    if (line.length < 70 || line.length > 900) return false
    if (/^[-#|\[]/.test(line)) return false
    if (/cookie|privacy policy|all rights reserved|sign in/i.test(line)) return false
    return true
  })

  const emails = [...new Set(markdown.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])]
  const phones = [...new Set(markdown.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]\d{4}/g) || [])]
  const contentHeadings = [...new Set(lines
    .filter((line) => /^#{1,4}\s+\S/.test(line))
    .map((line) => line.replace(/^#{1,4}\s+/, '').trim())
    .filter((line) => line.length >= 3 && line.length <= 100)
  )].slice(0, 60)
  const addresses = [...new Set(lines
    .map((line) => line
      .replace(/^[#>*-]+\s*/, '')
      .replace(/^(?:business|mailing|office)?\s*address\s*:?\s*/i, '')
      .replace(/^location\s*:?\s*/i, '')
      .trim())
    .filter((line) => {
      if (!/\b\d{1,6}\s+[A-Z0-9]/i.test(line) || !line.includes(',')) return false
      return /\b(?:USA|United States|Canada)\b/i.test(line)
        || /\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/i.test(line)
        || /\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/.test(line)
    }))]

  return {
    summary_excerpt: paragraphs.slice(0, 2).join(' ').slice(0, 900) || null,
    emails,
    phones,
    social_urls: [...new Set(socialUrls)],
    discovered_pages: relevant,
    page_link_count: pageLinks.length,
    content_headings: contentHeadings,
    addresses,
  }
}

function extractGoogle(markdown, listing) {
  if (!markdown) return null
  const lines = cleanLines(markdown)
  const links = markdownLinks(markdown)
  const knownDomain = hostname(listing.website_url)
  const officialLink = knownDomain
    ? links.find((link) => hostname(link.url) === knownDomain)
    : null
  const exactName = normalizeName(listing.name)
  const placeLinks = links.filter((link) => /google\.com\/maps\/place\//i.test(link.url))
  let placeLink = null

  if (officialLink) {
    const officialIndex = lines.findIndex((line) => line.includes(officialLink.url))
    const nearbyPlaceLinks = placeLinks
      .map((link) => ({
        ...link,
        index: lines.findIndex((line) => line.includes(link.url)),
      }))
      .filter((link) => link.index >= 0 && link.index <= officialIndex)
      .sort((a, b) => b.index - a.index)
    placeLink = nearbyPlaceLinks[0] || null
  }

  if (!placeLink) {
    placeLink = placeLinks.find((link) => normalizeName(link.label) === exactName) || null
  }

  const exactHeadingIndex = lines.findIndex((line) => normalizeName(line.replace(/^#+\s*/, '')) === exactName)
  const firstBusinessHeadingIndex = officialLink ? lines.findIndex((line) => /^#\s+\S/.test(line)) : -1
  const headingIndex = exactHeadingIndex >= 0 ? exactHeadingIndex : firstBusinessHeadingIndex
  const directPanel = headingIndex >= 0 && officialLink
  const placeIndex = placeLink ? lines.findIndex((line) => line.includes(placeLink.url)) : -1
  const startIndex = directPanel ? headingIndex : placeIndex

  if (!officialLink && !placeLink && !directPanel) {
    return {
      match_status: /no results|partial match/i.test(markdown) ? 'not_found' : 'unconfirmed',
      confidence: 'low',
      business_name: null,
      place_url: null,
      full_address: null,
      partial_address: null,
      phone: null,
      website: null,
      category: null,
      rating: null,
      review_count: null,
      business_hours: null,
      needs_exact_place_followup: false,
    }
  }

  const block = startIndex >= 0
    ? lines.slice(Math.max(0, startIndex), Math.min(lines.length, startIndex + 35))
    : lines
  const ratingText = block.find((line) => /^[1-5](?:\.\d)?$/.test(line)) || null
  const noReviews = block.some((line) => /^no reviews$/i.test(line))
  const reviewCountText = firstMatch(block, /([\d,]+)\s+reviews?/i)
  const phone = firstMatch(block, /((?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]\d{4})/)
  const hours = block.find((line) => /\b(?:open 24 hours|closed|opens?\s+\d|closes?\s+\d)\b/i.test(line)) || null
  const fullAddress = block.find((line) => {
    if (!/^\d{1,6}\s/.test(line) || !line.includes(',')) return false
    return /\b(?:USA|United States|Canada)\b/i.test(line)
      || /\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/i.test(line)
      || /\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/.test(line)
  }) || null
  const categoryAddressLine = block.find((line) => line.includes('·') && !/closed|open/i.test(line)) || null
  const [categoryPart, addressPart] = categoryAddressLine
    ? categoryAddressLine.split('·').map((part) => part.trim())
    : [null, null]
  let category = categoryPart
  if (!category && ratingText) {
    const ratingIndex = block.indexOf(ratingText)
    const candidate = block[ratingIndex + 1]
    if (candidate && !/overview|about|reviews?|directions/i.test(candidate)) category = candidate
  }

  const businessName = directPanel
    ? lines[headingIndex].replace(/^#+\s*/, '')
    : placeLink?.label || listing.name

  return {
    match_status: officialLink ? 'confirmed' : 'possible',
    confidence: officialLink ? 'high' : 'medium',
    business_name: businessName,
    place_url: placeLink?.url || null,
    full_address: fullAddress,
    partial_address: fullAddress ? null : addressPart,
    phone,
    website: officialLink?.url || null,
    category,
    rating: ratingText ? Number(ratingText) : null,
    review_count: noReviews ? 0 : (reviewCountText ? Number(reviewCountText.replace(/,/g, '')) : null),
    business_hours: hours,
    needs_exact_place_followup: Boolean(placeLink && !directPanel && !fullAddress),
  }
}

function csvEscape(value) {
  if (value === null || value === undefined) return ''
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function writeCsv(path, columns, csvRecords) {
  const output = [
    columns.join(','),
    ...csvRecords.map((record) => columns.map((column) => csvEscape(record[column])).join(',')),
  ].join('\n')
  writeFileSync(path, `${output}\n`, 'utf8')
}

function addressStreetKey(value) {
  return normalizeName(String(value || '').split(',')[0])
}

function addressesAgree(left, right) {
  const leftKey = addressStreetKey(left)
  const rightKey = addressStreetKey(right)
  return Boolean(leftKey && rightKey && (leftKey === rightKey || leftKey.includes(rightKey) || rightKey.includes(leftKey)))
}

function phoneDigits(value) {
  return String(value || '').replace(/\D/g, '').slice(-10)
}

const rows = parse(readFileSync(sourceCsv, 'utf8'), {
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  trim: true,
})
const eliteAgencies = JSON.parse(readFileSync(eliteProspectsPath, 'utf8'))
const eliteByName = new Map()
for (const agency of eliteAgencies) {
  const key = normalizeName(agency.name)
  const values = eliteByName.get(key) || []
  values.push(agency)
  eliteByName.set(key, values)
}

const records = rows.map((row, index) => {
  const sequence = String(index + 1).padStart(3, '0')
  const listingDir = join(evidenceRoot, `${sequence}-${slugify(row.name)}`)
  const sitePath = join(listingDir, 'official-site-home.md')
  const googlePath = join(listingDir, 'google-business.md')
  const googleFollowupPath = join(listingDir, 'google-place-followup.md')
  const knownWebsite = normalizeWebsite(row.website_url)
  const websiteDiscovery = readWebsiteDiscovery(listingDir)
  const siteHomeMarkdown = readCapturedMarkdown(sitePath)
  const siteFollowupMarkdown = readSiteFollowupMarkdown(listingDir)
  const siteMarkdown = [siteHomeMarkdown, ...siteFollowupMarkdown].filter(Boolean).join('\n\n') || null
  const siteData = siteMarkdown ? {
    ...extractSite(siteMarkdown, knownWebsite),
    followup_pages_captured: siteFollowupMarkdown.length,
  } : null
  const googleMarkdown = readCapturedMarkdown(googlePath)
  const googleFollowupMarkdown = readCapturedMarkdown(googleFollowupPath)
  const normalizedListing = { ...row, website_url: knownWebsite }
  const baseGoogle = extractGoogle(googleMarkdown, normalizedListing)
  const followupGoogle = extractGoogle(googleFollowupMarkdown, normalizedListing)
  const google = followupGoogle ? {
    ...baseGoogle,
    ...followupGoogle,
    match_status: [baseGoogle?.match_status, followupGoogle.match_status].includes('confirmed') ? 'confirmed' : baseGoogle?.match_status,
    confidence: [baseGoogle?.confidence, followupGoogle.confidence].includes('high') ? 'high' : baseGoogle?.confidence,
    business_name: followupGoogle.business_name || baseGoogle?.business_name,
    place_url: baseGoogle?.place_url || followupGoogle.place_url,
    full_address: followupGoogle.full_address || baseGoogle?.full_address,
    partial_address: followupGoogle.partial_address || baseGoogle?.partial_address,
    phone: followupGoogle.phone || baseGoogle?.phone,
    website: followupGoogle.website || baseGoogle?.website,
    category: followupGoogle.category || baseGoogle?.category,
    rating: followupGoogle.rating ?? baseGoogle?.rating,
    review_count: followupGoogle.review_count ?? baseGoogle?.review_count,
    business_hours: followupGoogle.business_hours || baseGoogle?.business_hours,
    needs_exact_place_followup: false,
  } : baseGoogle
  const eliteCandidates = eliteByName.get(normalizeName(row.name)) || []
  const expectedCountry = /^(ca|canada)$/i.test(row.country) ? 'CA' : 'US'
  const elite = eliteCandidates.find((candidate) => candidate.country === expectedCountry) || eliteCandidates[0] || null
  const existingAddress = row.address
    ? [row.address, row.city, row.state, row.zip_code, row.country]
      .filter((value) => value && !/^(unknown|xx|not available)$/i.test(value))
      .join(', ')
    : null
  const googleAddressCandidate = google?.confidence === 'high' ? google.full_address : null
  const officialSiteConfirmingAddress = googleAddressCandidate
    ? siteData?.addresses.find((address) => addressesAgree(address, googleAddressCandidate)) || null
    : null
  const candidateConflicts = []
  if (googleAddressCandidate) {
    const normalizedGoogleAddress = normalizeName(googleAddressCandidate)
    if (row.zip_code && !normalizedGoogleAddress.includes(normalizeName(row.zip_code))) candidateConflicts.push('existing_postal_code_differs')
    if (row.city && !/^(unknown|n\/a)$/i.test(row.city) && !normalizedGoogleAddress.includes(normalizeName(row.city))) candidateConflicts.push('existing_city_differs')
    if (row.state && !/^(xx|n\/a)$/i.test(row.state) && !normalizedGoogleAddress.includes(normalizeName(row.state))) candidateConflicts.push('existing_state_differs')
    if (google.business_name && normalizeName(google.business_name) !== normalizeName(row.name)) candidateConflicts.push('google_business_name_differs')
    if (row.phone && google.phone && phoneDigits(row.phone) !== phoneDigits(google.phone)) candidateConflicts.push('phone_differs')
  }
  const crossConfirmedAddress = googleAddressCandidate && officialSiteConfirmingAddress && candidateConflicts.length === 0
    ? googleAddressCandidate
    : null
  const recommendedAddress = existingAddress || crossConfirmedAddress
  const addressVerificationStatus = existingAddress
    ? 'existing_directory_address'
    : crossConfirmedAddress
      ? 'google_and_official_site_confirmed'
      : googleAddressCandidate
        ? officialSiteConfirmingAddress
          ? 'cross_confirmed_with_conflicts_needs_review'
          : 'google_only_needs_review'
        : 'no_street_address_found'

  return {
    index,
    listing_name: row.name,
    known_website: knownWebsite,
    website_discovery: websiteDiscovery,
    evidence_directory: listingDir,
    site_capture_status: siteMarkdown ? 'captured' : (knownWebsite ? 'failed_or_pending' : 'no_website'),
    site: siteData,
    google_business: google,
    existing_directory_address: existingAddress || null,
    google_address_candidate: googleAddressCandidate,
    official_site_confirming_address: officialSiteConfirmingAddress,
    address_candidate_conflicts: candidateConflicts,
    address_verification_status: addressVerificationStatus,
    recommended_address: recommendedAddress,
    recommended_address_source: existingAddress ? 'existing_directory' : (crossConfirmedAddress ? 'google_and_official_site_confirmed' : null),
    elite_prospects: elite ? {
      match_status: 'exact_normalized_historical_match',
      agency_name: elite.name,
      represented_player_count: elite.clientCount,
      country: elite.country,
      source_snapshot_date: eliteProspectsSnapshotDate,
      current_refresh_status: 'authentication_required',
    } : {
      match_status: 'not_matched',
      agency_name: null,
      represented_player_count: null,
      country: null,
      source_snapshot_date: eliteProspectsSnapshotDate,
      current_refresh_status: 'authentication_required',
    },
    researched_at: '2026-08-22',
  }
})

mkdirSync(outputRoot, { recursive: true })
const jsonOutput = `${JSON.stringify(records, null, 2)}\n`
writeFileSync(join(outputRoot, 'first-pass.json'), jsonOutput, 'utf8')
writeFileSync(join(outputRoot, 'advisor-enrichment.json'), jsonOutput, 'utf8')

const csvColumns = [
  'index', 'listing_name', 'known_website', 'site_capture_status',
  'website_discovery_candidates',
  'official_site_summary', 'official_site_emails', 'official_site_phones',
  'official_site_social_urls', 'official_site_addresses', 'official_site_headings',
  'official_site_discovered_pages', 'official_site_followup_pages_captured',
  'google_match_status', 'google_confidence', 'google_business_name', 'google_place_url',
  'google_full_address', 'google_partial_address', 'google_rating', 'google_review_count',
  'google_category', 'google_phone', 'google_website', 'google_hours',
  'google_address_candidate', 'official_site_confirming_address', 'address_verification_status', 'address_candidate_conflicts',
  'recommended_address', 'recommended_address_source',
  'elite_match_status', 'elite_agency_name', 'elite_represented_player_count', 'elite_snapshot_date', 'elite_refresh_status',
]
const csvRows = records.map((record) => ({
  index: record.index,
  listing_name: record.listing_name,
  known_website: record.known_website,
  site_capture_status: record.site_capture_status,
  website_discovery_candidates: record.website_discovery?.results,
  official_site_summary: record.site?.summary_excerpt,
  official_site_emails: record.site?.emails,
  official_site_phones: record.site?.phones,
  official_site_social_urls: record.site?.social_urls,
  official_site_addresses: record.site?.addresses,
  official_site_headings: record.site?.content_headings,
  official_site_discovered_pages: record.site?.discovered_pages,
  official_site_followup_pages_captured: record.site?.followup_pages_captured,
  google_match_status: record.google_business?.match_status,
  google_confidence: record.google_business?.confidence,
  google_business_name: record.google_business?.business_name,
  google_place_url: record.google_business?.place_url,
  google_full_address: record.google_business?.full_address,
  google_partial_address: record.google_business?.partial_address,
  google_rating: record.google_business?.rating,
  google_review_count: record.google_business?.review_count,
  google_category: record.google_business?.category,
  google_phone: record.google_business?.phone,
  google_website: record.google_business?.website,
  google_hours: record.google_business?.business_hours,
  google_address_candidate: record.google_address_candidate,
  official_site_confirming_address: record.official_site_confirming_address,
  address_verification_status: record.address_verification_status,
  address_candidate_conflicts: record.address_candidate_conflicts,
  recommended_address: record.recommended_address,
  recommended_address_source: record.recommended_address_source,
  elite_match_status: record.elite_prospects.match_status,
  elite_agency_name: record.elite_prospects.agency_name,
  elite_represented_player_count: record.elite_prospects.represented_player_count,
  elite_snapshot_date: record.elite_prospects.source_snapshot_date,
  elite_refresh_status: record.elite_prospects.current_refresh_status,
}))
const csv = [
  csvColumns.join(','),
  ...csvRows.map((record) => csvColumns.map((column) => csvEscape(record[column])).join(',')),
].join('\n')
writeFileSync(join(outputRoot, 'first-pass.csv'), `${csv}\n`, 'utf8')
writeFileSync(join(outputRoot, 'advisor-enrichment.csv'), `${csv}\n`, 'utf8')

const websiteColumns = [
  'listing_name', 'known_website', 'site_capture_status', 'summary', 'emails', 'phones',
  'social_urls', 'address_candidates', 'content_headings', 'discovered_pages',
  'followup_pages_captured', 'replacement_search_candidates',
]
writeCsv(join(outputRoot, 'website-research.csv'), websiteColumns, records.map((record) => ({
  listing_name: record.listing_name,
  known_website: record.known_website,
  site_capture_status: record.site_capture_status,
  summary: record.site?.summary_excerpt,
  emails: record.site?.emails,
  phones: record.site?.phones,
  social_urls: record.site?.social_urls,
  address_candidates: record.site?.addresses,
  content_headings: record.site?.content_headings,
  discovered_pages: record.site?.discovered_pages,
  followup_pages_captured: record.site?.followup_pages_captured,
  replacement_search_candidates: record.website_discovery?.results,
})))

const googleColumns = [
  'listing_name', 'match_status', 'confidence', 'business_name', 'place_url', 'full_address',
  'rating', 'review_count', 'category', 'phone', 'website', 'business_hours',
]
writeCsv(join(outputRoot, 'google-business-findings.csv'), googleColumns, records
  .filter((record) => ['confirmed', 'possible'].includes(record.google_business?.match_status))
  .map((record) => ({
    listing_name: record.listing_name,
    match_status: record.google_business.match_status,
    confidence: record.google_business.confidence,
    business_name: record.google_business.business_name,
    place_url: record.google_business.place_url,
    full_address: record.google_business.full_address,
    rating: record.google_business.rating,
    review_count: record.google_business.review_count,
    category: record.google_business.category,
    phone: record.google_business.phone,
    website: record.google_business.website,
    business_hours: record.google_business.business_hours,
  })))

const addressColumns = [
  'listing_name', 'known_website', 'existing_directory_address', 'google_business_name',
  'google_address_candidate', 'official_site_confirming_address', 'verification_status',
  'candidate_conflicts', 'recommended_address', 'recommended_address_source',
]
writeCsv(join(outputRoot, 'address-review.csv'), addressColumns, records
  .filter((record) => record.existing_directory_address || record.google_address_candidate)
  .map((record) => ({
    listing_name: record.listing_name,
    known_website: record.known_website,
    existing_directory_address: record.existing_directory_address,
    google_business_name: record.google_business?.business_name,
    google_address_candidate: record.google_address_candidate,
    official_site_confirming_address: record.official_site_confirming_address,
    verification_status: record.address_verification_status,
    candidate_conflicts: record.address_candidate_conflicts,
    recommended_address: record.recommended_address,
    recommended_address_source: record.recommended_address_source,
  })))

const eliteColumns = [
  'listing_name', 'elite_agency_name', 'represented_player_count', 'country',
  'snapshot_date', 'current_refresh_status',
]
writeCsv(join(outputRoot, 'elite-prospects-historical-counts.csv'), eliteColumns, records
  .filter((record) => record.elite_prospects.match_status === 'exact_normalized_historical_match')
  .map((record) => ({
    listing_name: record.listing_name,
    elite_agency_name: record.elite_prospects.agency_name,
    represented_player_count: record.elite_prospects.represented_player_count,
    country: record.elite_prospects.country,
    snapshot_date: record.elite_prospects.source_snapshot_date,
    current_refresh_status: record.elite_prospects.current_refresh_status,
  })))

const summary = {
  total_listings: records.length,
  official_sites_captured: records.filter((record) => record.site_capture_status === 'captured').length,
  unavailable_or_missing_sites_searched: records.filter((record) => record.website_discovery).length,
  unavailable_or_missing_sites_with_search_candidates: records.filter((record) => record.website_discovery?.results?.length > 0).length,
  official_sites_with_followup_pages: records.filter((record) => record.site?.followup_pages_captured > 0).length,
  official_site_followup_pages_captured: records.reduce((total, record) => total + (record.site?.followup_pages_captured || 0), 0),
  official_sites_with_email: records.filter((record) => record.site?.emails?.length > 0).length,
  official_sites_with_phone: records.filter((record) => record.site?.phones?.length > 0).length,
  official_sites_with_social_links: records.filter((record) => record.site?.social_urls?.length > 0).length,
  official_sites_with_address_candidates: records.filter((record) => record.site?.addresses?.length > 0).length,
  google_confirmed: records.filter((record) => record.google_business?.match_status === 'confirmed').length,
  google_possible: records.filter((record) => record.google_business?.match_status === 'possible').length,
  google_not_found_or_unconfirmed: records.filter((record) => !record.google_business || ['not_found', 'unconfirmed'].includes(record.google_business.match_status)).length,
  google_exact_place_followups: records.filter((record) => record.google_business?.needs_exact_place_followup).length,
  google_matches_with_rating: records.filter((record) => record.google_business?.rating !== null && record.google_business?.rating !== undefined).length,
  google_matches_with_review_count: records.filter((record) => record.google_business?.review_count !== null && record.google_business?.review_count !== undefined).length,
  google_matches_with_full_address: records.filter((record) => record.google_business?.full_address).length,
  google_matches_with_phone: records.filter((record) => record.google_business?.phone).length,
  google_matches_with_hours: records.filter((record) => record.google_business?.business_hours).length,
  existing_addresses: records.filter((record) => record.recommended_address_source === 'existing_directory').length,
  new_cross_confirmed_addresses: records.filter((record) => record.recommended_address_source === 'google_and_official_site_confirmed').length,
  google_address_candidates_needing_review: records.filter((record) => ['google_only_needs_review', 'cross_confirmed_with_conflicts_needs_review'].includes(record.address_verification_status)).length,
  historical_elite_prospects_exact_matches: records.filter((record) => record.elite_prospects.match_status === 'exact_normalized_historical_match').length,
  elite_prospects_snapshot_date: eliteProspectsSnapshotDate,
  elite_prospects_current_refresh_blocker: 'Individual agency pages redirect to login; authenticated access requires explicit approval.',
  generated_at: new Date().toISOString(),
}
writeFileSync(join(outputRoot, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
console.log(JSON.stringify(summary, null, 2))
