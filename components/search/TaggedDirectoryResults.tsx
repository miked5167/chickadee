'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Grid2X2, Map, X } from 'lucide-react'
import { AdvisorCard } from '@/components/listing/AdvisorCard'
import { DirectoryMap } from './DirectoryMap'
import type { DirectorySearchResult } from '@/lib/tags/directory-search'
import { activeFilterChips, clearFilters, filterHref, serializeFilterState } from '@/lib/tags/filter-state'

export function TaggedDirectoryResults({ data }: { data: DirectorySearchResult }) {
  const [view, setView] = useState<'grid' | 'map'>('grid')
  const { advisors, state, catalog, pagination } = data
  const chips = activeFilterChips(state, catalog)
  return <section aria-label="Directory results" className="min-w-0">
    <form action="/listings" method="get" className="mb-5">
      {Array.from(serializeFilterState({ ...state, page: 1 })).filter(([key]) => key !== 'search').map(([key, value], index) => <input type="hidden" key={`${key}-${index}`} name={key} value={value} />)}
      <label htmlFor="tagged-directory-search" className="mb-2 block text-sm font-bold text-arena-navy">Company name or keyword</label>
      <div className="flex gap-2"><input id="tagged-directory-search" name="search" type="search" defaultValue={state.search} placeholder="Search by name or keyword" className="min-h-12 min-w-0 flex-1 rounded-lg border border-frost bg-white px-3" /><button type="submit" className="min-h-12 rounded-lg bg-hockey-blue px-4 font-bold text-white">Search</button></div>
    </form>
    {chips.length > 0 && <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => <Link key={chip.key} href={filterHref(chip.state)} aria-label={`Remove ${chip.label} filter`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-frost bg-ice-blue px-3 text-sm font-semibold text-board-blue">{chip.label}<X size={16} aria-hidden="true" /></Link>)}
      <Link href={filterHref(clearFilters(state))} className="inline-flex min-h-11 items-center px-3 text-sm font-bold text-hockey-blue underline underline-offset-2">Clear all filters</Link>
    </div>}
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <p role="status" className="font-medium text-neutral-gray">Found <strong className="text-arena-navy">{pagination.total}</strong> {pagination.total === 1 ? 'advisor' : 'advisors'}</p>
      <div aria-label="Results view" className="flex gap-1 rounded-lg border border-frost bg-white p-1">{(['grid', 'map'] as const).map((mode) => <button key={mode} type="button" aria-pressed={view === mode} onClick={() => setView(mode)} className={`flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-bold ${view === mode ? 'bg-ice-blue text-hockey-blue' : 'text-neutral-gray'}`}>{mode === 'grid' ? <Grid2X2 size={16} aria-hidden="true" /> : <Map size={16} aria-hidden="true" />}{mode === 'grid' ? 'Grid' : 'Map'}</button>)}</div>
    </div>
    {!catalog.tags.some((tag) => (data.facets.tags[tag.id] || 0) > 0) && !state.tags.length && <p className="mb-5 rounded-lg border border-frost bg-white p-4 text-sm leading-6 text-neutral-gray">Tag filters will become available as advisors complete their profiles and existing listings receive reviewed tags. Office location and Elite Prospects sorting are available now.</p>}
    {pagination.total === 0 ? <div className="rounded-xl border border-frost bg-white p-8 text-center"><h2 className="text-xl font-bold text-arena-navy">No advisors match these filters</h2><p className="mt-2 text-neutral-gray">Remove a filter or clear all to broaden your search.</p><Link href={filterHref(clearFilters(state))} className="mt-4 inline-flex min-h-12 items-center rounded-lg bg-hockey-blue px-5 font-bold text-white">Clear all filters</Link></div> : view === 'map' ? <DirectoryMap advisors={advisors} /> : <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{advisors.map((advisor) => <AdvisorCard key={advisor.id} advisor={advisor} showDistance={advisor.distance !== null} distance={advisor.distance ?? undefined} />)}</div>}
    {pagination.totalPages > 1 && <nav aria-label="Results pagination" className="mt-8 flex flex-wrap items-center justify-center gap-3">
      {pagination.hasPrevious ? <Link href={filterHref({ ...state, page: pagination.page - 1 })} rel="prev" className="inline-flex min-h-11 items-center rounded-md border border-frost bg-white px-4 font-semibold">Previous</Link> : <span aria-disabled="true" className="px-4 text-neutral-gray">Previous</span>}
      <span aria-current="page">Page {pagination.page} of {pagination.totalPages}</span>
      {pagination.hasMore ? <Link href={filterHref({ ...state, page: pagination.page + 1 })} rel="next" className="inline-flex min-h-11 items-center rounded-md border border-frost bg-white px-4 font-semibold">Next</Link> : <span aria-disabled="true" className="px-4 text-neutral-gray">Next</span>}
    </nav>}
  </section>
}
