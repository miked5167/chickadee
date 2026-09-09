'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type CompanyForm = {
  name: string
  description: string
  website_url: string
  phone: string
  email: string
  address: string
  city: string
  state_province: string
  country: 'CA' | 'US'
  facebook_url: string
  instagram_url: string
  twitter_url: string
  logo_url: string
}

type ProfileForm = {
  tagline: string
  services: string[]
  specialties: string[]
  pathways: string[]
  player_levels: string[]
  age_groups: string[]
  service_areas: string[]
  languages: string[]
  offers_remote: boolean
  accepting_clients: boolean | null
  pricing_models: string[]
  price_min: number | null
  price_max: number | null
  price_currency: 'CAD' | 'USD'
  response_time: string
  founded_year: number | null
  faq: Array<{ question: string; answer: string }>
}

const emptyCompany: CompanyForm = {
  name: '', description: '', website_url: '', phone: '', email: '', address: '', city: '',
  state_province: '', country: 'CA', facebook_url: '', instagram_url: '', twitter_url: '', logo_url: '',
}

const emptyProfile: ProfileForm = {
  tagline: '', services: [], specialties: [], pathways: [], player_levels: [], age_groups: [],
  service_areas: [], languages: [], offers_remote: false, accepting_clients: null,
  pricing_models: [], price_min: null, price_max: null, price_currency: 'CAD',
  response_time: '', founded_year: null, faq: [],
}

function cleanNullable(value: string) {
  const trimmed = value.trim()
  return trimmed || null
}

function ListField({ id, label, value, onChange, help }: { id: string; label: string; value: string[]; onChange: (value: string[]) => void; help: string }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} value={value.join(', ')} onChange={(event) => onChange(event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} /><p className="text-xs leading-5 text-neutral-gray">{help} Separate entries with commas.</p></div>
}

