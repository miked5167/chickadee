'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Download, RefreshCw } from 'lucide-react'
import type { AnalyticsReport } from '@/lib/analytics/report'

export default function AnalyticsPage() {
  const [days, setDays] = useState('30')
  const [refresh, setRefresh] = useState(0)
  const [data, setData] = useState<AnalyticsReport | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/admin/analytics?days=${days}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Could not load analytics.')
        setData(result.data)
      })
      .catch(error => { if (!controller.signal.aborted) setError(error.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [days, refresh])

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold text-hockey-blue hover:underline">← Back to directory</Link>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div><h1 className="font-display text-4xl font-bold text-arena-navy">Directory analytics</h1>
            <p className="mt-2 text-slate-600">Saved activity from Supabase. All dates use UTC.</p></div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium">Period <select aria-label="Reporting period" value={days} onChange={e => { setLoading(true); setError(''); setDays(e.target.value) }} className="ml-2 rounded-lg border bg-white p-3">
              <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option>
            </select></label>
            <button onClick={() => { setLoading(true); setError(''); setRefresh(r => r + 1) }} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border bg-white p-3 disabled:opacity-50"><RefreshCw size={18} /> Refresh</button>
            <a href={`/api/admin/analytics/export?days=${days}`} className="inline-flex items-center gap-2 rounded-lg bg-hockey-blue p-3 text-white"><Download size={18} /> Export CSV</a>
          </div>
        </div>
        {loading && <p role="status">Loading analytics…</p>}
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
        {!loading && !error && data && <>
          <section className="rounded-xl border bg-white p-5 text-sm leading-6 text-slate-600" aria-label="Tracking status">
            <p><strong className="text-slate-900">Profile tracking:</strong> {data.latestLiveEvent ? `Latest saved live event: ${new Date(data.latestLiveEvent).toLocaleString()}.` : 'No live profile events in this period yet.'}</p>
            <p><strong className="text-slate-900">Google Analytics:</strong> {data.googleAnalyticsConfigured ? 'Measurement ID configured. Check Google Analytics Realtime to confirm delivery.' : 'Awaiting a Google Analytics measurement ID.'}</p>
            <p>Views, clicks, and sessions include visitors who allow analytics. Preview events ({data.previewEvents}) and older events with no environment label ({data.legacyEvents}) are excluded.</p>
            <p>Inquiries count saved, non-spam submissions; reviews count approved reviews. These totals include submissions regardless of analytics consent. An email or phone click does not confirm an email was sent or a call was completed.</p>
            <p>Report generated {new Date(data.generatedAt).toLocaleString()}.</p>
          </section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Profile views', data.totals.views], ['Consented sessions', data.sessions], ['Website clicks', data.totals.website], ['Email clicks', data.totals.email],
              ['Phone clicks', data.totals.phone], ['Inquiries', data.totals.leads], ['Approved reviews', data.totals.reviews], ['Average review rating', data.averageRating?.toFixed(1) ?? '—'],
            ].map(([label, value]) => <div key={label} className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold text-arena-navy">{typeof value === 'number' ? value.toLocaleString() : value}</p><p className="mt-2 text-xs text-slate-500">Selected {data.days} days</p></div>)}
          </div>
          <section className="rounded-xl border bg-white p-5">
            <h2 className="text-xl font-bold text-arena-navy">Daily profile views</h2>
            <div className="mt-6 flex h-56 items-end gap-1" role="img" aria-label={`Daily profile views: ${data.totals.views} total in ${data.days} days. Exact counts are in the daily activity table.`}>
              {data.daily.map(day => <div key={day.date} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${day.date}: ${day.views} views`}>
                <div className="rounded-t bg-hockey-blue" style={{ height: `${day.views / Math.max(1, ...data.daily.map(d => d.views)) * 100}%`, minHeight: day.views ? 3 : 0 }} />
              </div>)}
            </div>
            <div className="mt-3 flex justify-between text-xs text-slate-500"><span>{data.from.slice(0, 10)}</span><span>{data.through.slice(0, 10)}</span></div>
          </section>
          <section className="rounded-xl border bg-white p-5">
            <h2 className="text-xl font-bold text-arena-navy">Advisor activity</h2>
            {!data.companies.length ? <p className="mt-4 text-slate-600">No activity in this period yet. Recorded activity will appear here automatically.</p> :
              <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b">{['Advisor', 'Views', 'Website', 'Email', 'Phone', 'Inquiries', 'Reviews'].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead>
                <tbody>{data.companies.map(row => <tr key={row.id} className="border-b last:border-0"><td className="p-3"><Link href={`/listings/${row.slug}`} className="font-medium text-hockey-blue hover:underline">{row.name}</Link></td>{[row.views, row.website, row.email, row.phone, row.leads, row.reviews].map((value, i) => <td key={i} className="p-3 tabular-nums">{value}</td>)}</tr>)}</tbody></table></div>}
          </section>
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-xl border bg-white p-5"><h2 className="text-xl font-bold text-arena-navy">Referring websites</h2><p className="mt-2 text-sm text-slate-500">Referrer reported by the browser for profile views; some browsers omit it.</p>
              {!data.referrers.length && <p className="mt-4 text-slate-600">No referring traffic recorded yet.</p>}
              <ul className="mt-4 space-y-2">{data.referrers.map(row => <li key={row.source} className="flex justify-between gap-3"><span className="break-all">{row.source}</span><strong>{row.views}</strong></li>)}</ul>
            </section>
            <section className="rounded-xl border bg-white p-5"><h2 className="text-xl font-bold text-arena-navy">Inquiry status</h2>
              {!data.leadStatuses.length && <p className="mt-4 text-slate-600">No inquiries in this period yet.</p>}
              <ul className="mt-4 space-y-2">{data.leadStatuses.map(row => <li key={row.status} className="flex justify-between"><span className="capitalize">{row.status}</span><strong>{row.count}</strong></li>)}</ul>
            </section>
          </div>
          <details className="rounded-xl border bg-white p-5"><summary className="cursor-pointer text-xl font-bold text-arena-navy">Daily activity counts</summary><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Date (UTC)', 'Views', 'Website', 'Email', 'Phone', 'Inquiries', 'Reviews'].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead>
            <tbody>{data.daily.map(row => <tr key={row.date} className="border-t">{[row.date, row.views, row.website, row.email, row.phone, row.leads, row.reviews].map((v, i) => <td key={i} className="p-3">{v}</td>)}</tr>)}</tbody></table></div></details>
        </>}
      </div>
    </div>
  )
}
