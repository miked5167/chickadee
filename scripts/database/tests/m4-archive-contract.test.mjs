import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { isM4ArchiveCountFailure, m4ArchiveAdditions, m4ArchiveEntryCount, validateM4ArchiveEntries } from '../m4-archive-contract.mjs'

const archive = () => ['; PostgreSQL archive', ...Array.from({ length: 1337 }, (_, i) => `${i}; 0 0 TABLE public baseline_${i} postgres`),
  ...m4ArchiveAdditions.map((item, i) => `${1337 + i}; 0 0 ${item}`)]
const status = { success: false, status: 'failed', production_changes_made: true, verification_only: true,
  apply_reinvoked: false, baseline_ddl_executed: false, first_admin_created: false, review_rows_created: 0,
  error: 'Post-M4 archive has 1361 entries instead of exact target count 1356.' }

test('M4 is exactly M3 plus all 24 reviews objects', () => {
  assert.equal(m4ArchiveAdditions.length, 24)
  assert.equal(m4ArchiveEntryCount, 1337 + m4ArchiveAdditions.length)
  validateM4ArchiveEntries(archive())
})
test('rejects the old 1356-entry total', () => {
  assert.throws(() => validateM4ArchiveEntries(archive().slice(0, -5)), /entry count/)
})
test('rejects substituted permission entries even when the total matches', () => {
  const lines = archive().map((line) => line.replace('ACL public COLUMN reviews.reviewer_user_id postgres', 'ACL public COLUMN reviews.secret postgres'))
  assert.throws(() => validateM4ArchiveEntries(lines), /review objects differ/)
})
test('rejects an unrelated addition substituted for a reviews object', () => {
  const lines = archive()
  lines[lines.length - 1] = '9999; 0 0 TABLE public unexpected postgres'
  assert.throws(() => validateM4ArchiveEntries(lines), /review objects differ/)
})
test('recovery is limited to the exact known archive-count failure', () => {
  assert(isM4ArchiveCountFailure(status))
  for (const [field, value] of Object.entries({ success: true, status: 'success', production_changes_made: false,
    verification_only: false, apply_reinvoked: true, baseline_ddl_executed: true, first_admin_created: true,
    review_rows_created: 1, error: 'Some other failure' })) {
    assert.equal(isM4ArchiveCountFailure({ ...status, [field]: value }), false, field)
  }
})
test('PowerShell wrappers retain an exact corrected archive-count guard', async () => {
  for (const name of ['run-m4-production-apply.ps1', 'run-m4-production-post-verification.ps1']) {
    const script = await readFile(new URL(`../${name}`, import.meta.url), 'utf8')
    assert(script.includes('$ArchiveEntries -ne 1361'))
    assert(!script.includes('$ArchiveEntries -ne 1356'))
  }
})