export default function EditProfilePage() {
  const router = useRouter()
  const [company, setCompany] = useState<CompanyForm>(emptyCompany)
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile)
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [initialSnapshot, setInitialSnapshot] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/advisor/profile', { cache: 'no-store' })
        if (response.status === 401) {
          router.push('/login?returnTo=/dashboard/edit')
          return
        }
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'The profile could not be loaded.')

        const nextCompany: CompanyForm = { ...emptyCompany, ...Object.fromEntries(Object.entries(data.company).map(([key, value]) => [key, value ?? ''])) }
        const nextProfile: ProfileForm = { ...emptyProfile, ...(data.profile || {}) }
        setCompany(nextCompany)
        setProfile(nextProfile)
        setSlug(data.company.slug)
        setInitialSnapshot(JSON.stringify({ company: nextCompany, profile: nextProfile }))
      } catch (error) {
        setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'The profile could not be loaded.' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const currentSnapshot = useMemo(() => JSON.stringify({ company, profile }), [company, profile])
  const hasChanges = Boolean(initialSnapshot) && currentSnapshot !== initialSnapshot
  const completedFields = [company.name, company.description, company.email, company.city, profile.tagline, profile.services.length, profile.specialties.length, profile.service_areas.length, profile.accepting_clients !== null].filter(Boolean).length
  const completion = Math.round((completedFields / 9) * 100)

  async function save(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    setSaving(true)
    try {
      const response = await fetch('/api/advisor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: Object.fromEntries(Object.entries(company).map(([key, value]) => [key, typeof value === 'string' && key !== 'name' && key !== 'country' ? cleanNullable(value) : value])),
          profile: {
            ...profile,
            tagline: cleanNullable(profile.tagline),
            response_time: cleanNullable(profile.response_time),
            price_currency: profile.price_min === null && profile.price_max === null ? null : profile.price_currency,
            business_hours: {},
            faq: profile.faq.filter((item) => item.question.trim() && item.answer.trim()),
          },
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'The profile could not be saved.')
      const nextCompany = { ...emptyCompany, ...Object.fromEntries(Object.entries(data.company).map(([key, value]) => [key, value ?? ''])) }
      const nextProfile = { ...emptyProfile, ...data.profile }
      setCompany(nextCompany)
      setProfile(nextProfile)
      setSlug(data.company.slug)
      setInitialSnapshot(JSON.stringify({ company: nextCompany, profile: nextProfile }))
      setMessage({ kind: 'success', text: 'Your directory profile was saved.' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'The profile could not be saved.' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-hockey-blue" aria-label="Loading profile" /></div>

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-hockey-blue">Owner dashboard</p><h1 className="font-display text-4xl font-extrabold uppercase text-arena-navy">Edit company profile</h1><p className="mt-2 text-neutral-gray">Give hockey families enough detail to decide whether to contact you.</p></div>
        {slug && <Button asChild variant="outline"><Link href={`/listings/${slug}`} target="_blank">View public profile <ExternalLink className="ml-2 h-4 w-4" /></Link></Button>}
      </div>

      <div className="mb-6 rounded-xl border border-frost bg-white p-5">
        <div className="mb-2 flex justify-between text-sm font-bold text-arena-navy"><span>Useful profile information</span><span>{completion}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-ice-blue"><div className="h-full bg-success-green transition-all" style={{ width: `${completion}%` }} /></div>
        <p className="mt-2 text-xs text-neutral-gray">This measures useful information, not quality or endorsement.</p>
      </div>

      {message && <div role={message.kind === 'error' ? 'alert' : 'status'} className={`mb-6 flex gap-3 rounded-xl border p-4 ${message.kind === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}>{message.kind === 'error' ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}<span>{message.text}</span></div>}

      <form onSubmit={save} className="space-y-8">
        <Card><CardHeader><CardTitle>Company basics</CardTitle><CardDescription>The public identity and introduction for your listing.</CardDescription></CardHeader><CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2"><Label htmlFor="name">Company name</Label><Input id="name" required minLength={2} value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} /></div>
          <div className="space-y-2 md:col-span-2"><Label htmlFor="tagline">Short summary</Label><Input id="tagline" minLength={10} maxLength={160} value={profile.tagline} onChange={(e) => setProfile({ ...profile, tagline: e.target.value })} placeholder="Independent guidance for junior and college hockey pathways" /><p className="text-xs text-neutral-gray">10–160 characters. Keep this factual and specific.</p></div>
          <div className="space-y-2 md:col-span-2"><Label htmlFor="description">About the company</Label><Textarea id="description" rows={8} maxLength={4000} value={company.description} onChange={(e) => setCompany({ ...company, description: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="founded">Founded year</Label><Input id="founded" type="number" min={1900} max={2100} value={profile.founded_year ?? ''} onChange={(e) => setProfile({ ...profile, founded_year: e.target.value ? Number(e.target.value) : null })} /></div>
          <div className="space-y-2"><Label htmlFor="logo">Logo URL</Label><Input id="logo" type="url" value={company.logo_url} onChange={(e) => setCompany({ ...company, logo_url: e.target.value })} /></div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Contact and location</CardTitle><CardDescription>Only publish contact information you want families to use.</CardDescription></CardHeader><CardContent className="grid gap-5 md:grid-cols-2">
          {(['email', 'phone', 'website_url', 'address', 'city', 'state_province'] as const).map((field) => <div key={field} className="space-y-2"><Label htmlFor={field}>{field.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())}</Label><Input id={field} type={field === 'email' ? 'email' : field === 'website_url' ? 'url' : 'text'} value={company[field]} onChange={(e) => setCompany({ ...company, [field]: e.target.value })} /></div>)}
          <div className="space-y-2"><Label htmlFor="country">Country</Label><select id="country" value={company.country} onChange={(e) => setCompany({ ...company, country: e.target.value as 'CA' | 'US' })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="CA">Canada</option><option value="US">United States</option></select></div>
          <ListField id="service-areas" label="Areas served" value={profile.service_areas} onChange={(service_areas) => setProfile({ ...profile, service_areas })} help="Examples: Ontario, Northeast US, North America" />
          <div className="space-y-2"><Label htmlFor="response">Typical response time</Label><Input id="response" value={profile.response_time} onChange={(e) => setProfile({ ...profile, response_time: e.target.value })} placeholder="Within 2 business days" /></div>
          <ListField id="languages" label="Languages" value={profile.languages} onChange={(languages) => setProfile({ ...profile, languages })} help="Examples: English, French" />
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Hockey services and fit</CardTitle><CardDescription>Specific fields make your listing more useful and power the directory filters.</CardDescription></CardHeader><CardContent className="grid gap-5 md:grid-cols-2">
          <ListField id="services" label="Services" value={profile.services} onChange={(services) => setProfile({ ...profile, services })} help="Examples: Player Assessment, College Recruiting, Contract Guidance" />
          <ListField id="specialties" label="Specialties" value={profile.specialties} onChange={(specialties) => setProfile({ ...profile, specialties })} help="Examples: Female Hockey, Goaltenders, NCAA Division I" />
          <ListField id="pathways" label="Hockey pathways" value={profile.pathways} onChange={(pathways) => setProfile({ ...profile, pathways })} help="Examples: Prep School, Junior Hockey, NCAA, U SPORTS" />
          <ListField id="levels" label="Player levels" value={profile.player_levels} onChange={(player_levels) => setProfile({ ...profile, player_levels })} help="Examples: AAA, Prep, Junior, College, Professional" />
          <ListField id="ages" label="Age groups" value={profile.age_groups} onChange={(age_groups) => setProfile({ ...profile, age_groups })} help="Examples: U14, U16, U18, 18+" />
          <div className="space-y-3 rounded-xl border border-frost p-4"><label className="flex min-h-11 items-center gap-3 font-semibold"><input type="checkbox" className="h-5 w-5" checked={profile.offers_remote} onChange={(e) => setProfile({ ...profile, offers_remote: e.target.checked })} />Remote consultations available</label><Label htmlFor="availability">New client availability</Label><select id="availability" value={profile.accepting_clients === null ? 'unknown' : String(profile.accepting_clients)} onChange={(e) => setProfile({ ...profile, accepting_clients: e.target.value === 'unknown' ? null : e.target.value === 'true' })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="unknown">Not stated</option><option value="true">Accepting new clients</option><option value="false">Not currently accepting</option></select></div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Pricing approach</CardTitle><CardDescription>Transparent ranges help families qualify fit before contacting you. Leave blank if you do not publish prices.</CardDescription></CardHeader><CardContent className="grid gap-5 md:grid-cols-3">
          <div className="space-y-2"><Label htmlFor="price-min">Typical minimum</Label><Input id="price-min" type="number" min={0} value={profile.price_min ?? ''} onChange={(e) => setProfile({ ...profile, price_min: e.target.value ? Number(e.target.value) : null })} /></div>
          <div className="space-y-2"><Label htmlFor="price-max">Typical maximum</Label><Input id="price-max" type="number" min={0} value={profile.price_max ?? ''} onChange={(e) => setProfile({ ...profile, price_max: e.target.value ? Number(e.target.value) : null })} /></div>
          <div className="space-y-2"><Label htmlFor="currency">Currency</Label><select id="currency" value={profile.price_currency} onChange={(e) => setProfile({ ...profile, price_currency: e.target.value as 'CAD' | 'USD' })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="CAD">CAD</option><option value="USD">USD</option></select></div>
          <div className="md:col-span-3"><ListField id="pricing-models" label="Pricing models" value={profile.pricing_models} onChange={(pricing_models) => setProfile({ ...profile, pricing_models })} help="Examples: one-time, season-long, hourly, retainer, free-consultation" /></div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Frequently asked questions</CardTitle><CardDescription>Answer common questions in your own words. These can also appear in search-friendly structured data.</CardDescription></CardHeader><CardContent className="space-y-5">
          {profile.faq.map((item, index) => <div key={index} className="rounded-xl border border-frost p-4"><div className="mb-3 flex justify-between gap-3"><p className="font-bold text-arena-navy">Question {index + 1}</p><Button type="button" variant="ghost" size="sm" onClick={() => setProfile({ ...profile, faq: profile.faq.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Remove question ${index + 1}`}><Trash2 className="h-4 w-4" /></Button></div><div className="space-y-3"><Input aria-label={`Question ${index + 1}`} value={item.question} maxLength={200} onChange={(e) => setProfile({ ...profile, faq: profile.faq.map((entry, itemIndex) => itemIndex === index ? { ...entry, question: e.target.value } : entry) })} placeholder="What kinds of players do you work with?" /><Textarea aria-label={`Answer ${index + 1}`} value={item.answer} maxLength={1000} onChange={(e) => setProfile({ ...profile, faq: profile.faq.map((entry, itemIndex) => itemIndex === index ? { ...entry, answer: e.target.value } : entry) })} placeholder="Write a clear, factual answer." /></div></div>)}
          {profile.faq.length < 12 && <Button type="button" variant="outline" onClick={() => setProfile({ ...profile, faq: [...profile.faq, { question: '', answer: '' }] })}><Plus className="mr-2 h-4 w-4" />Add a question</Button>}
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Social profiles</CardTitle></CardHeader><CardContent className="grid gap-5 md:grid-cols-3">{(['facebook_url', 'instagram_url', 'twitter_url'] as const).map((field) => <div key={field} className="space-y-2"><Label htmlFor={field}>{field.replace('_url', '').replace(/^./, (letter) => letter.toUpperCase())}</Label><Input id={field} type="url" value={company[field]} onChange={(e) => setCompany({ ...company, [field]: e.target.value })} /></div>)}</CardContent></Card>

        <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-xl border border-frost bg-white/95 p-4 shadow-xl backdrop-blur"><p className="text-sm text-neutral-gray">{hasChanges ? 'You have unsaved changes.' : 'Everything shown here is saved.'}</p><Button type="submit" size="lg" disabled={saving || !hasChanges}>{saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}{saving ? 'Saving…' : 'Save profile'}</Button></div>
      </form>
    </main>
  )
}
