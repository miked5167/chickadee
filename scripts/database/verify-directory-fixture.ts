import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { filterDirectory, type DirectoryListing } from '../../lib/tags/filter-logic'
import { parseFilterState, serializeFilterState } from '../../lib/tags/filter-state'
import type { TagCatalog } from '../../lib/tags/types'

async function main() {
  const fixture = JSON.parse(await readFile(process.argv[2], 'utf8')) as { catalog: TagCatalog; listings: DirectoryListing[] }
  const params = new URLSearchParams('tag=pathways:professional&tag=player_level:aaa')
  const state = parseFilterState(params, fixture.catalog)
  const result = filterDirectory(fixture.listings, state, fixture.catalog)
  assert.equal(result.pagination.total, 1)
  assert.equal(result.facets.tags['pathways:professional'], 1)
  assert.equal(filterDirectory(fixture.listings, { ...state, tags: ['pathways:ncaa'] }, fixture.catalog).pagination.total, 0)
  assert.deepEqual(parseFilterState(serializeFilterState(state), fixture.catalog), state)
  assert.equal(fixture.catalog.groups.find((group) => group.key === 'price_range')?.filter_enabled, false)
  console.log('Real persisted tag fixture passed filtering, facets, replacement and URL round-trip checks.')
}
main().catch((error) => { console.error(error.message); process.exitCode = 1 })
