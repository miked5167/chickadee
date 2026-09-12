import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { migrations, reviewedSql, validateHistory, validateDryRun } from '../m5-m7-release.mjs'
const history = (stage) => migrations.slice(0, stage).map(([name]) => ({ version: name.slice(0, 14), name: name.slice(15, -4) }))
test('all seven migration hashes are immutable and reviewed', async () => assert.equal((await reviewedSql()).length, 7))
for (const stage of [4, 5, 6, 7]) test(`recognizes exact M${stage} and only its remaining migrations`, () => {
  assert.equal(validateHistory(history(stage)), stage)
  validateDryRun(migrations.slice(stage).map(([name]) => name).join('\n'), stage)
})
test('rejects wrong, missing, out-of-order and extra migration history', () => {
  for (const rows of [history(3), [...history(7), { version: 'unknown', name: 'unknown' }], history(4).reverse(),
    history(4).map((item, i) => i === 1 ? { ...item, name: 'unexpected' } : item)]) assert.throws(() => validateHistory(rows))
})
test('dry run cannot reapply M4 or omit any remaining migration', () => {
  assert.throws(() => validateDryRun(migrations.slice(3).map(([name]) => name).join('\n'), 4))
  assert.throws(() => validateDryRun(migrations[4][0], 4))
  assert.throws(() => validateDryRun('', 3))
})
test('production wrapper defaults to read-only and needs explicit apply approval', async () => {
  const wrapper = await readFile(new URL('../run-m5-m7-production.ps1', import.meta.url), 'utf8')
  assert(wrapper.includes("[string]$Mode = 'Preflight'"))
  assert(wrapper.includes("$ApprovalPhrase -ne 'APPROVE M5 M6 M7 PRODUCTION MIGRATIONS'"))
  assert(wrapper.includes('-AsSecureString'))
  assert(wrapper.includes('ZeroFreeBSTR'))
  assert(wrapper.includes('Remove-Item Env:PGPASSWORD'))
})
test('production entry is pinned and keeps uncertain mutation state on failure', async () => {
  const script = await readFile(new URL('../m5-m7-release.mjs', import.meta.url), 'utf8')
  assert(script.includes("const host = 'aws-1-ca-central-1.pooler.supabase.com'"))
  assert(script.includes("database: 'postgres'"))
  assert(script.includes("productionChanges: applyAttempted ? 'unknown-check-live-history' : false"))
  for (const prohibited of ['--include-all', '--include-seed', '--include-roles', 'migration repair', 'INSERT INTO public.admin_users']) assert(!script.includes(prohibited))
})
