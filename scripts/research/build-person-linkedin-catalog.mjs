// Builds the deployable catalog from the reviewed, read-only Firecrawl audit.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const auditPath = resolve('.firecrawl/linkedin-people-audit-20261002/audit.json')
const researchRoot = resolve('.firecrawl/profile-enrichment-20260912/results')
const outputPath = resolve('lib/research/person-linkedin-catalog.json')
const reviewPath = resolve('docs/restart/LINKEDIN_NAME_ONLY_REVIEW_20261002.md')
const audit = JSON.parse(readFileSync(auditPath, 'utf8'))

const normalize = (value = '') => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
const research = new Map()
for (const file of readdirSync(researchRoot).filter((name) => name.endsWith('.json'))) {
  const record = JSON.parse(readFileSync(join(researchRoot, file), 'utf8'))
  for (const person of record.team || []) {
    if (person.linkedin_url) research.set(`${record.slug}|${normalize(person.name)}`, person)
  }
}

const accepted = audit.records.filter((record) => ['existing', 'high_confidence'].includes(record.status))
const records = accepted.map((record) => {
  if (record.status === 'existing') {
    const evidence = research.get(`${record.company_slug}|${normalize(record.person_name)}`)
    if (!evidence) throw new Error(`Missing existing evidence for ${record.company_slug}: ${record.person_name}`)
    return {
      companySlug: record.company_slug,
      companyName: record.company_name,
      personName: record.person_name,
      url: record.selected_url,
      evidenceKind: 'official_website',
      evidenceUrl: evidence.source_url,
      evidenceText: `${record.person_name} — ${evidence.quote}`,
      reviewedAt: '2026-10-02',
    }
  }
  const candidate = record.candidates.find((item) => item.url === record.selected_url)
  if (!candidate || !normalize(candidate.title).includes(normalize(record.person_name)) || !candidate.company_match) {
    throw new Error(`Candidate no longer meets the acceptance rule for ${record.company_slug}: ${record.person_name}`)
  }
  return {
    companySlug: record.company_slug,
    companyName: record.company_name,
    personName: record.person_name,
    url: record.selected_url,
    evidenceKind: 'public_search',
    evidenceUrl: record.selected_url,
    evidenceText: [candidate.title, candidate.description].filter(Boolean).join(' — '),
    reviewedAt: '2026-10-02',
  }
}).sort((a, b) => a.companySlug.localeCompare(b.companySlug) || a.personName.localeCompare(b.personName))

const duplicate = records.find((record, index) => records.findIndex((other) => other.companySlug === record.companySlug && normalize(other.personName) === normalize(record.personName)) !== index)
if (duplicate) throw new Error(`Duplicate person catalog entry: ${duplicate.companySlug}: ${duplicate.personName}`)

writeFileSync(outputPath, JSON.stringify({
  reviewedAt: '2026-10-02',
  method: 'Exact directory person name plus matching company evidence. Name-only, ambiguous, and unrelated results are excluded.',
  records,
}, null, 2) + '\n')

const clean = (value = '') => value.replace(/\s+/g, ' ').trim()
const nameOnly = audit.records.filter((record) => record.status === 'needs_review')
const reviewLines = [
  '# LinkedIn name-only review — 2 October 2026',
  '',
  `These ${nameOnly.length} people returned one or more LinkedIn profiles with the same name, but the search evidence did not connect the profile to the listed company. None of these links have been added to the directory.`,
  '',
  'Approve a link only after the profile itself or another reliable source confirms the company relationship.',
  '',
]
for (const [index, record] of nameOnly.entries()) {
  reviewLines.push(`## ${index + 1}. ${record.person_name} — ${record.company_name}`, '')
  if (record.title) reviewLines.push(`Directory title: ${record.title}`, '')
  for (const candidate of record.candidates.filter((item) => item.confidence === 'review')) {
    reviewLines.push(`- [${candidate.url}](${candidate.url}) — ${clean(candidate.title) || 'No search title'}`)
    if (candidate.description) reviewLines.push(`  - Search description: ${clean(candidate.description)}`)
  }
  reviewLines.push('')
}
writeFileSync(reviewPath, reviewLines.join('\n') + '\n')

console.log(JSON.stringify({ written: records.length, output: outputPath, nameOnlyReview: nameOnly.length, reviewOutput: reviewPath }, null, 2))
