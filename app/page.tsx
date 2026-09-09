import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  ClipboardCheck,
  MapPinned,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'
import { FeaturedListings } from '@/components/listing/FeaturedListings'

export const metadata: Metadata = {
  title: 'Find Hockey Advisors in Canada and the United States',
  description:
    'Research more than 200 hockey advisors and agencies. Search by name or location, review company details, and contact advisors directly.',
  alternates: { canonical: '/' },
}

const directoryFacts = [
  { value: '202', label: 'company listings', icon: Building2 },
  { value: '177', label: 'advisor profiles', icon: Users },
  { value: '2', label: 'countries covered', icon: MapPinned },
  { value: 'Free', label: 'for hockey families', icon: ShieldCheck },
]

const reasons = [
  {
    title: 'Understand the pathways',
    copy: 'Compare advice around AAA, academy, junior, prep school, NCAA, U SPORTS, and professional routes before a decision closes future options.',
    icon: MapPinned,
  },
  {
    title: 'Check the fit',
    copy: 'Look at an advisor’s location, team, experience, specialties, and contact details before you invest time in a first conversation.',
    icon: ClipboardCheck,
  },
  {
    title: 'Ask better questions',
    copy: 'Use the directory and hockey glossary to understand the language, costs, expectations, and tradeoffs behind each recommendation.',
    icon: BookOpenCheck,
  },
]

export default function HomePage() {
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'The Hockey Directory',
      url: 'https://thehockeydirectory.com',
      description: 'An independent directory of hockey advisors across Canada and the United States.',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://thehockeydirectory.com/listings?search={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'The Hockey Directory',
      url: 'https://thehockeydirectory.com',
      logo: 'https://thehockeydirectory.com/hockey-directory-logo-v7.png',
      description: 'An independent directory helping hockey families research advisors and player pathways.',
    },
  ]

  return (
    <>
      {structuredData.map((item) => (
        <script
          key={item['@type']}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}

      <section className="relative isolate min-h-[660px] overflow-hidden bg-arena-navy text-white lg:min-h-[720px]">
        <Image
          src="/hockey-directory-hero-v1.png"
          alt="A hockey family and advisor discussing player pathways beside the rink"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,27,51,0.98)_0%,rgba(8,27,51,0.93)_35%,rgba(8,27,51,0.48)_68%,rgba(8,27,51,0.12)_100%)]" />
        <div className="rink-grid absolute inset-0 opacity-50" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-red-line" />

        <div className="relative mx-auto flex min-h-[660px] max-w-7xl flex-col justify-center px-4 pb-12 pt-16 sm:px-6 lg:min-h-[720px] lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-ice-blue backdrop-blur-sm">
              <BadgeCheck className="h-4 w-4 text-goal-gold" />
              Independent hockey advisor directory
            </p>
            <h1 className="font-display max-w-3xl text-5xl font-extrabold uppercase leading-[0.92] tracking-[-0.025em] text-white sm:text-6xl lg:text-8xl">
              Find the right voice for your player’s{' '}
              <span className="text-goal-gold">next move.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ice-blue sm:text-xl">
              Research hockey advisors and agencies across Canada and the United States. Start with the facts, build a shortlist, and make a more informed first call.
            </p>
          </div>

          <div className="mt-9 max-w-5xl rounded-xl border border-white/20 bg-arena-navy/80 p-3 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-4">
            <SearchBar />
          </div>
        </div>
      </section>

      <section aria-label="Directory facts" className="border-b border-frost bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-frost px-4 sm:px-6 md:grid-cols-4 md:divide-y-0 lg:px-8">
          {directoryFacts.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex min-h-28 items-center gap-3 px-3 py-6 sm:px-6">
              <Icon className="h-6 w-6 shrink-0 text-hockey-blue" aria-hidden="true" />
              <div>
                <p className="font-display text-3xl font-extrabold uppercase leading-none text-arena-navy">{value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-neutral-gray">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <FeaturedListings />

      <section className="bg-ice-blue py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-line">The decision room</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold uppercase leading-none text-arena-navy sm:text-6xl">
              Better information before the next hockey decision.
            </h2>
            <p className="mt-5 text-lg leading-8 text-neutral-gray">
              An advisor can help, but the relationship still needs to fit your player, family, goals, and budget. The directory gives you a consistent place to begin that research.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {reasons.map(({ title, copy, icon: Icon }) => (
              <article key={title} className="red-line-rule rounded-r-xl border border-frost bg-white p-7 pl-8 shadow-sm">
                <Icon className="h-8 w-8 text-hockey-blue" aria-hidden="true" />
                <h3 className="mt-5 font-display text-2xl font-bold uppercase text-arena-navy">{title}</h3>
                <p className="mt-3 leading-7 text-neutral-gray">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="lg:sticky lg:top-32">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-line">How it works</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold uppercase leading-none text-arena-navy sm:text-6xl">
                From search to first conversation.
              </h2>
              <Link href="/listings" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-md bg-hockey-blue px-6 py-3 font-bold text-white transition-colors hover:bg-board-blue">
                Search the directory <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <ol className="space-y-4">
              {[
                ['Search', 'Start with a company name, city, state, or province. Use filters to narrow the directory.'],
                ['Research', 'Read the listing details, look at the people behind the company, and check what information has been verified.'],
                ['Connect', 'Contact the advisor directly and ask specific questions about fit, fees, conflicts, communication, and expectations.'],
              ].map(([title, copy], index) => (
                <li key={title} className="grid grid-cols-[3.5rem_1fr] gap-5 rounded-xl border border-frost bg-ice-white p-6 sm:grid-cols-[5rem_1fr] sm:p-8">
                  <span className="font-display text-4xl font-extrabold text-slate-500 sm:text-6xl" aria-hidden="true">0{index + 1}</span>
                  <div>
                    <h3 className="font-display text-3xl font-bold uppercase text-arena-navy">{title}</h3>
                    <p className="mt-2 leading-7 text-neutral-gray">{copy}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="rink-grid border-y border-white/10 bg-arena-navy py-16 text-white sm:py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-goal-gold">For hockey advisors</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold uppercase leading-none sm:text-5xl">Your company may already be listed.</h2>
            <p className="mt-4 text-lg leading-8 text-frost">Find your profile, confirm the details, and begin the listing claim process.</p>
          </div>
          <Link href="/listings" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-goal-gold px-7 py-3 font-extrabold text-arena-navy transition-colors hover:bg-white">
            Find your company <Search className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
