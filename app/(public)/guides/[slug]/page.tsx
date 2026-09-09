import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { guideBySlug, guides } from '@/lib/content/guides'

export function generateStaticParams() { return guides.map(({ slug }) => ({ slug })) }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const guide = guideBySlug(slug)
  if (!guide) return { title: 'Guide Not Found', robots: { index: false, follow: false } }
  return { title: guide.title, description: guide.description, alternates: { canonical: `/guides/${slug}` }, openGraph: { title: guide.title, description: guide.description, type: 'article', url: `/guides/${slug}` } }
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = guideBySlug(slug)
  if (!guide) notFound()
  const schema = { '@context': 'https://schema.org', '@type': 'Article', headline: guide.title, description: guide.description, dateModified: guide.updated, datePublished: guide.updated, author: { '@type': 'Organization', name: 'The Hockey Directory' }, publisher: { '@type': 'Organization', name: 'The Hockey Directory', url: 'https://thehockeydirectory.com' }, mainEntityOfPage: `https://thehockeydirectory.com/guides/${guide.slug}` }
  return <main className="min-h-screen bg-ice-white"><article><header className="rink-grid border-b-4 border-red-line bg-arena-navy text-white"><div className="mx-auto max-w-3xl px-4 py-14 sm:px-6"><Link href="/guides" className="text-sm font-bold text-goal-gold hover:underline">← All guides</Link><h1 className="mt-5 font-display text-5xl font-extrabold uppercase leading-none sm:text-6xl">{guide.title}</h1><p className="mt-5 text-lg leading-8 text-ice-blue">{guide.description}</p><p className="mt-4 text-xs text-frost">Last reviewed {new Date(guide.updated).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div></header><div className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6">{guide.sections.map((section) => <section key={section.heading}><h2 className="font-display text-3xl font-bold uppercase text-arena-navy">{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 text-lg leading-8 text-neutral-gray">{paragraph}</p>)}{section.bullets && <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-neutral-gray">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}</section>)}<aside className="rounded-xl border border-frost bg-white p-6"><h2 className="font-display text-2xl font-bold uppercase text-arena-navy">Put the guide to work</h2><p className="mt-2 text-neutral-gray">Search the directory, save promising companies, and compare their stated services side by side.</p><Link href="/listings" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-hockey-blue px-5 font-bold text-white">Find hockey advisors</Link></aside></div></article><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /></main>
}
