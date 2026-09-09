'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, Calendar, Download, Loader2, Mail, MessageSquare, Phone, Save, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'closed' | 'spam'
type StatusFilter = 'all' | LeadStatus

type Lead = {
  id: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  player_age: number | null
  player_level: string | null
  goals: string[]
  message: string
  status: LeadStatus
  owner_notes: string | null
  created_at: string
}

const filters: StatusFilter[] = ['all', 'new', 'contacted', 'qualified', 'closed', 'spam']
const statusStyles: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  qualified: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  spam: 'bg-red-100 text-red-800',
}

function csvCell(value: unknown) {
  let text = String(value ?? '')
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export default function AdvisorLeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/advisor/leads?status=${filter}&limit=100`, { cache: 'no-store' })
      if (response.status === 401) {
        router.push('/login?returnTo=/dashboard/leads')
        return
      }
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Inquiries could not be loaded.')
      setLeads(data.leads || [])
      setCounts(data.statusCounts || {})
      setNotes(Object.fromEntries((data.leads || []).map((lead: Lead) => [lead.id, lead.owner_notes || ''])))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Inquiries could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [filter, router])

  useEffect(() => { load() }, [load])

  async function updateLead(id: string, update: { status?: LeadStatus; owner_notes?: string | null }) {
    setUpdating(id)
    setError(null)
    try {
      const response = await fetch(`/api/advisor/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'The inquiry could not be updated.')
      setLeads((current) => current.map((lead) => lead.id === id ? data.lead : lead))
      await load()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'The inquiry could not be updated.')
    } finally {
      setUpdating(null)
    }
  }

  function exportCsv() {
    const rows = [
      ['Date', 'Name', 'Email', 'Phone', 'Player age', 'Player level', 'Goals', 'Message', 'Status', 'Owner notes'],
      ...leads.map((lead) => [new Date(lead.created_at).toISOString(), lead.contact_name, lead.contact_email, lead.contact_phone, lead.player_age, lead.player_level, lead.goals.join('; '), lead.message, lead.status, lead.owner_notes]),
    ]
    const blob = new Blob([rows.map((row) => row.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `directory-inquiries-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <Button asChild variant="outline" size="sm" className="mb-5"><Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to dashboard</Link></Button>
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-hockey-blue">Owner dashboard</p><h1 className="font-display text-4xl font-extrabold uppercase text-arena-navy">Family inquiries</h1><p className="mt-2 text-neutral-gray">Private contact requests submitted through your company profile.</p></div>{leads.length > 0 && <Button variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export current view</Button>}</div>

    <div className="mb-6 flex gap-2 overflow-x-auto border-b border-frost" aria-label="Inquiry status filter">{filters.map((status) => <button key={status} type="button" onClick={() => setFilter(status)} className={`min-h-11 whitespace-nowrap border-b-2 px-3 text-sm font-bold capitalize ${filter === status ? 'border-hockey-blue text-hockey-blue' : 'border-transparent text-neutral-gray'}`}>{status} {counts[status] ? <span className="ml-1 rounded-full bg-ice-blue px-2 py-0.5 text-xs">{counts[status]}</span> : null}</button>)}</div>
    {error && <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}
    {loading ? <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-hockey-blue" /><span className="ml-3">Loading inquiries…</span></div> : leads.length === 0 ? <Card><CardContent className="p-12 text-center"><Mail className="mx-auto mb-4 h-12 w-12 text-neutral-gray" /><h2 className="font-display text-2xl font-bold uppercase text-arena-navy">No inquiries in this view</h2><p className="mt-2 text-neutral-gray">New family inquiries will appear here after a contact form is submitted.</p></CardContent></Card> : <div className="space-y-4">{leads.map((lead) => <Card key={lead.id}><CardContent className="p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-arena-navy">{lead.contact_name}</h2><Badge className={statusStyles[lead.status]}>{lead.status}</Badge></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-gray"><a href={`mailto:${lead.contact_email}`} className="flex min-h-8 items-center gap-1 hover:text-hockey-blue"><Mail className="h-4 w-4" />{lead.contact_email}</a>{lead.contact_phone && <a href={`tel:${lead.contact_phone}`} className="flex min-h-8 items-center gap-1 hover:text-hockey-blue"><Phone className="h-4 w-4" />{lead.contact_phone}</a>}{lead.player_age && <span className="flex items-center gap-1"><User className="h-4 w-4" />Age {lead.player_age}</span>}<span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</span></div></div><Button type="button" variant="outline" onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}>{expanded === lead.id ? 'Hide details' : 'View details'}</Button></div>
      {expanded !== lead.id && <p className="mt-4 line-clamp-2 text-sm leading-6 text-neutral-gray"><MessageSquare className="mr-1 inline h-4 w-4" />{lead.message}</p>}
      {expanded === lead.id && <div className="mt-5 space-y-5 border-t border-frost pt-5"><div><h3 className="mb-2 font-bold text-arena-navy">Message</h3><p className="whitespace-pre-line rounded-xl bg-ice-white p-4 leading-7 text-neutral-gray">{lead.message}</p></div>{lead.player_level && <p><span className="font-bold">Player level:</span> {lead.player_level}</p>}{lead.goals.length > 0 && <p><span className="font-bold">Goals:</span> {lead.goals.join(', ')}</p>}<div><h3 className="mb-2 font-bold text-arena-navy">Status</h3><div className="flex flex-wrap gap-2">{(['new', 'contacted', 'qualified', 'closed', 'spam'] as LeadStatus[]).map((status) => <Button key={status} type="button" size="sm" variant={lead.status === status ? 'default' : 'outline'} disabled={updating === lead.id || lead.status === status} onClick={() => updateLead(lead.id, { status })} className="capitalize">{status}</Button>)}</div></div><div><label htmlFor={`notes-${lead.id}`} className="mb-2 block font-bold text-arena-navy">Private notes</label><Textarea id={`notes-${lead.id}`} maxLength={2000} value={notes[lead.id] || ''} onChange={(event) => setNotes({ ...notes, [lead.id]: event.target.value })} /><Button type="button" size="sm" className="mt-2" disabled={updating === lead.id} onClick={() => updateLead(lead.id, { owner_notes: notes[lead.id]?.trim() || null })}><Save className="mr-2 h-4 w-4" />Save notes</Button></div></div>}
    </CardContent></Card>)}</div>}
  </main>
}
