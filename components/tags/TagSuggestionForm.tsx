'use client'

import { useId, useState } from 'react'
import type { TagCatalog } from '@/lib/tags/types'
import { Button } from '@/components/ui/button'

export function TagSuggestionForm({ catalog, context }: { catalog: TagCatalog; context: { company_id: string } | { claim_id: string } }) {
  const prefix = useId()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  return <details className="mt-6 rounded-lg border border-frost p-4">
    <summary className="cursor-pointer font-bold text-hockey-blue">Suggest a missing tag</summary>
    <p className="mt-3 text-sm text-neutral-gray">An administrator reviews suggestions before they can appear in the catalog. Suggestions do not change your saved tags.</p>
    <form className="mt-4 space-y-3" onSubmit={async (event) => {
      event.preventDefault()
      const form = event.currentTarget
      const fields = new FormData(form)
      setBusy(true); setMessage('')
      try {
        const response = await fetch('/api/advisor/tag-suggestions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...context, group_key: fields.get('group'), label: fields.get('label'), reason: fields.get('reason') }) })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'The suggestion could not be submitted.')
        setError(false); setMessage('Suggestion submitted for administrator review.'); form.reset()
      } catch (failure) { setError(true); setMessage(failure instanceof Error ? failure.message : 'The suggestion could not be submitted.') }
      finally { setBusy(false) }
    }}>
      <label htmlFor={`${prefix}-group`} className="block text-sm font-semibold">Tag group</label>
      <select id={`${prefix}-group`} name="group" className="min-h-11 w-full rounded-md border border-frost bg-white px-3">{catalog.groups.map((group) => <option key={group.key} value={group.key}>{group.label}</option>)}</select>
      <label htmlFor={`${prefix}-label`} className="block text-sm font-semibold">Suggested tag name</label>
      <input id={`${prefix}-label`} name="label" required minLength={2} maxLength={100} className="min-h-11 w-full rounded-md border border-frost px-3" />
      <label htmlFor={`${prefix}-reason`} className="block text-sm font-semibold">Why is this tag needed?</label>
      <textarea id={`${prefix}-reason`} name="reason" required minLength={10} maxLength={1000} rows={3} className="w-full rounded-md border border-frost p-3" />
      <Button type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit suggestion'}</Button>
      {message && <p role={error ? 'alert' : 'status'} className="text-sm">{message}</p>}
    </form>
  </details>
}
