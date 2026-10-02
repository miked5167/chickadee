// Local editorial helpers only. No network requests or paid model calls.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
const root = resolve(import.meta.dirname, '../..')
const base = join(root, '.firecrawl/profile-enrichment-20260912')
const work = join(root, '.firecrawl/overview-editorial-20260913')
mkdirSync(work, { recursive: true })
const records = JSON.parse(readFileSync(join(base, 'inputs.json'), 'utf8'))
const clean = text => String(text).replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_#\\]/g, '').replace(/\s+/g, ' ').trim()
const mode = process.argv[2]
if (mode === 'read') {
  const start = Number(process.argv[3] || 0), count = Number(process.argv[4] || 10)
  records.slice(start, start + count).forEach((r, i) => {
    console.log(`\n[${start+i}] ${r.slug} | ${r.name} | ${r.website_url}`)
    const seen = new Set()
    const pages = r.pages.map((p, index) => ({ ...p, index })).sort((a,b) => {
      const score = p => /about|who-we|our-story|mission/i.test(p.url) ? 3 : /services|what-we-do/i.test(p.url) ? 2 : p.index === 0 ? 1 : 0
      return score(b)-score(a)
    })
    let remaining = Number(process.argv[5] || 4700)
    for (const page of pages) {
      const lines = page.text.split(/\n+/).map(clean).filter(line => line.length > 70 && !/^https?:|^©|copyright|cookie|all rights reserved|privacy policy|captcha/i.test(line))
        .filter(line => { if (seen.has(line)) return false; seen.add(line); return true })
      const text = lines.join('\n').slice(0, Math.min(remaining, 3100))
      if (text.length < 50) continue
      console.log(`SOURCE ${page.index} ${page.url}\n${text}`)
      remaining -= text.length
      if (remaining < 150) break
    }
    if (!r.pages.length) console.log('NO CACHED SOURCE')
  })
}
if (mode === 'write') {
  const batch = JSON.parse(readFileSync(process.argv[3], 'utf8'))
  for (const draft of batch) {
    const r = records.find(r => r.slug === draft.slug)
    if (!r) throw new Error(`Unknown company: ${draft.slug}`)
    if (draft.issue) {
      writeFileSync(join(work, `${r.slug}.issue.json`), JSON.stringify({ slug: r.slug, name: r.name, issue: draft.issue, website_url: r.website_url }, null, 2))
      continue
    }
    const overview = draft.overview.map(({p,q,t}) => {
      const page = r.pages[p]
      if (!page || q.length < 8 || !clean(page.text).toLowerCase().includes(clean(q).toLowerCase())) throw new Error(`Evidence does not match: ${r.slug}: ${q}`)
      return { text: t, quote: q, source_url: page.url }
    })
    if (!overview.length) throw new Error(`Empty overview: ${r.slug}`)
    const words = overview.map(f=>f.text).join(' ').split(/\s+/).length
    if (words > 350) throw new Error(`Overview too long: ${r.slug}`)
    const output = { company_id: r.id, slug: r.slug, name: r.name, website_url: r.website_url,
      status: 'draft', overview, services: [], team: [], pricing: [],
      sources: r.pages.map(({url,captured_at})=>({url,captured_at})),
      editorial_method: 'Written in Codex from cached official website material; no paid model API',
      editorial_date: '2026-09-13', word_count: words }
    mkdirSync(join(base, 'results'), {recursive: true})
    writeFileSync(join(base, 'results', `${r.slug}.json`), JSON.stringify(output, null, 2)+'\n')
    console.log(`${r.slug}: ${words} words`)
  }
}
if (mode === 'status') {
  const files = readdirSync(join(base,'results')).filter(f=>f.endsWith('.json'))
  const issues = readdirSync(work).filter(f=>f.endsWith('.issue.json') && !files.includes(f.replace('.issue.json', '.json')))
  console.log(JSON.stringify({ total: records.length, drafted: files.length, flagged: issues.length,
    remaining: records.filter(r=>!files.includes(`${r.slug}.json`)&&!issues.includes(`${r.slug}.issue.json`)).map(r=>r.slug) }, null, 2))
}
