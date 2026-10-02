// Read-only LinkedIn candidate discovery for public advisor names.
// Run with: node scripts/research/search-person-linkedin.mjs [--max=10]
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local', quiet: true })

const outputRoot = resolve('.firecrawl/linkedin-people-audit-20261002')
const searchRoot = join(outputRoot, 'search')
const researchRoot = resolve('.firecrawl/profile-enrichment-20260912/results')
mkdirSync(searchRoot, { recursive: true })

const normalize = (value = '') => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
const personKey = (slug, name) => `${slug}|${normalize(name)}`
const linkedinProfileUrl = (value) => {
  try {
    const url = new URL(value)
    if (!/^(?:www\.)?linkedin\.com$/i.test(url.hostname) || !['http:', 'https:'].includes(url.protocol)) return null
    const personal = url.pathname.match(/^\/(in)\/([a-z0-9%_-]+)\/?$/i)
    const legacy = url.pathname.match(/^\/pub\/[a-z0-9%_-]+\/[a-z0-9]+\/[a-z0-9]+\/[a-z0-9]+\/?$/i)
    if (personal) return `https://www.linkedin.com/in/${personal[2]}/`
    if (legacy) return `https://www.linkedin.com${url.pathname.replace(/\/$/, '')}/`
    return null
  } catch {
    return null
  }
}

function existingResearchLinks() {
  const links = new Map()
  if (!existsSync(researchRoot)) return links
  for (const file of readdirSync(researchRoot).filter((name) => name.endsWith('.json'))) {
    const record = JSON.parse(readFileSync(join(researchRoot, file), 'utf8'))
    for (const person of record.team || []) {
      const url = linkedinProfileUrl(person.linkedin_url)
      if (url) links.set(personKey(record.slug, person.name), url)
    }
  }
  return links
}

function runFirecrawl(query, output) {
  return new Promise((resolveSearch, rejectSearch) => {
    const cli = process.platform === 'win32'
      ? join(process.env.APPDATA, 'npm/node_modules/firecrawl-cli/dist/index.js')
      : 'firecrawl'
    const command = process.platform === 'win32' ? process.execPath : cli
    const args = process.platform === 'win32'
      ? [cli, 'search', query, '--limit', '8', '-o', output, '--json']
      : ['search', query, '--limit', '8', '-o', output, '--json']
    const child = spawn(command, args, {
      cwd: process.cwd(), windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'],
    })
    let errorText = ''
    child.stderr.on('data', (chunk) => { if (errorText.length < 4000) errorText += chunk.toString() })
    child.on('error', rejectSearch)
    child.on('close', (code) => code === 0 ? resolveSearch() : rejectSearch(new Error(`Firecrawl exited ${code}: ${errorText.trim()}`)))
  })
}

const wait = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds))

async function runFirecrawlWithBackoff(query, output) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      await runFirecrawl(query, output)
      await wait(1200)
      return
    } catch (error) {
      if (!/rate limit exceeded/i.test(error.message) || attempt === 5) throw error
      const seconds = Number(error.message.match(/retry after (\d+)s/i)?.[1] || 30)
      await wait(Math.min(55, seconds + 2) * 1000)
    }
  }
}

function assess(record, web = []) {
  const name = normalize(record.person_name)
  const company = normalize(record.company_name)
  const candidates = []
  for (const result of web) {
    const url = linkedinProfileUrl(result.url)
    if (!url) continue
    const title = normalize(result.title || '')
    const text = normalize(`${result.title || ''} ${result.description || ''}`)
    // The person's full name must appear in the result title. A name mentioned
    // only in somebody else's description is not evidence that the URL belongs to them.
    const nameMatch = Boolean(name && title.includes(name))
    const companyMatch = Boolean(company && text.includes(company))
    candidates.push({
      url,
      title: result.title || null,
      description: result.description || null,
      name_match: nameMatch,
      company_match: companyMatch,
      confidence: nameMatch && companyMatch ? 'high' : nameMatch ? 'review' : 'rejected',
    })
  }
  const unique = [...new Map(candidates.map((candidate) => [candidate.url, candidate])).values()]
  const high = unique.filter((candidate) => candidate.confidence === 'high')
  return {
    ...record,
    status: high.length === 1 ? 'high_confidence' : high.length > 1 ? 'ambiguous' : unique.some((candidate) => candidate.confidence === 'review') ? 'needs_review' : 'not_found',
    selected_url: high.length === 1 ? high[0].url : null,
    candidates: unique,
  }
}

const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
for (const name of required) if (!process.env[name]) throw new Error(`Missing ${name}`)

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const { data, error } = await supabase
  .from('advisors')
  .select('id,company_id,name,title,active,companies(name,slug,website_url)')
  .eq('active', true)
  .order('name')
if (error) throw error

const existing = existingResearchLinks()
const inventory = data
  .filter((advisor) => advisor.name?.trim() && advisor.companies?.slug)
  .map((advisor) => ({
    advisor_id: advisor.id,
    company_id: advisor.company_id,
    person_name: advisor.name.trim(),
    title: advisor.title || null,
    company_name: advisor.companies.name,
    company_slug: advisor.companies.slug,
    company_website: advisor.companies.website_url || null,
    existing_url: existing.get(personKey(advisor.companies.slug, advisor.name)) || null,
  }))

writeFileSync(join(outputRoot, 'inventory.json'), JSON.stringify(inventory, null, 2) + '\n')

const maxArg = process.argv.find((arg) => arg.startsWith('--max='))
const max = maxArg ? Number(maxArg.split('=')[1]) : Number.POSITIVE_INFINITY
const pending = inventory.filter((record) => !record.existing_url).slice(0, max)
let completed = 0
const failures = []

async function searchOne(record) {
  const file = join(searchRoot, `${record.company_slug}--${normalize(record.person_name)}.json`)
  const query = `"${record.person_name}" "${record.company_name}" LinkedIn hockey`
  try {
    if (!existsSync(file)) await runFirecrawlWithBackoff(query, file)
    const response = JSON.parse(readFileSync(file, 'utf8'))
    return assess({ ...record, query, search_file: file.replace(`${process.cwd()}\\`, '') }, response.data?.web || [])
  } catch (searchError) {
    failures.push({ company_slug: record.company_slug, person_name: record.person_name, error: searchError.message })
    return { ...record, query, search_file: file.replace(`${process.cwd()}\\`, ''), status: 'error', selected_url: null, candidates: [] }
  } finally {
    completed += 1
    if (completed % 10 === 0 || completed === pending.length) console.log(`Completed ${completed}/${pending.length}`)
  }
}

const searched = []
let cursor = 0
async function worker() {
  while (cursor < pending.length) {
    const index = cursor++
    searched[index] = await searchOne(pending[index])
  }
}
await worker()

const combined = [
  ...inventory.filter((record) => record.existing_url).map((record) => ({ ...record, status: 'existing', selected_url: record.existing_url, candidates: [] })),
  ...searched,
]
const summary = {
  total_people: inventory.length,
  existing: combined.filter((record) => record.status === 'existing').length,
  high_confidence: combined.filter((record) => record.status === 'high_confidence').length,
  needs_review: combined.filter((record) => record.status === 'needs_review').length,
  ambiguous: combined.filter((record) => record.status === 'ambiguous').length,
  not_found: combined.filter((record) => record.status === 'not_found').length,
  errors: failures.length,
  searched_this_run: searched.length,
}
writeFileSync(join(outputRoot, 'audit.json'), JSON.stringify({ generated_at: new Date().toISOString(), summary, records: combined, failures }, null, 2) + '\n')
console.log(JSON.stringify(summary, null, 2))
