'use client'

import { useId } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { TagCatalog } from '@/lib/tags/types'

const tabLabels: Record<string, string> = { player_level: 'Player level', age_group: 'Age groups', regions: 'Regions', price_range: 'Price range' }

export function TagPicker({ catalog, value, onChange, disabled = false }: { catalog: TagCatalog; value: string[]; onChange: (ids: string[]) => void; disabled?: boolean }) {
  const prefix = useId()
  const active = catalog.tags.filter((tag) => tag.is_active)
  const coreCount = active.filter((tag) => value.includes(tag.id) && ['services', 'pathways'].includes(tag.group_key)).length
  return <div className="space-y-6">
    <p id={`${prefix}-help`} className="text-sm leading-6 text-neutral-gray">Choose 3–5 Services and Pathways tags, including at least one Service. Player fit, regions and languages are optional.</p>
    <p role="status" aria-live="polite" className="text-sm font-bold text-hockey-blue">{coreCount} of 3–5 core tags selected</p>
    <Tabs defaultValue={catalog.groups[0]?.key} className="min-w-0 gap-4">
      <TabsList aria-label="Advisor tag groups" className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-xl bg-ice-blue p-2">
        {catalog.groups.map((group) => {
          const count = active.filter((tag) => tag.group_key === group.key && value.includes(tag.id)).length
          const label = tabLabels[group.key] || group.label
          return <TabsTrigger key={group.key} value={group.key} className="min-h-11 h-auto flex-none rounded-lg px-3 py-2 font-semibold text-arena-navy data-[state=active]:bg-hockey-blue data-[state=active]:text-white focus-visible:ring-hockey-blue" aria-label={count ? `${label}, ${count} selected` : label}>
            {label}{count > 0 && <span aria-hidden="true" className="rounded-full bg-white/25 px-2 text-xs">{count}</span>}
          </TabsTrigger>
        })}
      </TabsList>
    {catalog.groups.map((group) => <TabsContent key={group.key} value={group.key} className="rounded-lg focus-visible:ring-2 focus-visible:ring-hockey-blue">
      <fieldset disabled={disabled} aria-describedby={`${prefix}-help`} className="rounded-lg border border-frost p-4">
      <legend className="px-2 font-bold text-arena-navy">{group.label}{group.is_core ? ' · core tags' : ' · optional'}</legend>
      <div className="max-h-80 overflow-y-auto overscroll-contain rounded-md focus-within:ring-1 focus-within:ring-hockey-blue">
      <div className="grid gap-2 sm:grid-cols-2">
        {active.filter((tag) => tag.group_key === group.key).map((tag) => {
          const checked = value.includes(tag.id)
          const full = group.is_core && coreCount >= 5 && !checked
          return <label key={tag.id} htmlFor={`${prefix}-${tag.id}`} className={`flex min-h-11 items-center gap-3 rounded-md p-2 text-sm ${full ? 'text-neutral-gray' : 'cursor-pointer text-arena-navy'}`}>
            <input id={`${prefix}-${tag.id}`} type="checkbox" className="h-5 w-5 shrink-0 accent-hockey-blue" checked={checked} disabled={full} onChange={() => onChange(checked ? value.filter((id) => id !== tag.id) : group.key === 'price_range' ? [...value.filter((id) => !id.startsWith('price_range:')), tag.id] : [...value, tag.id])} />
            <span>{tag.label}</span>
          </label>
        })}
      </div>
      </div>
    </fieldset></TabsContent>)}
    </Tabs>
  </div>
}
