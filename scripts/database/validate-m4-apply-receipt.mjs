import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, realpath } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const migrationHashes = {
  '20260719000000_production_company_baseline.sql': '4b65fa234b56534985f249cc8061efd98b05ba927c5de130839b8fd35c1d1db8',
  '20260719000001_add_companies_updated_at_trigger.sql': '95fb374bb07c5a4941b3dd78e6a6db9bf5b4b456c15670fb3ac9805e3a81b547',
  '20260719000002_administrator_authorization_foundation.sql': 'a968f41fb10e6ecbe1ff8363abe0322031defd6aa361ce3c98498603ade55f6d',
  '20260719000003_company_reviews.sql': '05bbef023d1b74e5707d801554e2839248d9a976f71fea41155167b69f8f69f7',
}
const m4 = '20260719000003_company_reviews.sql'
const hash = (data) => createHash('sha256').update(data).digest('hex')

// This validates an interrupted verification receipt, never certifies the database
// or edits the failed evidence. The caller must still perform full live verification.
export async function validateM4ApplyReceipt(directory) {
  const root = await realpath(directory)
  const manifest = (await readFile(path.join(root, 'SHA256SUMS.txt'), 'utf8')).replace(/^\uFEFF/, '')
  const verified = new Map()
  for (const line of manifest.split(/\r?\n/).filter((item) => item.trim())) {
    const match = line.match(/^([a-f0-9]{64}) \*(.+)$/i)
    assert(match, 'Invalid receipt checksum entry')
    const relative = match[2].replaceAll('\\', '/')
    assert(!relative.includes(':') && !relative.startsWith('/') && !relative.split('/').includes('..'), 'Unsafe receipt path')
    assert(!verified.has(relative), 'Duplicate receipt checksum entry')
    const absolute = await realpath(path.join(root, relative))
    const resolvedRelative = path.relative(root, absolute)
    assert(resolvedRelative && !path.isAbsolute(resolvedRelative) && !resolvedRelative.split(path.sep).includes('..'), 'Receipt path escapes evidence directory')
    const content = await readFile(absolute)
    assert.equal(hash(content), match[1].toLowerCase(), `Receipt checksum mismatch: ${relative}`)
    verified.set(relative, content)
  }
  const text = (name) => {
    assert(verified.has(name), `Receipt missing checksummed ${name}`)
    return verified.get(name).toString('utf8').replace(/^\uFEFF/, '')
  }
  const status = JSON.parse(text('status.json'))
  assert(status.success === false && status.status === 'failed' && status.production_changes_made === true &&
    status.baseline_ddl_executed === false && status.first_admin_created === false && status.review_rows_created === 0 &&
    status.error === 'Read-only production verification query failed.', 'Not the recoverable M4 post-query failure')
  for (const [filename, expectedHash] of Object.entries(migrationHashes)) {
    const name = `m4-cli-work/supabase/migrations/${filename}`
    assert(verified.has(name), `Receipt missing migration ${filename}`)
    assert.equal(hash(verified.get(name)), expectedHash, `Unexpected migration contents: ${filename}`)
  }
  const dryRun = text('supabase-dry-run.txt')
  assert.deepEqual([...new Set(dryRun.match(/\b\d{14}_[a-z0-9_]+\.sql\b/g))], [m4], 'Receipt dry run is not M4 only')
  const apply = text('supabase-apply.txt')
  const applied = [...apply.matchAll(/Applying migration (\d{14}_[a-z0-9_]+\.sql)/g)].map((match) => match[1])
  assert.deepEqual(applied, [m4], 'Receipt application is not M4 only')
  assert(apply.indexOf('Finished supabase db push.') > apply.indexOf(`Applying migration ${m4}`), 'Receipt does not record completed application')
  return { checksums: verified.size, migration: m4, fullVerificationRequired: true }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assert(process.argv[2], 'An apply evidence directory is required')
    const result = await validateM4ApplyReceipt(process.argv[2])
    console.log(`M4 apply receipt validated (${result.checksums} checksums). Full read-only database verification is still required.`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
