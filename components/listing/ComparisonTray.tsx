'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GitCompareArrows, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const compareKey = 'hockey-directory-compare-listings'

function readIds() {
  try { const value = JSON.parse(localStorage.getItem(compareKey) || '[]'); return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 3) : [] } catch { return [] }
}

export function ComparisonTray() {
  const [ids, setIds] = useState<string[]>([])
  useEffect(() => {
    const sync = () => setIds(readIds())
    sync()
    window.addEventListener('directory-shortlist-changed', sync)
    return () => window.removeEventListener('directory-shortlist-changed', sync)
  }, [])
  if (!ids.length) return null
  function clear() { localStorage.removeItem(compareKey); setIds([]); window.dispatchEvent(new CustomEvent('directory-shortlist-changed')) }
  return <div className="fixed inset-x-0 bottom-3 z-40 mx-auto flex w-[calc(100%-1rem)] max-w-xl items-center justify-between gap-3 rounded-xl border border-white/10 bg-arena-navy p-3 text-white shadow-2xl"><div className="flex items-center gap-2"><GitCompareArrows className="h-5 w-5 text-goal-gold" /><span className="text-sm font-bold">{ids.length} of 3 selected</span></div><div className="flex gap-2"><Button asChild size="sm" disabled={ids.length < 2} className="bg-goal-gold text-arena-navy hover:bg-goal-gold/90"><Link href={`/compare?ids=${ids.join(',')}`}>Compare</Link></Button><button type="button" onClick={clear} className="flex min-h-10 min-w-10 items-center justify-center rounded-lg hover:bg-white/10" aria-label="Clear comparison"><X className="h-4 w-4" /></button></div></div>
}
