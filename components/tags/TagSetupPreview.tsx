'use client'
import { useState } from 'react'
import { TagPicker } from './TagPicker'
import type { TagCatalog } from '@/lib/tags/types'
export function TagSetupPreview({ catalog }: { catalog: TagCatalog }) {
  const [ids, setIds] = useState<string[]>([])
  return <section id="advisor-tags" className="mt-10 scroll-mt-28 rounded-xl border border-frost bg-white p-4 sm:p-6"><h2 className="mb-4 text-2xl font-bold text-arena-navy">Try advisor tag selection</h2><p className="mb-4 text-sm text-neutral-gray">Choose a tab, then select its tags. Your choices stay selected as you switch tabs. Preview only; selections are not saved to a listing.</p><TagPicker catalog={catalog} value={ids} onChange={setIds} /></section>
}
