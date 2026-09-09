import type { Metadata } from 'next'
import { SavedListings } from '@/components/listing/SavedListings'

export const metadata: Metadata = {
  title: 'Saved Hockey Advisor Listings',
  description: 'Review the hockey advisor companies saved on this device.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/saved' },
}

export default function SavedPage() {
  return <main className="min-h-screen bg-ice-white"><section className="rink-grid border-b-4 border-red-line bg-arena-navy text-white"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-goal-gold">Your research</p><h1 className="font-display text-5xl font-extrabold uppercase">Saved listings</h1><p className="mt-3 text-ice-blue">Saved only in this browser. No account is required.</p></div></section><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><SavedListings /></div></main>
}
