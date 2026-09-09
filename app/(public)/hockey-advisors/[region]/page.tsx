import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SearchResults } from '@/components/search/SearchResults'
import { ComparisonTray } from '@/components/listing/ComparisonTray'
import { createClient } from '@/lib/supabase/server'

const regions = {
  canada: { name: 'Canada', country: 'CA', intro: 'Research hockey advisory companies serving families across Canada, from minor hockey and prep school decisions through junior and university pathways.' },
  'united-states': { name: 'the United States', country: 'US', intro: 'Research hockey advisory companies serving families across the United States, including prep, junior, NCAA, and player-development decisions.' },
  ontario: { name: 'Ontario', state: 'ON', intro: 'Compare hockey advisor companies in Ontario and review their stated services, people, pathways, and availability.' },
  quebec: { name: 'Quebec', state: 'QC', intro: 'Compare hockey advisor companies in Quebec and look for relevant language, location, and pathway experience.' },
  'british-columbia': { name: 'British Columbia', state: 'BC', intro: 'Find and compare hockey advisory companies serving players and families in British Columbia.' },
  alberta: { name: 'Alberta', state: 'AB', intro: 'Find and compare hockey advisory companies serving players and families in Alberta.' },
  michigan: { name: 'Michigan', state: 'MI', intro: 'Find hockey advisory companies in Michigan and compare their stated services and pathway experience.' },
  minnesota: { name: 'Minnesota', state: 'MN', intro: 'Find hockey advisory companies in Minnesota and compare their stated services and pathway experience.' },
  massachusetts: { name: 'Massachusetts', state: 'MA', intro: 'Find hockey advisory companies in Massachusetts and compare their prep, junior, and college guidance.' },
  'new-york': { name: 'New York', state: 'NY', intro: 'Find hockey advisory companies in New York and compare their stated services and availability.' },
} as const

type RegionSlug = keyof typeof regions
export function generateStaticParams() { return Object.keys(regions).map((region) => ({ region })) }

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const { region } = await params
  const item = regions[region as RegionSlug]
  if (!item) return { title: 'Region Not Found', robots: { index: false, follow: false } }
  return { title: `Hockey Advisors in ${item.name}`, description: item.intro, alternates: { canonical: `/hockey-advisors/${region}` } }
}

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params
  const item = regions[region as RegionSlug]
  if (!item) notFound()
  const filters: { country?: string; state?: string } = {}
  if ('country' in item) filters.country = item.country
  if ('state' in item) filters.state = item.state
  const supabase = await createClient()
  let query = supabase.from('companies').select('name, slug').order('name').limit(100)
  if (filters.country) query = query.eq('country', filters.country)
  if (filters.state) query = query.eq('state_province', filters.state)
  const { data: companies } = await query
  const schema = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `Hockey advisors in ${item.name}`, description: item.intro, url: `https://thehockeydirectory.com/hockey-advisors/${region}`, mainEntity: { '@type': 'ItemList', numberOfItems: companies?.length || 0, itemListElement: (companies || []).map((company, index) => ({ '@type': 'ListItem', position: index + 1, name: company.name, url: `https://thehockeydirectory.com/listings/${company.slug}` })) } }
  return <main className="min-h-screen bg-ice-white"><section className="rink-grid border-b-4 border-red-line bg-arena-navy text-white"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-goal-gold">Location guide</p><h1 className="font-display text-5xl font-extrabold uppercase sm:text-6xl">Hockey advisors in {item.name}</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-ice-blue">{item.intro}</p></div></section><div className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><section className="mb-8 rounded-xl border border-frost bg-white p-6"><h2 className="font-display text-2xl font-bold uppercase text-arena-navy">How to use this list</h2><p className="mt-3 leading-7 text-neutral-gray">Location is one part of fit. Compare relevant pathway experience, who will work with the player, communication expectations, complete pricing, references, and possible conflicts. Remote service may make a company outside the region worth considering.</p></section><SearchResults searchParams={filters} /></div><ComparisonTray /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /></main>
}
