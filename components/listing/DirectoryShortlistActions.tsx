'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bookmark, GitCompareArrows } from 'lucide-react'

const savedKey = 'hockey-directory-saved-listings'
const compareKey = 'hockey-directory-compare-listings'

function readIds(key: string) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function writeIds(key: string, values: string[]) {
  localStorage.setItem(key, JSON.stringify(values))
  window.dispatchEvent(new CustomEvent('directory-shortlist-changed'))
}

export function DirectoryShortlistActions({ companyId, companyName, showComparisonLink = false }: { companyId: string; companyName: string; showComparisonLink?: boolean }) {
  const [saved, setSaved] = useState(false)
  const [compared, setCompared] = useState(false)
  const [message, setMessage] = useState('')
  const [comparisonIds, setComparisonIds] = useState<string[]>([])

  useEffect(() => {
    const sync = () => {
      setSaved(readIds(savedKey).includes(companyId))
      const ids = readIds(compareKey)
      setCompared(ids.includes(companyId))
      setComparisonIds(ids.slice(0, 3))
    }
    sync()
    window.addEventListener('directory-shortlist-changed', sync)
    return () => window.removeEventListener('directory-shortlist-changed', sync)
  }, [companyId])

  function toggleSaved() {
    const ids = readIds(savedKey)
    writeIds(savedKey, ids.includes(companyId) ? ids.filter((id) => id !== companyId) : [...ids, companyId])
    setMessage(ids.includes(companyId) ? `${companyName} removed from saved listings.` : `${companyName} saved on this device.`)
  }

  function toggleCompared() {
    const ids = readIds(compareKey)
    if (!ids.includes(companyId) && ids.length >= 3) {
      setMessage('You can compare up to three companies at a time.')
      return
    }
    writeIds(compareKey, ids.includes(companyId) ? ids.filter((id) => id !== companyId) : [...ids, companyId])
    setMessage(ids.includes(companyId) ? `${companyName} removed from comparison.` : `${companyName} added to comparison.`)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={toggleSaved} aria-pressed={saved} className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold ${saved ? 'border-hockey-blue bg-ice-blue text-hockey-blue' : 'border-frost text-neutral-gray hover:border-hockey-blue'}`}>
          <Bookmark aria-hidden="true" className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />{saved ? 'Saved' : 'Save'}
        </button>
        <button type="button" onClick={toggleCompared} aria-pressed={compared} className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold ${compared ? 'border-hockey-blue bg-ice-blue text-hockey-blue' : 'border-frost text-neutral-gray hover:border-hockey-blue'}`}>
          <GitCompareArrows aria-hidden="true" className="h-4 w-4" />{compared ? 'Comparing' : 'Compare'}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">{message}</p>
      {showComparisonLink && (
        <div className="mt-3 text-xs leading-6 text-neutral-gray">
          {comparisonIds.length >= 2 ? (
            <Link href={`/compare?ids=${encodeURIComponent(comparisonIds.join(','))}`} className="inline-block min-h-9 text-hockey-blue underline underline-offset-4">
              View comparison ({comparisonIds.length})
            </Link>
          ) : (
            <>
              <p>Select 2–3 companies to compare.</p>
              {comparisonIds.length === 1 && <Link href="/listings" className="inline-block min-h-9 text-hockey-blue underline underline-offset-4">Find another advisor</Link>}
            </>
          )}
        </div>
      )}
    </div>
  )
}
