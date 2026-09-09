import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SearchResults } from '@/components/search/SearchResults'
import { ComparisonTray } from '@/components/listing/ComparisonTray'

const pathways = {
  'prep-school': { name: 'Prep School', query: 'Prep School', description: 'Research companies that state they work with prep school hockey decisions. Compare academic planning, player fit, costs, and the advisor’s recent experience.' },
  'junior-hockey': { name: 'Junior Hockey', query: 'Junior Hockey', description: 'Research companies that state they guide junior hockey decisions. Verify current league rules, player rights, costs, role expectations, and realistic alternatives.' },
  ncaa: { name: 'NCAA Hockey', query: 'NCAA', description: 'Research companies that state they work with NCAA pathways. Confirm current recruiting and eligibility rules directly with authoritative organizations.' },
  'u-sports': { name: 'U SPORTS Hockey', query: 'U SPORTS', description: 'Research companies that state they work with Canadian university hockey pathways and academic planning.' },
  'professional-hockey': { name: 'Professional Hockey', query: 'Professional Hockey', description: 'Research companies that state they guide professional hockey decisions. Distinguish advisory work from regulated contract representation.' },
} as const
type PathwaySlug = keyof typeof pathways
export function generateStaticParams() { return Object.keys(pathways).map((pathway) => ({ pathway })) }

export async function generateMetadata({ params }: { params: Promise<{ pathway: string }> }): Promise<Metadata> {
  const { pathway } = await params
  const item = pathways[pathway as PathwaySlug]
  if (!item) return { title: 'Pathway Not Found', robots: { index: false, follow: false } }
  return { title: `${item.name} Hockey Advisors`, description: item.description, alternates: { canonical: `/hockey-pathways/${pathway}` } }
}

export default async function PathwayPage({ params }: { params: Promise<{ pathway: string }> }) {
  const { pathway } = await params
  const item = pathways[pathway as PathwaySlug]
  if (!item) notFound()
  const schema = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${item.name} hockey advisors`, description: item.description, url: `https://thehockeydirectory.com/hockey-pathways/${pathway}` }
  return <main className="min-h-screen bg-ice-white"><section className="rink-grid border-b-4 border-red-line bg-arena-navy text-white"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-goal-gold">Pathway research</p><h1 className="font-display text-5xl font-extrabold uppercase sm:text-6xl">{item.name} advisors</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-ice-blue">{item.description}</p></div></section><div className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><section className="mb-8 rounded-xl border border-frost bg-white p-6"><h2 className="font-display text-2xl font-bold uppercase text-arena-navy">Before choosing</h2><p className="mt-3 leading-7 text-neutral-gray">Ask for recent experience with players at a similar age and level, written service scope, full pricing, references, and disclosure of referral relationships. No advisor can guarantee a roster spot, scholarship, contract, or draft outcome.</p><Link href="/guides/how-to-choose-a-hockey-advisor" className="mt-4 inline-flex min-h-11 items-center font-bold text-hockey-blue">Read the family due-diligence guide →</Link></section><SearchResults searchParams={{ pathway: item.query }} /></div><ComparisonTray /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /></main>
}
