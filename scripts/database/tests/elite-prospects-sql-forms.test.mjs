import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { buildFingerprint } from '../generate-schema-fingerprint.mjs'
import { normalizeEliteProspectsCheck } from '../elite-prospects-sql-forms.mjs'

test('recognizes only the reviewed PostgreSQL rendering of the count check', () => {
  const dumped = 'CHECK (((client_count IS NULL) OR (client_count >= 0)))'
  assert.equal(normalizeEliteProspectsCheck('company_elite_prospects', dumped), 'CHECK (client_count IS NULL OR client_count >= 0)')
  assert.equal(normalizeEliteProspectsCheck('another_table', dumped), dumped)
  const changed = dumped.replace('>= 0', '>= -1')
  assert.equal(normalizeEliteProspectsCheck('company_elite_prospects', changed), changed)
})
test('keeps baseline evidence unchanged and detects changes to the source allowlist', async () => {
  const sql = await readFile(new URL('../../../supabase/migrations/20260913004623_company_elite_prospects.sql', import.meta.url), 'utf8')
  const original = buildFingerprint(sql)
  assert.notDeepEqual(buildFingerprint(sql.replace('client_count >= 0', 'client_count >= -1')), original)
  assert.notDeepEqual(buildFingerprint(sql.replace('https://www[.]eliteprospects', 'https://another[.]eliteprospects')), original)
  const a = "CHECK ((source_sha256 ~ '^[a-f0-9]{64}$'::text))"
  assert.equal(normalizeEliteProspectsCheck('company_elite_prospects', a.replace('{64}', '{1}')), a.replace('{64}', '{1}'))
})
