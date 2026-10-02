import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createPublicClient } from '@supabase/supabase-js'
import { AdvisorProfile, type CompanyProfile } from '@/components/listing/AdvisorProfile'
import { ProfileViewTracker } from '@/components/listing/ProfileViewTracker'
import { getCompanyLogo } from '@/lib/branding/company-logos'
import { getLocalCompanyResearch } from '@/lib/research/company-research.server'
import type { EliteProspectsMeasurement } from '@/lib/research/elite-prospects'

export const revalidate = 3600

const siteUrl = 'https://thehockeydirectory.com'

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

export async function generateStaticParams() {
  const supabase = createPublicClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
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
    .select('id, name, slug, website_url, description, city, state_province, country, logo_url')
    .eq('slug', slug)
    .maybeSingle()

  if (!company) return { title: 'Advisor Not Found', robots: { index: false, follow: false } }

  const { data: profile } = await supabase.from('company_profiles').select('tagline').eq('company_id', company.id).maybeSingle()
  const location = [company.city, company.state_province, readableCountry(company.country)].filter(Boolean).join(', ')
  const description = profile?.tagline || company.description || `Research ${company.name}, a hockey advisory company serving ${location}.`
  const canonical = `/listings/${slug}`
  const logo = getCompanyLogo(company)

  return {
    title: `${company.name} | Hockey Advisor in ${location}`,
    description: description.slice(0, 160),
    alternates: { canonical },
    openGraph: {
      title: company.name,
      description: description.slice(0, 200),
      url: canonical,
      type: 'website',
      ...(logo ? { images: [{ url: logo.src, alt: `${company.name} logo` }] } : {}),
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

  const [{ data: rawProfile }, { data: teamMembers }, { data: reviewRatings }, { data: eliteProspects, error: eliteProspectsError }] = await Promise.all([
    supabase.from('company_profiles').select(profileSelect).eq('company_id', company.id).maybeSingle(),
    supabase.from('advisors').select('*').eq('company_id', company.id).eq('active', true).order('display_order').order('created_at'),
    supabase.from('reviews').select('rating').eq('company_id', company.id).eq('moderation_status', 'approved'),
    supabase.from('company_elite_prospects').select('match_status, agency_name, source_url, client_count, source_observed_at, imported_at').eq('company_id', company.id).maybeSingle(),
  ])
  if (eliteProspectsError) console.error('Elite Prospects count could not be loaded', { companyId: company.id, code: eliteProspectsError.code })

  const profile = rawProfile as CompanyProfile | null
  const research = await getLocalCompanyResearch(company)
  const logo = getCompanyLogo(company)
  const logoUrl = logo ? new URL(logo.src, siteUrl).href : null
  const countryName = readableCountry(company.country)
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
    ...(logoUrl ? { image: logoUrl, logo: logoUrl } : {}),
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
    <>
      <ProfileViewTracker companyId={company.id} />
      <AdvisorProfile company={company} profile={profile} teamMembers={teamMembers || []} averageRating={averageRating} reviewCount={ratings.length} research={research} eliteProspects={eliteProspects as EliteProspectsMeasurement | null} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumbSchema, businessSchema, ...(validFaq.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: validFaq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) }] : [])]).replace(/</g, '\\u003c') }} />
    </>
  )
}
