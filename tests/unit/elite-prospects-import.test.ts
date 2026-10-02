import { describe, expect, it } from 'vitest'
import { prepareEliteProspectsImport } from '../../scripts/research/import-elite-prospects-counts.mjs'

const header = 'directory_name,directory_url,match_status,ep_name,ep_url,client_count,notes\n'
const matched = "O'Brien Hockey,https://www.thehockeydirectory.com/listings/obrien-hockey,exact,O'Brien Hockey,https://www.eliteprospects.com/agent-portal/123/obrien-hockey,0,Exact match"
const unresolved = 'Unknown Hockey,https://www.thehockeydirectory.com/listings/unknown-hockey,none,,,,No match'

describe('Elite Prospects CSV import', () => {
  it('preserves zero versus missing counts and escapes SQL names', () => {
    const result = prepareEliteProspectsImport(header + matched + '\n' + unresolved)
    expect(result.records.map(row => row.client_count)).toEqual([0, null])
    expect(result.sql).toContain("O''Brien Hockey")
    expect(result.summary.with_counts).toBe(1)
    expect(result.summary.source_observed_at).toBeNull()
  })
  it.each(['', '-1', '1.5', 'NaN', '2147483648'])('rejects invalid matched counts: %s', count => {
    expect(() => prepareEliteProspectsImport(header + matched.replace(',0,', `,${count},`))).toThrow('Invalid count')
  })
  it('rejects duplicate company mappings', () => {
    expect(() => prepareEliteProspectsImport(header + matched + '\n' + matched)).toThrow('Duplicate company')
  })
  it('rejects unrelated sources and unresolved numeric counts', () => {
    expect(() => prepareEliteProspectsImport(header + matched.replace('www.eliteprospects.com', 'unrelated.com'))).toThrow('EP source')
    expect(() => prepareEliteProspectsImport(header + unresolved.replace('none,,,,', 'none,,,0,'))).toThrow('Unresolved match')
  })
})
