import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReviewsList } from '@/components/listing/ReviewsList'
import { TrackedContactLink } from '@/components/listing/TrackedContactLink'
import { ProfileViewTracker } from '@/components/listing/ProfileViewTracker'
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Globe,
  Languages,
  Mail,
  MapPin,
  Monitor,
  Phone,
  ShieldCheck,
  Users,
} from 'lucide-react'

export const revalidate = 3600

const siteUrl = 'https://thehockeydirectory.com'

type CompanyProfile = {
  tagline: string | null
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
  price_currency: string | null
  response_time: string | null
  founded_year: number | null
  business_hours: Record<string, string>
  faq: Array<{ question?: string; answer?: string }>
  last_reviewed_at: string | null
  source_label: string | null
  source_url: string | null
}

const profileSelect = `
  tagline, services, specialties, pathways, player_levels, age_groups,
  service_areas, languages, offers_remote, accepting_clients, pricing_models,
  price_min, price_max, price_currency, response_time, founded_year,
  business_hours, faq, last_reviewed_at, source_label, source_url
`

function readableCountry(country: string | null) {
  if (country === 'CA') return 'Canada'
  if (country === 'US') return 'United States'
  return country || ''
}

function formatPrice(profile: CompanyProfile) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: profile.price_currency || 'USD',
    maximumFractionDigits: 0,
  })
  if (profile.price_min !== null && profile.price_max !== null) return `${formatter.format(profile.price_min)}–${formatter.format(profile.price_max)}`
  if (profile.price_min !== null) return `From ${formatter.format(profile.price_min)}`
  if (profile.price_max !== null) return `Up to ${formatter.format(profile.price_max)}`
  return null
}

export async function generateStaticParams() {
  const supabase = createAdminClient()
  const { data: companies } = await supabase.from('companies').select('slug').order('name').limit(100)
  return companies?.map(({ slug }) => ({ slug })) || []
}

