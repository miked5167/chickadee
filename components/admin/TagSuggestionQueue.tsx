'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { TagSuggestion } from '@/lib/tags/types'
import { suggestedTagSlug } from '@/lib/tags/validation'

function SuggestionReview({ suggestion, onReviewed }: { suggestion: TagSuggestion; onReviewed: (id: string) => void }) {
  const [label, setLabel] = useState(suggestion.label)
  const [slug, setSlug] = useState(suggestedTagSlug(suggestion.label))
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function review(action: 'approve' | 'reject') {
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/tag-suggestions/${suggestion.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'approve' ? { action, label, slug, note } : { action, note }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'The review could not be saved.')
      onReviewed(suggestion.id)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'The review could not be saved.')
    } finally { setSaving(false) }
  }

  return <article className="rounded-xl border border-frost bg-white p-5" aria-labelledby={`suggestion-${suggestion.id}`}>
    <h2 id={`suggestion-${suggestion.id}`} className="text-xl font-bold text-arena-navy">{suggestion.label}</h2>
    <p className="mt-1 text-sm text-neutral-gray">Group: {suggestion.group_key.replaceAll('_', ' ')} · Submitted {new Date(suggestion.created_at).toISOString().slice(0, 10)}</p>
    <p className="mt-3 whitespace-pre-wrap">{suggestion.reason}</p>
    <p className="mt-2 break-all text-xs text-neutral-gray">{suggestion.company_id ? `Company: ${suggestion.company_id}` : `Pending claim: ${suggestion.claim_id}`}</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor={`label-${suggestion.id}`}>Approved display label</Label><Input id={`label-${suggestion.id}`} value={label} maxLength={100} onChange={(event) => setLabel(event.target.value)} disabled={saving} /></div>
      <div className="space-y-2"><Label htmlFor={`slug-${suggestion.id}`}>Stable tag slug</Label><Input id={`slug-${suggestion.id}`} value={slug} maxLength={80} onChange={(event) => setSlug(event.target.value)} disabled={saving} /><p className="text-xs text-neutral-gray">Lowercase letters, numbers and hyphens. Reuse an existing slug and its exact label to approve an existing option.</p></div>
    </div>
    <div className="mt-4 space-y-2"><Label htmlFor={`note-${suggestion.id}`}>Review note (optional)</Label><Textarea id={`note-${suggestion.id}`} value={note} maxLength={1000} onChange={(event) => setNote(event.target.value)} disabled={saving} /></div>
    {error && <p role="alert" className="mt-3 text-red-800">{error}</p>}
    <div className="mt-4 flex gap-3"><Button type="button" disabled={saving || !label.trim() || !slug.trim()} onClick={() => review('approve')}>Approve tag</Button><Button type="button" variant="outline" disabled={saving} onClick={() => review('reject')}>Reject suggestion</Button></div>
  </article>
}

export function TagSuggestionQueue() {
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/tag-suggestions', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'The review queue could not be loaded.')
      setSuggestions(data.suggestions)
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'The review queue could not be loaded.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return <section className="mt-8 space-y-5" aria-label="Pending tag suggestions" aria-busy={loading}>
    <Button type="button" variant="outline" onClick={load} disabled={loading}>Refresh queue</Button>
    <p role="status">{loading ? 'Loading suggestions…' : message}</p>
    {error && <p role="alert" className="text-red-800">{error}</p>}
    {!loading && !error && suggestions.length === 0 && <p>No pending suggestions.</p>}
    {suggestions.map((suggestion) => <SuggestionReview key={suggestion.id} suggestion={suggestion} onReviewed={(id) => {
      setSuggestions((current) => current.filter((item) => item.id !== id))
      setMessage('Review saved. Refresh to load any additional pending suggestions.')
    }} />)}
  </section>
}
