import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'csv-parse/sync'

// Generates a reviewable, atomic SQL import; never connects to a database itself.
export function prepareEliteProspectsImport(csv, sourceFile = 'results-master.csv') {
  const hash = createHash('sha256').update(csv).digest('hex')
  const rows = parse(csv, { columns: true, skip_empty_lines: true, bom: true, trim: true })
  if (!rows.length) throw new Error('CSV has no rows')
  const slugs = new Set()
  const agencies = new Set()
  const records = rows.map(row => {
    const directory = new URL(row.directory_url)
    if (directory.protocol !== 'https:' || directory.hostname !== 'www.thehockeydirectory.com'
      || !/^\/listings\/[a-z0-9-]+$/.test(directory.pathname)) throw new Error(`Invalid directory URL: ${row.directory_url}`)
    const slug = directory.pathname.split('/').pop()
    if (slugs.has(slug)) throw new Error(`Duplicate company: ${slug}`)
    slugs.add(slug)
    if (!row.directory_name?.trim() || typeof row.notes !== 'string') throw new Error(`Missing company or notes: ${slug}`)
    if (!['exact', 'likely', 'none', 'ambiguous'].includes(row.match_status)) throw new Error(`Invalid match status: ${slug}`)
    const matched = ['exact', 'likely'].includes(row.match_status)
    let count = null
    if (matched) {
      if (!/^\d+$/.test(row.client_count) || !Number.isSafeInteger(Number(row.client_count)) || Number(row.client_count) > 2147483647) throw new Error(`Invalid count: ${slug}`)
      count = Number(row.client_count)
      if (!row.ep_name?.trim() || !/^https:\/\/www\.eliteprospects\.com\/agent-portal\/\d+\/[^\s]+$/.test(row.ep_url)) throw new Error(`Missing or invalid EP source: ${slug}`)
      const agencyId = row.ep_url.match(/agent-portal\/(\d+)\//)[1]
      if (agencies.has(agencyId)) throw new Error(`Duplicate EP agency: ${agencyId}`)
      agencies.add(agencyId)
    } else if (row.client_count !== '' || row.ep_url !== '' || row.ep_name !== '') {
      throw new Error(`Unresolved match has a count or source: ${slug}`)
    }
    return { slug, directory_name: row.directory_name, match_status: row.match_status,
      agency_name: row.ep_name || null, source_url: row.ep_url || null, client_count: count,
      match_notes: row.notes, source_file: basename(sourceFile), source_sha256: hash }
  })
  // Standard SQL literals (including names containing apostrophes) with explicit string mode.
  const literal = value => value === null ? 'NULL' : typeof value === 'number' ? String(value) : `'${value.replaceAll("'", "''")}'`
  const columns = Object.keys(records[0])
  const values = records.map(row => `(${columns.map(key => literal(row[key])).join(', ')})`).join(',\n')
  const sql = `BEGIN;
SET LOCAL standard_conforming_strings = on;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
CREATE TEMP TABLE ep_import (slug text PRIMARY KEY, directory_name text, match_status text, agency_name text, source_url text, client_count integer, match_notes text, source_file text, source_sha256 text) ON COMMIT DROP;
INSERT INTO ep_import (${columns.join(', ')}) VALUES\n${values};
DO $guard$
BEGIN
  IF EXISTS (SELECT 1 FROM ep_import i LEFT JOIN public.companies c ON c.slug = i.slug WHERE c.id IS NULL OR c.name <> i.directory_name) THEN
    RAISE EXCEPTION 'Import aborted: a company slug/name does not match the database';
  END IF;
END $guard$;
INSERT INTO public.company_elite_prospects (company_id, match_status, agency_name, source_url, client_count, match_notes, source_file, source_sha256, source_observed_at)
SELECT c.id, i.match_status, i.agency_name, i.source_url, i.client_count, i.match_notes, i.source_file, i.source_sha256, NULL
FROM ep_import i JOIN public.companies c ON c.slug = i.slug
ON CONFLICT (company_id) DO UPDATE SET
  match_status = EXCLUDED.match_status, agency_name = EXCLUDED.agency_name,
  source_url = EXCLUDED.source_url, client_count = EXCLUDED.client_count,
  match_notes = EXCLUDED.match_notes, source_file = EXCLUDED.source_file,
  source_sha256 = EXCLUDED.source_sha256, source_observed_at = EXCLUDED.source_observed_at,
  imported_at = now()
WHERE company_elite_prospects.source_sha256 <> EXCLUDED.source_sha256;
DO $verify$
BEGIN
  IF (SELECT count(*) FROM ep_import i JOIN public.companies c ON c.slug = i.slug JOIN public.company_elite_prospects e ON e.company_id = c.id
      WHERE e.source_sha256 = i.source_sha256 AND e.match_status = i.match_status AND e.client_count IS NOT DISTINCT FROM i.client_count AND e.source_url IS NOT DISTINCT FROM i.source_url) <> ${records.length} THEN
    RAISE EXCEPTION 'Import verification failed';
  END IF;
END $verify$;
COMMIT;
`
  return { records, sql, summary: { source_sha256: hash, rows: records.length,
    statuses: Object.fromEntries(['exact', 'likely', 'none', 'ambiguous'].map(status => [status, records.filter(r => r.match_status === status).length])),
    with_counts: records.filter(r => r.client_count !== null).length,
    zero_counts: records.filter(r => r.client_count === 0).length,
    total_clients: records.reduce((sum, r) => sum + (r.client_count ?? 0), 0),
    source_observed_at: null } }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [input, output] = process.argv.slice(2)
  if (!input || !output) throw new Error('Usage: node scripts/research/import-elite-prospects-counts.mjs input.csv output.sql')
  const prepared = prepareEliteProspectsImport(readFileSync(input, 'utf8'), input)
  mkdirSync(dirname(resolve(output)), { recursive: true })
  writeFileSync(output, prepared.sql)
  writeFileSync(`${output}.json`, JSON.stringify(prepared, null, 2))
  console.log(JSON.stringify(prepared.summary, null, 2))
}