interface ListingPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: company } = await supabase
    .from('companies')
    .select('id, name, description, city, state_province, country, logo_url')
    .eq('slug', slug)
    .maybeSingle()

  if (!company) return { title: 'Advisor Not Found', robots: { index: false, follow: false } }

  const { data: profile } = await supabase.from('company_profiles').select('tagline').eq('company_id', company.id).maybeSingle()
  const location = [company.city, company.state_province, readableCountry(company.country)].filter(Boolean).join(', ')
  const description = profile?.tagline || company.description || `Research ${company.name}, a hockey advisory company serving ${location}.`
  const canonical = `/listings/${slug}`

  return {
    title: `${company.name} | Hockey Advisor in ${location}`,
    description: description.slice(0, 160),
    alternates: { canonical },
    openGraph: {
      title: company.name,
      description: description.slice(0, 200),
      url: canonical,
      type: 'website',
      ...(company.logo_url ? { images: [{ url: company.logo_url, alt: `${company.name} logo` }] } : {}),
    },
  }
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: company } = await supabase
    .from('companies')
    .select(`
      id, name, slug, description, logo_url, website_url, email, phone,
      address, city, state_province, country, instagram_url, twitter_url,
      facebook_url, verified, verified_owner_id, verification_date,
      created_at, updated_at
    `)
    .eq('slug', slug)
    .maybeSingle()

  if (!company) notFound()

  const [{ data: rawProfile }, { data: teamMembers }, { data: reviewRatings }] = await Promise.all([
    supabase.from('company_profiles').select(profileSelect).eq('company_id', company.id).maybeSingle(),
    supabase.from('advisors').select('*').eq('company_id', company.id).eq('active', true).order('display_order').order('created_at'),
    supabase.from('reviews').select('rating').eq('company_id', company.id).eq('moderation_status', 'approved'),
  ])

  const profile = rawProfile as CompanyProfile | null
  const countryName = readableCountry(company.country)
  const displayAddress = [company.address, company.city, company.state_province, countryName].filter(Boolean).join(', ')
  const isClaimed = Boolean(company.verified_owner_id)
  const priceSummary = profile ? formatPrice(profile) : null
  const ratings = (reviewRatings || []).map((review) => review.rating).filter((rating): rating is number => typeof rating === 'number')
  const averageRating = ratings.length ? Number((ratings.reduce((total, rating) => total + rating, 0) / ratings.length).toFixed(1)) : null
  const sameAs = [company.website_url, company.instagram_url, company.facebook_url, company.twitter_url].filter((value): value is string => Boolean(value))
  const validFaq = (profile?.faq || []).filter((item) => item.question?.trim() && item.answer?.trim())

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Hockey Advisors', item: `${siteUrl}/listings` },
      { '@type': 'ListItem', position: 3, name: company.name, item: `${siteUrl}/listings/${company.slug}` },
    ],
  }

  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${siteUrl}/listings/${company.slug}#business`,
    name: company.name,
    description: profile?.tagline || company.description || `Hockey advisory services from ${company.name}`,
    url: `${siteUrl}/listings/${company.slug}`,
    ...(company.logo_url ? { image: company.logo_url, logo: company.logo_url } : {}),
    ...(company.phone ? { telephone: company.phone } : {}),
    ...(company.email ? { email: company.email } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(company.address || company.city ? {
      address: {
        '@type': 'PostalAddress',
        ...(company.address ? { streetAddress: company.address } : {}),
        ...(company.city ? { addressLocality: company.city } : {}),
        ...(company.state_province ? { addressRegion: company.state_province } : {}),
        ...(company.country ? { addressCountry: company.country } : {}),
      },
    } : {}),
    areaServed: profile?.service_areas?.length ? profile.service_areas : countryName,
    ...(profile?.services?.length ? { serviceType: profile.services } : {}),
    ...(profile?.languages?.length ? { knowsLanguage: profile.languages } : {}),
    ...(averageRating !== null ? {
      aggregateRating: { '@type': 'AggregateRating', ratingValue: averageRating, reviewCount: ratings.length, bestRating: 5, worstRating: 1 },
    } : {}),
  }

  return (
    <main className="min-h-screen bg-ice-white">
      <ProfileViewTracker companyId={company.id} />
      <div className="border-b border-frost bg-white">
        <nav aria-label="Breadcrumb" className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 text-sm text-neutral-gray sm:px-6 lg:px-8">
          <Link href="/" className="hover:text-hockey-blue">Home</Link><span aria-hidden="true">/</span>
          <Link href="/listings" className="hover:text-hockey-blue">Advisors</Link><span aria-hidden="true">/</span>
          <span className="truncate font-semibold text-arena-navy" aria-current="page">{company.name}</span>
        </nav>
      </div>

      <section className="rink-grid border-b-4 border-red-line bg-arena-navy text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_22rem] lg:px-8 lg:py-14">
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white p-3 shadow-xl">
              {company.logo_url ? <img src={company.logo_url} alt={`${company.name} logo`} className="h-full w-full object-contain" /> : <span className="font-display text-4xl font-bold text-hockey-blue">{company.name.charAt(0)}</span>}
            </div>
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                {isClaimed && <Badge className="gap-1 bg-goal-gold text-arena-navy"><ShieldCheck className="h-4 w-4" />Owner connected</Badge>}
                {company.verified && <Badge className="gap-1 bg-success-green text-white"><BadgeCheck className="h-4 w-4" />Business details verified</Badge>}
                {profile?.accepting_clients === true && <Badge className="gap-1 bg-white text-arena-navy"><CheckCircle2 className="h-4 w-4 text-success-green" />Accepting clients</Badge>}
              </div>
              <h1 className="font-display text-4xl font-extrabold uppercase leading-none sm:text-6xl">{company.name}</h1>
              <p className="mt-4 flex items-start gap-2 text-ice-blue"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-goal-gold" />{displayAddress || 'North America'}</p>
              {profile?.tagline && <p className="mt-4 max-w-3xl text-xl font-semibold leading-8 text-white">{profile.tagline}</p>}
            </div>
          </div>

          <Card className="border-white/15 bg-white text-arena-navy shadow-2xl">
            <CardHeader><CardTitle className="font-display text-2xl uppercase">Contact the company</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {company.phone && <TrackedContactLink companyId={company.id} type="phone" href={`tel:${company.phone}`} className="flex min-h-11 items-center gap-3 hover:text-hockey-blue"><Phone className="h-5 w-5" />{company.phone}</TrackedContactLink>}
              {company.email && <TrackedContactLink companyId={company.id} type="email" href={`mailto:${company.email}`} className="flex min-h-11 items-center gap-3 break-all hover:text-hockey-blue"><Mail className="h-5 w-5" />{company.email}</TrackedContactLink>}
              {company.website_url && <TrackedContactLink companyId={company.id} type="website" href={company.website_url} newWindow className="flex min-h-11 items-center gap-3 hover:text-hockey-blue"><Globe className="h-5 w-5" />Visit website <ExternalLink className="h-4 w-4" /></TrackedContactLink>}
              <Button asChild className="w-full"><Link href={`/listings/${company.slug}/contact`}>Send an inquiry</Link></Button>
              {!isClaimed && <Button asChild variant="outline" className="mt-2 w-full"><Link href={`/claim/${company.slug}`}>Claim this listing</Link></Button>}
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-8">
        <div className="space-y-8">
          <Card>
            <CardHeader><CardTitle className="font-display text-3xl uppercase">About {company.name}</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-line leading-7 text-neutral-gray">{company.description || 'This listing has not added a detailed company description yet.'}</p></CardContent>
          </Card>

          {profile && (profile.services.length > 0 || profile.specialties.length > 0 || profile.pathways.length > 0) && (
            <Card>
              <CardHeader><CardTitle className="font-display text-3xl uppercase">Services and hockey experience</CardTitle></CardHeader>
              <CardContent className="grid gap-7 md:grid-cols-2">
                <TagGroup title="Services" values={profile.services} />
                <TagGroup title="Specialties" values={profile.specialties} />
                <TagGroup title="Pathways" values={profile.pathways} />
                <TagGroup title="Player levels" values={profile.player_levels} />
                <TagGroup title="Age groups" values={profile.age_groups} />
                <TagGroup title="Service areas" values={profile.service_areas} />
              </CardContent>
            </Card>
          )}

          {teamMembers && teamMembers.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="font-display text-3xl uppercase">People behind the company</CardTitle></CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                {teamMembers.map((member) => (
                  <article key={member.id} className="flex gap-4 rounded-xl border border-frost bg-ice-white p-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ice-blue font-display text-2xl font-bold text-hockey-blue">
                      {member.profile_image_url ? <img src={member.profile_image_url} alt={`${member.name} portrait`} className="h-full w-full object-cover" /> : member.name?.charAt(0)}
                    </div>
                    <div><h3 className="font-bold text-arena-navy">{member.name}</h3>{member.title && <p className="text-sm text-hockey-blue">{member.title}</p>}{member.bio && <p className="mt-2 line-clamp-4 text-sm leading-6 text-neutral-gray">{member.bio}</p>}</div>
                  </article>
                ))}
              </CardContent>
            </Card>
          )}

          {validFaq.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="font-display text-3xl uppercase">Common questions</CardTitle></CardHeader>
              <CardContent className="divide-y divide-frost">
                {validFaq.map((item) => <details key={item.question} className="group py-4"><summary className="cursor-pointer font-bold text-arena-navy">{item.question}</summary><p className="mt-3 leading-7 text-neutral-gray">{item.answer}</p></details>)}
              </CardContent>
            </Card>
          )}

          <Card id="reviews">
            <CardHeader><CardTitle className="font-display text-3xl uppercase">Reviews of {company.name}</CardTitle></CardHeader>
            <CardContent><ReviewsList companyId={company.id} companySlug={company.slug} /></CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card><CardHeader><CardTitle className="font-display text-xl uppercase">At a glance</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
            {profile?.offers_remote && <InfoRow icon={Monitor} label="Remote consultations available" />}
            {profile?.response_time && <InfoRow icon={CalendarClock} label={`Typical response: ${profile.response_time}`} />}
            {profile?.languages?.length ? <InfoRow icon={Languages} label={profile.languages.join(', ')} /> : null}
            {profile?.founded_year && <InfoRow icon={Users} label={`Founded in ${profile.founded_year}`} />}
            {priceSummary && <p className="rounded-lg bg-ice-blue p-3 font-bold text-board-blue">Typical pricing: {priceSummary}</p>}
            {profile?.pricing_models?.length ? <TagGroup title="Pricing models" values={profile.pricing_models} compact /> : null}
          </CardContent></Card>

          <Card><CardContent className="pt-6 text-sm leading-6 text-neutral-gray">
            <p className="font-bold text-arena-navy">Trust note</p>
            <p className="mt-2">A connected or verified badge confirms directory information or an owner relationship. It is not an endorsement. Families should still interview advisors and check references.</p>
            {profile?.last_reviewed_at && <p className="mt-3 text-xs">Listing reviewed {new Date(profile.last_reviewed_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>}
          </CardContent></Card>
        </aside>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumbSchema, businessSchema, ...(validFaq.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: validFaq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) }] : [])]) }} />
    </main>
  )
}

function TagGroup({ title, values, compact = false }: { title: string; values: string[]; compact?: boolean }) {
  if (!values.length) return null
  return <div><h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-arena-navy">{title}</h3><div className="flex flex-wrap gap-2">{values.map((value) => <span key={value} className={`rounded-full bg-ice-blue font-semibold text-board-blue ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}`}>{value}</span>)}</div></div>
}

function InfoRow({ icon: Icon, label }: { icon: typeof Globe; label: string }) {
  return <p className="flex items-start gap-3 text-neutral-gray"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-hockey-blue" aria-hidden="true" /><span>{label}</span></p>
}
