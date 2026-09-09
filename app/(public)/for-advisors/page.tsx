import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BarChart3, Check, Megaphone, ShieldCheck } from 'lucide-react'
import { AdvisorInterestForm } from '@/components/forms/AdvisorInterestForm'

export const metadata: Metadata = {
  title: 'For Hockey Advisors',
  description: 'Learn how hockey advisory businesses can claim, improve, and measure their listing in The Hockey Directory.',
  alternates: { canonical: '/for-advisors' },
}

const faqs = [
  {
    question: 'Does a verified badge mean The Hockey Directory endorses my business?',
    answer: 'No. Verification confirms your relationship to the listed business so you can maintain its information. It is not an endorsement or professional credential.',
  },
  {
    question: 'Can payment improve my rating or hide a review?',
    answer: 'No. Commercial products will remain separate from verification, review moderation, and review scores.',
  },
  {
    question: 'Are premium plans available now?',
    answer: 'No paid plan or checkout is currently active. We are validating which optional business tools would provide enough value before setting prices.',
  },
]

export default function ForAdvisorsPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  return (
    <main className="bg-ice-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="rink-grid bg-arena-navy py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="font-display text-sm font-bold uppercase tracking-[0.22em] text-goal-gold">For advisory businesses</p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl">Make a clearer first impression with hockey families</h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-frost">Claim your business listing, keep important details current, and understand how families engage with your profile.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/listings" className="inline-flex items-center justify-center rounded-md bg-goal-gold px-6 py-3 font-bold text-arena-navy hover:bg-yellow-300">Find your listing <ArrowRight className="ml-2 h-4 w-4" /></Link>
            <Link href="/login" className="inline-flex items-center justify-center rounded-md border border-white/40 px-6 py-3 font-bold hover:bg-white/10">Advisor sign in</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: 'Manage trusted details', copy: 'Verified owners can maintain services, specialties, pathways, locations, languages, pricing context, availability, and common questions.' },
            { icon: BarChart3, title: 'Understand interest', copy: 'Private lead and engagement views help a verified owner see inquiries and consent-based profile activity.' },
            { icon: Megaphone, title: 'Earn visibility clearly', copy: 'Any future sponsored placement will be visibly labelled and will never change verification or review scores.' },
          ].map(({ icon: Icon, title, copy }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <Icon className="h-8 w-8 text-red-line" />
              <h2 className="mt-5 font-display text-2xl font-extrabold uppercase text-arena-navy">{title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{copy}</p>
            </article>
          ))}
        </div>

        <section className="mt-16 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
          <div className="border-b border-blue-200 bg-blue-50 px-6 py-5 sm:px-8">
            <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-hockey-blue">Current access</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold uppercase text-arena-navy">Core listing tools</h2>
          </div>
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="text-lg leading-8 text-slate-700">The directory’s core claim and profile-management tools are designed to create better information for families.</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {['Claim review process', 'Rich business profile', 'Services and pathway details', 'Private inquiry inbox', 'Published review view', 'Consent-aware engagement totals'].map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-slate-700"><Check className="h-5 w-5 shrink-0 text-green-600" />{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-arena-navy p-6 text-white">
              <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-goal-gold">Paid products</p>
              <h3 className="mt-2 font-display text-2xl font-extrabold uppercase">Not currently for sale</h3>
              <p className="mt-3 text-sm leading-6 text-frost">Profile upgrades, sponsored positions, and enhanced analytics are being evaluated. No price or benefit is being promised before the offer is tested with advisors.</p>
              <p className="mt-4 text-xs leading-5 text-slate-300">This keeps the directory honest: payment cannot buy verification, a better rating, or review removal.</p>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-hockey-blue">Shape the offer</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold uppercase text-arena-navy">Tell us what would earn your budget</h2>
            <p className="mt-5 leading-7 text-slate-600">We are testing demand before setting prices. Share what would create real value for your business, without buying anything or changing how the directory ranks and verifies listings.</p>
          </div>
          <AdvisorInterestForm />
        </section>

        <section className="mt-16">
          <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-hockey-blue">Questions</p>
          <h2 className="mt-2 font-display text-4xl font-extrabold uppercase text-arena-navy">Clear commercial rules</h2>
          <div className="mt-7 space-y-4">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-xl border border-slate-200 bg-white p-5">
                <summary className="cursor-pointer list-none font-bold text-arena-navy">{faq.question}</summary>
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
