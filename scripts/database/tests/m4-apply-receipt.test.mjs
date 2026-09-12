import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { validateM4ApplyReceipt } from '../validate-m4-apply-receipt.mjs'

const repository = fileURLToPath(new URL('../../../', import.meta.url))
const m4 = '20260719000003_company_reviews.sql'
const names = ['20260719000000_production_company_baseline.sql', '20260719000001_add_companies_updated_at_trigger.sql',
  '20260719000002_administrator_authorization_foundation.sql', m4]
const failedStatus = { success: false, status: 'failed', production_changes_made: true, baseline_ddl_executed: false,
  first_admin_created: false, review_rows_created: 0, error: 'Read-only production verification query failed.' }

async function fixture(t, alter = () => {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'hockey-m4-receipt-test-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const files = new Map([
    ['status.json', JSON.stringify(failedStatus)],
    ['supabase-dry-run.txt', `Would apply ${m4}`],
    ['supabase-apply.txt', `Applying migration ${m4}...\nFinished supabase db push.`],
  ])
  for (const name of names) files.set(`m4-cli-work/supabase/migrations/${name}`, await readFile(path.join(repository, 'supabase/migrations', name)))
  alter(files)
  const manifest = []
  for (const [name, content] of files) {
    await mkdir(path.dirname(path.join(directory, name)), { recursive: true })
    await writeFile(path.join(directory, name), content)
    manifest.push(`${createHash('sha256').update(content).digest('hex')} *${name.replaceAll('/', '\\')}`)
  }
  await writeFile(path.join(directory, 'SHA256SUMS.txt'), manifest.join('\r\n'))
  return directory
}

test('accepts the exact interrupted receipt without claiming full verification', async (t) => {
  const directory = await fixture(t)
  assert.deepEqual(await validateM4ApplyReceipt(directory), { checksums: 7, migration: m4, fullVerificationRequired: true })
})

test('rejects tampering against the original checksum', async (t) => {
  const directory = await fixture(t)
  await writeFile(path.join(directory, 'supabase-apply.txt'), 'tampered')
  await assert.rejects(validateM4ApplyReceipt(directory), /checksum mismatch/)
})

for (const [label, alter, expected] of [
  ['unrelated failure', (files) => files.set('status.json', JSON.stringify({ ...failedStatus, error: 'Application failed.' })), /recoverable/],
  ['no application', (files) => files.set('status.json', JSON.stringify({ ...failedStatus, production_changes_made: false })), /recoverable/],
  ['missing status checksum', (files) => files.delete('status.json'), /missing checksummed/],
  ['changed migration with a new checksum', (files) => files.set(`m4-cli-work/supabase/migrations/${m4}`, '-- changed'), /Unexpected migration/],
  ['extra dry-run migration', (files) => files.set('supabase-dry-run.txt', `${m4}\n20260821000000_company_profiles.sql`), /M4 only/],
  ['extra applied migration', (files) => files.set('supabase-apply.txt', `Applying migration ${m4}\nApplying migration 20260821000000_company_profiles.sql\nFinished supabase db push.`), /M4 only/],
  ['unfinished application', (files) => files.set('supabase-apply.txt', `Applying migration ${m4}...`), /completed application/],
]) {
  test(`rejects ${label}`, async (t) => {
    await assert.rejects(validateM4ApplyReceipt(await fixture(t, alter)), expected)
  })
}

test('rejects traversal in a checksum path', async (t) => {
  const directory = await fixture(t)
  await writeFile(path.join(directory, 'SHA256SUMS.txt'), `${'0'.repeat(64)} *../outside`)
  await assert.rejects(validateM4ApplyReceipt(directory), /Unsafe receipt path/)
})

test('both verification queries cast information-schema domains before aggregation', async () => {
  for (const name of ['run-m4-production-apply.ps1', 'run-m4-production-post-verification.ps1']) {
    const script = await readFile(path.join(repository, 'scripts/database', name), 'utf8')
    assert(script.includes('array_agg(privilege_type::text ORDER BY privilege_type)'))
    assert(!script.includes('array_agg(privilege_type ORDER BY privilege_type)'))
  }
  const recovery = await readFile(path.join(repository, 'scripts/database/run-m4-production-post-verification.ps1'), 'utf8')
  assert(recovery.includes('[switch]$RecoverIncompleteVerification'))
  assert(recovery.includes('validate-m4-apply-receipt.mjs'))
  assert(recovery.includes('validate-production-evidence.mjs $PostDirectory --target m4'))
  assert(!recovery.includes("'db','push'"))
})
