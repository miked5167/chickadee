import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Compare Hockey Advisor Companies', robots: { index: false, follow: true }, alternates: { canonical: '/compare' } }

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids: rawIds } = await searchParams
  const ids = (rawIds || '').split(',').filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)).slice(0, 3)
  const supabase = await createClient()
  const [{ data: companies }, { data: profiles }] = ids.length ? await Promise.all([
    supabase.from('companies').select('id, slug, name, city, state_province, country, verified, verified_owner_id, website_url').in('id', ids),
    supabase.from('company_profiles').select('*').in('company_id', ids),
  ]) : [{ data: [] }, { data: [] }]
  const profileMap = new Map((profiles || []).map((profile) => [profile.company_id, profile]))
  const ordered = ids.map((id) => companies?.find((company) => company.id === id)).filter((company): company is NonNullable<typeof company> => Boolean(company))
  const rows = [
    { label: 'Location', value: (company: typeof ordered[number]) => [company.city, company.state_province, company.country].filter(Boolean).join(', ') || 'Not stated' },
    { label: 'Owner connected', value: (company: typeof ordered[number]) => company.verified_owner_id ? 'Yes' : 'No' },
    { label: 'Details verified', value: (company: typeof ordered[number]) => company.verified ? 'Yes' : 'No' },
    { label: 'Services', value: (company: typeof ordered[number]) => profileMap.get(company.id)?.services?.join(', ') || 'Not stated' },
    { label: 'Specialties', value: (company: typeof ordered[number]) => profileMap.get(company.id)?.specialties?.join(', ') || 'Not stated' },
    { label: 'Pathways', value: (company: typeof ordered[number]) => profileMap.get(company.id)?.pathways?.join(', ') || 'Not stated' },
    { label: 'Player levels', value: (company: typeof ordered[number]) => profileMap.get(company.id)?.player_levels?.join(', ') || 'Not stated' },
    { label: 'Remote available', value: (company: typeof ordered[number]) => profileMap.get(company.id)?.offers_remote ? 'Yes' : 'No / not stated' },
    { label: 'Accepting clients', value: (company: typeof ordered[number]) => profileMap.get(company.id)?.accepting_clients === true ? 'Yes' : profileMap.get(company.id)?.accepting_clients === false ? 'No' : 'Not stated' },
    { label: 'Languages', value: (company: typeof ordered[number]) => profileMap.get(company.id)?.languages?.join(', ') || 'Not stated' },
    { label: 'Pricing models', value: (company: typeof ordered[number]) => profileMap.get(company.id)?.pricing_models?.join(', ') || 'Not stated' },
  ]
  return <main className="min-h-screen bg-ice-white"><section className="rink-grid border-b-4 border-red-line bg-arena-navy text-white"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-goal-gold">Side-by-side research</p><h1 className="font-display text-5xl font-extrabold uppercase">Compare companies</h1><p className="mt-3 text-ice-blue">Compare facts, then interview companies and check references before deciding.</p></div></section><div className="mx-auto max-w-7xl overflow-x-auto px-4 py-10 sm:px-6 lg:px-8">{ordered.length < 2 ? <div className="rounded-xl border border-frost bg-white p-12 text-center"><h2 className="font-display text-2xl font-bold uppercase text-arena-navy">Select at least two companies</h2><p className="mt-2 text-neutral-gray">Use the Compare button on directory cards.</p><Button asChild className="mt-6"><Link href="/listings">Browse advisors</Link></Button></div> : <table className="w-full min-w-[760px] overflow-hidden rounded-xl bg-white text-left shadow-sm"><thead><tr className="bg-arena-navy text-white"><th className="p-4">Information</th>{ordered.map((company) => <th key={company.id} className="p-4"><Link href={`/listings/${company.slug}`} className="font-display text-xl uppercase hover:text-goal-gold">{company.name}</Link></th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.label} className={index % 2 ? 'bg-ice-white' : ''}><th scope="row" className="w-44 p-4 text-sm font-bold text-arena-navy">{row.label}</th>{ordered.map((company) => <td key={company.id} className="p-4 align-top text-sm leading-6 text-neutral-gray">{row.value(company)}</td>)}</tr>)}</tbody></table>}</div></main>
}
