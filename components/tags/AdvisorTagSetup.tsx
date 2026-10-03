'use client'

import { useEffect, useState } from 'react'
import { TagPicker } from './TagPicker'
import { TagSuggestionForm } from './TagSuggestionForm'
import { validateTagSelection } from '@/lib/tags/validation'
import type { TagCatalog } from '@/lib/tags/types'
import { Button } from '@/components/ui/button'

export function AdvisorTagSetup({ onCompletenessChange }: { onCompletenessChange?: (complete: boolean) => void }) {
  const [catalog, setCatalog] = useState<TagCatalog | null>(null)
  const [companyId, setCompanyId] = useState('')
  const [ids, setIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch('/api/advisor/tags', { cache: 'no-store' })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Tags could not be loaded.')
        if (!cancelled) { setCatalog(result.catalog); setIds(result.tag_ids); setCompanyId(result.company_id) }
      } catch (failure) { if (!cancelled) { setError(true); setMessage(failure instanceof Error ? failure.message : 'Tags could not be loaded.') } }
    }
    load()
    return () => { cancelled = true }
  }, [])
  const complete = catalog ? (() => { try { validateTagSelection(ids, catalog.tags); return true } catch { return false } })() : false
  useEffect(() => { onCompletenessChange?.(complete) }, [complete, onCompletenessChange])
  return <section aria-labelledby="advisor-tags-heading" className="mb-8 rounded-xl border border-frost bg-white p-6">
    <h2 id="advisor-tags-heading" className="font-display text-3xl font-bold text-arena-navy">Directory tags</h2>
    <p className="my-3 text-sm text-neutral-gray">These approved tags help families find your listing.</p>
    <div role="progressbar" aria-label="Tag setup completeness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={complete ? 100 : 0} aria-valuetext={complete ? 'Required core tags complete' : 'Choose 3–5 core tags including a service'} className="mb-4 h-2 rounded-full bg-ice-blue"><div className={`h-full rounded-full bg-success-green ${complete ? 'w-full' : 'w-0'}`} /></div>
    {message && <p role={error ? 'alert' : 'status'} className="mb-4 text-sm">{message}</p>}
    {!catalog && !message && <p role="status">Loading approved tags…</p>}
    {catalog && <>
      <form onSubmit={async (event) => {
        event.preventDefault(); setMessage(''); setBusy(true)
        try {
          const tag_ids = validateTagSelection(ids, catalog.tags)
          const response = await fetch('/api/advisor/tags', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tag_ids }) })
          const result = await response.json()
          if (!response.ok) throw new Error(result.error || 'Tags could not be saved.')
          setIds(result.tag_ids); setError(false); setMessage('Directory tags saved.')
        } catch (failure) { setError(true); setMessage(failure instanceof Error ? failure.message : 'Tags could not be saved.') }
        finally { setBusy(false) }
      }}>
        <TagPicker catalog={catalog} value={ids} onChange={setIds} disabled={busy} />
        <Button type="submit" disabled={busy} className="mt-5 min-h-12">{busy ? 'Saving tags…' : 'Save directory tags'}</Button>
      </form>
      <TagSuggestionForm catalog={catalog} context={{ company_id: companyId }} />
    </>}
  </section>
}
