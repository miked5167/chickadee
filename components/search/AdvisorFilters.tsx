'use client'

import { useEffect, useId, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { X, SlidersHorizontal } from 'lucide-react'
import { TagFilterForm } from './TagFilterForm'
import starter from '@/data/directory-tags.json'
import type { TagCatalog } from '@/lib/tags/types'
import type { DirectorySearchResult } from '@/lib/tags/directory-search'
import { filterHref, parseFilterState, serializeFilterState, type FilterState } from '@/lib/tags/filter-state'

export function AdvisorFilters({ initialData }: { initialData?: DirectorySearchResult; showLocationFilters?: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const catalog = initialData?.catalog || starter as TagCatalog
  const initial = initialData?.state || parseFilterState(new URLSearchParams(searchParams.toString()), catalog)
  return <FilterPanel key={serializeFilterState(initial).toString()} initial={initial} initialData={initialData} catalog={catalog} apply={(state) => router.push(filterHref(state))} />
}
function FilterPanel({ initial, initialData, catalog, apply }: { initial: FilterState; initialData?: DirectorySearchResult; catalog: TagCatalog; apply: (state: FilterState) => void }) {
  const [draft, setDraft] = useState(initial)
  const [result, setResult] = useState(initialData)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const draftQuery = serializeFilterState({ ...draft, page: 1 }).toString()
  const initialQuery = serializeFilterState({ ...initial, page: 1 }).toString()
  useEffect(() => {
    if (initialData && draftQuery === initialQuery) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/advisors?' + draftQuery, { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('The result count could not be updated. Please try again.')
        const data = await response.json()
        if (!controller.signal.aborted) { setResult(data); setPending(false); setError('') }
      } catch (failure) { if (!controller.signal.aborted) { setPending(false); setError(failure instanceof Error ? failure.message : 'Results unavailable.') } }
    }, 200)
    return () => { clearTimeout(timer); controller.abort() }
  }, [draftQuery, initialQuery, initialData])
  const change = (state: FilterState) => {
    setDraft(state); setError('')
    const unchanged = serializeFilterState({ ...state, page: 1 }).toString() === initialQuery
    setPending(!unchanged)
    if (unchanged) setResult(initialData)
  }
  const facets = result?.facets || { tags: {}, countries: {}, flags: { accepting: 0, remote: 0, verified: 0 } }
  const props = { catalog, state: draft, facets, count: result?.pagination.total || 0, pending, onChange: change, onApply: () => { apply({ ...draft, page: 1 }); setOpen(false) } }
  return <>
    <div className="hidden lg:block">{error && <p role="alert" className="mb-3 text-sm text-red-800">{error}</p>}<TagFilterForm {...props} /></div>
    <Dialog.Root open={open} onOpenChange={(value) => { if (value) { setDraft(initial); setResult(initialData); setPending(false); setError('') } setOpen(value) }}>
      <Dialog.Trigger className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-frost bg-white font-bold text-hockey-blue lg:hidden" aria-controls={panelId}><SlidersHorizontal size={18} aria-hidden="true" />Filters{initial.tags.length > 0 ? ' (' + initial.tags.length + ')' : ''}</Dialog.Trigger>
      <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" /><Dialog.Content id={panelId} className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-2xl bg-white shadow-xl data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom duration-200">
        <div className="flex items-start justify-between gap-3 border-b border-frost p-4">
          <div><Dialog.Title className="text-xl font-bold text-arena-navy">Filter advisors</Dialog.Title><Dialog.Description className="mt-1 text-sm text-neutral-gray">Choose options, then apply them to the directory.</Dialog.Description></div>
          <Dialog.Close className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-frost" aria-label="Close filters"><X aria-hidden="true" /></Dialog.Close>
        </div>
        <div className="overflow-y-auto p-4">{error && <p role="alert" className="mb-3 text-sm text-red-800">{error}</p>}<TagFilterForm {...props} /></div>
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
    <noscript><details className="rounded-lg border border-frost bg-white p-4 lg:hidden"><summary className="font-bold">Filters</summary><TagFilterForm catalog={catalog} state={initial} facets={initialData?.facets || facets} count={initialData?.pagination.total || 0} /></details></noscript>
  </>
}
