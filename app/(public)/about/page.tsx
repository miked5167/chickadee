import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, ShieldCheck, Search, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About The Hockey Directory',
  description: 'Why The Hockey Directory exists, how listing verification works, and what hockey families should confirm for themselves.',
  alternates: { canonical: '/about' },
}

const principles = [
  {
    icon: Search,
    title: 'Make research easier',
    copy: 'Bring useful business details, services, locations, pathways, and contact options into one searchable place.',
  },
  {
    icon: ShieldCheck,
    title: 'Explain trust signals',
    copy: 'A verified badge confirms the business relationship to a listing. It is not an endorsement or a promise about service quality.',
  },
  {
    icon: Users,
    title: 'Keep families in control',
    copy: 'Comparison tools and practical guides help families prepare better questions before choosing an advisor.',
  },
]

export default function AboutPage() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'The Hockey Directory',
    url: 'https://thehockeydirectory.com',
    description: 'An independent research directory for hockey families looking for advisor information.',
  }

  return (
    <main className="bg-ice-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />

      <section className="rink-grid overflow-hidden bg-arena-navy py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="font-display text-sm font-bold uppercase tracking-[0.22em] text-goal-gold">Our purpose</p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl">
            Better information before a big hockey decision
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-frost">
            The Hockey Directory was created after one family saw how difficult it could be to find, compare, and evaluate hockey advisors. We are building an independent starting point for that research.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-hockey-blue">Why it exists</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold uppercase tracking-tight text-arena-navy">A practical research tool, not a recommendation service</h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-slate-700">
              <p>
                Hockey families often make important decisions with scattered information and limited time. The directory puts basic business information, specialties, service areas, pathway experience, reviews, and contact options in one place.
              </p>
              <p>
                We do not choose an advisor for a family, certify professional ability, or guarantee an outcome. Families should interview more than one provider, confirm current credentials and fees directly, check references, and use independent legal or financial advice when appropriate.
              </p>
              <p>
                Some listings begin with public business information and may be incomplete or unclaimed. Verified owners can keep their own details current. Reviews are displayed only when they meet the directory’s publishing rules.
              </p>
            </div>
          </div>

          <aside className="rounded-2xl border border-blue-200 bg-white p-7 shadow-sm">
            <h2 className="font-display text-2xl font-extrabold uppercase text-arena-navy">What verification means</h2>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-700">
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-hockey-blue" />The account’s relationship to the listed business has been confirmed.</li>
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-hockey-blue" />The verified owner can maintain the listing’s business details.</li>
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-hockey-blue" />It does not rank, recommend, license, or guarantee the advisor.</li>
            </ul>
          </aside>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {principles.map(({ icon: Icon, title, copy }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <Icon className="h-8 w-8 text-red-line" />
              <h2 className="mt-5 font-display text-2xl font-extrabold uppercase text-arena-navy">{title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{copy}</p>
            </article>
          ))}
        </div>

        <section className="mt-16 rounded-2xl bg-hockey-blue p-8 text-white sm:p-10">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-extrabold uppercase">Start with facts, then have the conversation</h2>
              <p className="mt-3 max-w-2xl leading-7 text-blue-100">Browse the directory or use the family guides to prepare questions before contacting anyone.</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link href="/listings" className="inline-flex items-center justify-center rounded-md bg-goal-gold px-5 py-3 font-bold text-arena-navy hover:bg-yellow-300">Browse advisors <ArrowRight className="ml-2 h-4 w-4" /></Link>
              <Link href="/guides" className="inline-flex items-center justify-center rounded-md border border-white/40 px-5 py-3 font-bold hover:bg-white/10">Read family guides</Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}
