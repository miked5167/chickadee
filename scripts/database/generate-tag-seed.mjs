import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { repositoryRoot } from './generate-schema-fingerprint.mjs'

const taxonomyPath = path.join(repositoryRoot, 'data/directory-tags.json')
const seedPath = path.join(repositoryRoot, 'supabase/seeds/directory-tags.sql')
const quote = (value) => value === null ? 'NULL' : `'${value.replaceAll("'", "''")}'`

export function generateTagSeed(taxonomy) {
  const groups = taxonomy.groups.map((group) => `  (${quote(group.key)}, ${quote(group.label)}, ${group.display_order}, ${group.is_core}, ${group.filter_enabled})`)
  const tags = taxonomy.tags.map((tag) => `  (${quote(tag.id)}, ${quote(tag.group_key)}, ${quote(tag.slug)}, ${quote(tag.label)}, ${quote(tag.parent_id)}, ${tag.display_order}, ${tag.is_active})`)
  return `-- Starter taxonomy only. Does not modify companies, claims or tag assignments.
-- Repeatable: existing tags and administrator decisions are preserved.
BEGIN;
INSERT INTO public.directory_tag_groups(key, label, display_order, is_core, filter_enabled) VALUES
${groups.join(',\n')}
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.directory_tags(id, group_key, slug, label, parent_id, display_order, is_active) VALUES
${tags.join(',\n')}
ON CONFLICT (id) DO NOTHING;
COMMIT;
`
}

async function main() {
  const generated = generateTagSeed(JSON.parse(await readFile(taxonomyPath, 'utf8')))
  if (process.argv.includes('--check')) {
    if (generated !== await readFile(seedPath, 'utf8')) throw new Error('Directory tag seed is out of date.')
    process.stdout.write('Directory tag seed matches the starter taxonomy.\n')
  } else {
    await writeFile(seedPath, generated, 'utf8')
    process.stdout.write('Generated directory tag seed; no database was contacted.\n')
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1 })
}
