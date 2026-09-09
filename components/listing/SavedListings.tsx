'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bookmark, Loader2 } from 'lucide-react'
import { AdvisorCard } from '@/components/listing/AdvisorCard'
import { Button } from '@/components/ui/button'

type Advisor = {
  id: string; slug: string; name: string; city: string | null; state: string | null; country: string
  description: string | null; verified: boolean; logo_url: string | null; website_url?: string | null
  specialties?: string[]; services?: string[]; offers_remote?: boolean; accepting_clients?: boolean | null; tagline?: string | null
}

function readSaved() {
  try { const value = JSON.parse(localStorage.getItem('hockey-directory-saved-listings') || '[]'); return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [] } catch { return [] }
}

export function SavedListings() {
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    async function load() {
      const ids = readSaved()
      if (!ids.length) { setLoading(false); return }
      try {
        const response = await fetch(`/api/advisors?ids=${ids.join(',')}&limit=50`)
        const data = await response.json()
        if (response.ok) setAdvisors(data.advisors || [])
      } finally { setLoading(false) }
    }
    load()
  }, [])
  if (loading) return <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-hockey-blue" /><span className="ml-3">Loading saved listings…</span></div>
  if (!advisors.length) return <div className="rounded-xl border border-frost bg-white p-12 text-center"><Bookmark className="mx-auto mb-4 h-12 w-12 text-neutral-gray" /><h2 className="font-display text-2xl font-bold uppercase text-arena-navy">No saved listings yet</h2><p className="mx-auto mt-2 max-w-md text-neutral-gray">Use the Save button on a company card. Your shortlist stays on this device.</p><Button asChild className="mt-6"><Link href="/listings">Browse advisors</Link></Button></div>
  return <div className="grid gap-6 md:grid-cols-2">{advisors.map((advisor) => <AdvisorCard key={advisor.id} advisor={advisor} />)}</div>
}
