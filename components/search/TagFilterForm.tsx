'use client'

import { useId } from 'react'
import type { TagCatalog } from '@/lib/tags/types'
import type { DirectoryFacets } from '@/lib/tags/filter-logic'
import { serializeFilterState, SORT_OPTIONS, type FilterState } from '@/lib/tags/filter-state'
import { Button } from '@/components/ui/button'

export function TagFilterForm({ catalog, state, facets, count, pending = false, countError = false, onChange, onApply, basePath = '/listings', showApply = true }: { catalog: TagCatalog; state: FilterState; facets: DirectoryFacets; count: number; pending?: boolean; countError?: boolean; onChange?: (state: FilterState) => void; onApply?: () => void; basePath?: string; showApply?: boolean }) {
  const prefix = useId()
  const params = serializeFilterState({ ...state, page: 1 })
  const editedKeys = ['tag', 'country', 'sort', 'verified', 'remote', 'accepting', 'page', 'radius']
  return <form action={basePath} method="get" onSubmit={onApply ? (event) => { event.preventDefault(); onApply() } : undefined} className="space-y-4">
    {Array.from(params).filter(([key]) => !editedKeys.includes(key)).map(([key, value], index) => <input key={`${key}-${index}`} type="hidden" name={key} value={value} />)}
    <input type="hidden" name="page" value="1" />
    <div className="rounded-xl border border-frost bg-white p-4">
      <label htmlFor={`${prefix}-sort`} className="mb-2 block font-bold text-arena-navy">Sort by</label>
      <select id={`${prefix}-sort`} name="sort" value={state.sort} onChange={(event) => onChange?.({ ...state, sort: event.target.value as FilterState['sort'], page: 1 })} className="min-h-11 w-full rounded-md border border-frost bg-white px-2 text-sm">{SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
    </div>
    <fieldset className="rounded-xl border border-frost bg-white p-4">
      <legend className="px-2 font-bold text-arena-navy">Office location</legend>
      {[['', 'Any country'], ['CA', 'Canada'], ['US', 'United States']].map(([value, label]) => <label key={value} className="flex min-h-11 items-center gap-3 text-sm">
        <input type="radio" name="country" value={value} checked={state.country === value} disabled={Boolean(value && (facets.countries[value] || 0) === 0 && state.country !== value)} onChange={() => onChange?.({ ...state, country: value, page: 1 })} className="h-5 w-5 accent-hockey-blue" />
        <span>{label}{value && ` (${facets.countries[value] || 0})`}</span>
      </label>)}
      <p className="mt-2 text-xs text-neutral-gray">Use Regions served below for client coverage.</p>
    </fieldset>
    {catalog.groups.filter((group) => group.filter_enabled).map((group) => {
      const options = catalog.tags.filter((tag) => tag.is_active && tag.group_key === group.key && (group.key !== 'regions' || !tag.parent_id || (facets.tags[tag.id] || 0) > 0 || state.tags.includes(tag.id)))
      return <fieldset key={group.key} className="rounded-xl border border-frost bg-white p-4">
        <legend className="px-2 font-bold text-arena-navy">{group.label}</legend>
        {options.map((tag) => {
          const checked = state.tags.includes(tag.id)
          const count = facets.tags[tag.id] || 0
          return <label key={tag.id} htmlFor={`${prefix}-${tag.id}`} className={`flex min-h-11 items-center gap-3 text-sm ${count === 0 && !checked ? 'text-neutral-gray' : 'cursor-pointer text-arena-navy'} ${tag.parent_id ? 'pl-4' : ''}`}>
            <input id={`${prefix}-${tag.id}`} type="checkbox" name="tag" value={tag.id} checked={checked} disabled={count === 0 && !checked} onChange={() => onChange?.({ ...state, tags: checked ? state.tags.filter((id) => id !== tag.id) : [...state.tags, tag.id], page: 1 })} className="h-5 w-5 shrink-0 accent-hockey-blue" />
            <span>{tag.label} ({count})</span>
          </label>
        })}
        {!options.length && <p className="text-sm text-neutral-gray">No options match the current filters.</p>}
      </fieldset>
    })}
    {state.lat !== null && state.lng !== null && <div className="rounded-xl border border-frost bg-white p-4"><label htmlFor={`${prefix}-radius`} className="mb-2 block font-bold">Distance</label><select id={`${prefix}-radius`} name="radius" value={state.radius} onChange={(event) => onChange?.({ ...state, radius: Number(event.target.value), page: 1 })} className="min-h-11 w-full rounded-md border border-frost bg-white px-2">{Array.from(new Set([25, 50, 100, 250, state.radius])).sort((a, b) => a - b).map((radius) => <option key={radius} value={radius}>Within {radius} miles</option>)}</select></div>}
    <fieldset className="rounded-xl border border-frost bg-white p-4">
      <legend className="px-2 font-bold text-arena-navy">Availability and verification</legend>
      {([['accepting', 'Accepting new clients'], ['remote', 'Remote available'], ['verified', 'Business connection verified']] as const).map(([key, label]) => <label key={key} className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" name={key} value="true" checked={state[key]} disabled={!state[key] && facets.flags[key] === 0} onChange={(event) => onChange?.({ ...state, [key]: event.target.checked, page: 1 })} className="h-5 w-5 accent-hockey-blue" /><span>{label} ({facets.flags[key]})</span>
      </label>)}
      <p className="mt-2 text-xs leading-5 text-neutral-gray">Business verification confirms a connection to the listing; it is not an endorsement.</p>
    </fieldset>
    {showApply && <div className="sticky bottom-0 border-t border-frost bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <Button type="submit" disabled={pending || countError} className="min-h-12 w-full" aria-live="polite">{countError ? 'Count unavailable' : pending ? 'Updating result count…' : `Apply (${count} ${count === 1 ? 'result' : 'results'})`}</Button>
    </div>}
  </form>
}
