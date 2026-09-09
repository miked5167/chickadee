import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { guides } from '@/lib/content/guides'

export const metadata: Metadata = { title: 'Hockey Family Research Guides', description: 'Practical, plain-language guides for comparing hockey advisors, pathways, services, and fees.', alternates: { canonical: '/guides' } }

export default function GuidesPage() {
  return <main className="min-h-screen bg-ice-white"><section className="rink-grid border-b-4 border-red-line bg-arena-navy text-white"><div className="mx-auto max-w-6xl px-4 py-14 sm:px-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-goal-gold">Independent family research</p><h1 className="font-display text-5xl font-extrabold uppercase sm:text-6xl">Hockey advisor guides</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-ice-blue">Use these guides to prepare questions, compare companies, and keep control of your family’s decision.</p></div></section><div className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:px-6 md:grid-cols-2">{guides.map((guide) => <Link key={guide.slug} href={`/guides/${guide.slug}`} className="group rounded-xl border border-frost bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-hockey-blue hover:shadow-lg"><h2 className="font-display text-2xl font-bold uppercase text-arena-navy group-hover:text-hockey-blue">{guide.title}</h2><p className="mt-3 leading-7 text-neutral-gray">{guide.description}</p><span className="mt-5 flex items-center gap-1 text-sm font-bold text-hockey-blue">Read guide <ArrowUpRight className="h-4 w-4" /></span></Link>)}</div></main>
}
