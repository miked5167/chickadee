import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { FaMapMarkerAlt, FaCheckCircle } from 'react-icons/fa'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { ContactCard } from '@/components/listing/ContactCard'
import { ContactModal } from '@/components/listing/ContactModal'
import { HeroContactCard } from '@/components/listing/HeroContactCard'
import { Instagram, Facebook, Twitter, Globe, Phone, MapPin, CheckCircle, Mail } from 'lucide-react'

// Incremental Static Regeneration - revalidate every hour
export const revalidate = 3600

// Pre-generate top 100 company pages at build time
export async function generateStaticParams() {
  const supabase = createAdminClient()

  const { data: companies } = await supabase
    .from('companies')
    .select('slug')
    .order('name', { ascending: true })
    .limit(100)

  return companies?.map((company) => ({
    slug: company.slug,
  })) || []
}

interface ListingPageProps {
  params: Promise<{
    slug: string
  }>
}

// Single source of truth for the contact card (previously duplicated inline for
// desktop and mobile). Rendered in both responsive slots below.
interface ContactInfoCardProps {
  company: {
    slug: string
    phone?: string | null
    email?: string | null
    website_url?: string | null
    address?: string | null
    verified?: boolean | null
  }
  location: string
}

function ContactInfoCard({ company, location }: ContactInfoCardProps) {
  return (
    <Card className="border-2 border-gray-200 shadow-lg">
      <CardHeader className="bg-hockey-blue text-white rounded-t-lg">
        <CardTitle className="text-lg">Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {company.phone && (
          <a href={`tel:${company.phone}`} className="flex items-center gap-3 text-gray-700 hover:text-hockey-blue transition-colors">
            <Phone className="w-5 h-5 text-hockey-blue" />
            <span>{company.phone}</span>
          </a>
        )}
        {company.email && (
          <a href={`mailto:${company.email}`} className="flex items-center gap-3 text-gray-700 hover:text-hockey-blue transition-colors">
            <Mail className="w-5 h-5 text-hockey-blue" />
            <span className="truncate">{company.email}</span>
          </a>
        )}
        {company.website_url && (
          <a href={company.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-hockey-blue transition-colors">
            <Globe className="w-5 h-5 text-hockey-blue" />
            <span className="truncate">Visit Website</span>
          </a>
        )}
        {company.address && (
          <div className="flex items-start gap-3 text-gray-700">
            <MapPin className="w-5 h-5 text-hockey-blue mt-0.5" />
            <span>{company.address}, {location}</span>
          </div>
        )}
        {!company.verified && (
          <div className="pt-4 border-t">
            <Link href={`/claim/${company.slug}`}>
              <Button variant="outline" className="w-full">
                <CheckCircle className="w-4 h-4 mr-2" />
                Claim This Listing
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: company } = await supabase
    .from('companies')
    .select('name, description, city, state_province, country')
    .eq('slug', slug)
    .single()

  if (!company) {
    return {
      title: 'Advisor Not Found',
    }
  }

  const location = [company.city, company.state_province, company.country].filter(Boolean).join(', ')

  return {
    title: `${company.name} - Hockey Advisor in ${location}`,
    description: company.description || `Contact ${company.name} for hockey advisory services in ${location}.`,
  }
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch company data (exclude PostGIS/tsvector columns)
  const { data: company } = await supabase
    .from('companies')
    .select(`
      id, name, slug, description, logo_url, website_url, email, phone,
      address, city, state_province, country,
      instagram_url, twitter_url, facebook_url,
      verified, verified_owner_id, verification_date,
      client_count, agency_tier,
      created_at, updated_at
    `)
    .eq('slug', slug)
    .single()

  if (!company) {
    notFound()
  }

  // Fetch team members (advisors linked to this company)
  const { data: teamMembers } = await supabase
    .from('advisors')
    .select('*')
    .eq('company_id', company.id)
    .eq('active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  const location = [company.city, company.state_province].filter(Boolean).join(', ') || company.country

  // A5: legitimate structured data (no rating/review markup — none exist)
  const canonicalUrl = `https://thehockeydirectory.com/listings/${company.slug}`
  const sameAs = [
    company.website_url,
    company.instagram_url,
    company.twitter_url,
    company.facebook_url,
  ].filter(Boolean)

  // B2: derived, fabrication-free view data.
  const TIER_LABELS: Record<string, string> = {
    elite_pro: 'Elite & Pro',
    established: 'Established',
    family_advisor: 'Family Advisor',
  }
  const tierLabel = company.agency_tier ? TIER_LABELS[company.agency_tier] : null
  const isClaimed = Boolean(company.verified)
  const c = company as Record<string, any>

  // "At a Glance" rows — only rendered when the underlying data actually exists.
  const glanceRows: { label: string; value: string }[] = []
  if (typeof company.client_count === 'number' && company.client_count > 0)
    glanceRows.push({ label: 'Players represented', value: company.client_count.toLocaleString() })
  if (tierLabel) glanceRows.push({ label: 'Tier', value: tierLabel })
  if (location) glanceRows.push({ label: 'Location', value: location })
  if (c.years_in_business) glanceRows.push({ label: 'Years in business', value: String(c.years_in_business) })
  if (c.languages) glanceRows.push({ label: 'Languages', value: String(c.languages) })
  if (c.response_time && isClaimed) glanceRows.push({ label: 'Response time', value: String(c.response_time) })
  if (c.accepting_clients && isClaimed) {
    const av = c.accepting_clients === 'accepting' ? 'Accepting clients'
      : c.accepting_clients === 'waitlist' ? 'Waitlist' : 'Not accepting new clients'
    glanceRows.push({ label: 'Availability', value: av })
  }

  // Auto-generated FAQ — real data only; skip any question needing unknown data.
  const contactMethods: string[] = []
  if (company.phone) contactMethods.push(`by phone at ${company.phone}`)
  if (company.email) contactMethods.push(`by email at ${company.email}`)
  if (company.website_url) contactMethods.push('through their website')

  const faqs: { question: string; answer: string }[] = []
  if (location)
    faqs.push({
      question: `Where is ${company.name} located?`,
      answer: `${company.name} is a hockey advisor based in ${location}.`,
    })
  if (typeof company.client_count === 'number' && company.client_count > 0)
    faqs.push({
      question: `How many players does ${company.name} represent?`,
      answer: `${company.name} represents ${company.client_count.toLocaleString()} players.`,
    })
  if (contactMethods.length > 0)
    faqs.push({
      question: `How do I contact ${company.name}?`,
      answer: `You can reach ${company.name} ${contactMethods.join(', ')}.`,
    })
  faqs.push({
    question: 'What does a hockey advisor do?',
    answer:
      'A hockey advisor helps players and families navigate decisions like team and program ' +
      'placement, player development, and the college recruiting process across pathways such as ' +
      'AAA, junior, prep school, and NCAA.',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/listings">Advisors</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {company.state_province && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/listings?state=${company.state_province}`}>
                      {company.state_province}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage>{company.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Left Column: Logo */}
            {company.logo_url && (
              <div className="flex-shrink-0">
                <div className="w-36 h-36 rounded-2xl overflow-hidden bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-center p-2">
                  <img
                    src={company.logo_url}
                    alt={`${company.name} logo`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Middle Column: Main Info */}
            <div className="flex-1 min-w-0">
              {/* Name & Verification */}
              <div className="flex items-start gap-3 mb-3 flex-wrap">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">{company.name}</h1>
                {company.verified && (
                  <Badge className="bg-green-100 text-green-800 border-green-300 px-3 py-1.5 text-sm font-semibold">
                    <FaCheckCircle className="w-4 h-4 mr-1.5" />
                    Verified
                  </Badge>
                )}
              </div>

              {/* Location & Social in one line */}
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-2 text-gray-700">
                  <FaMapMarkerAlt className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-base">{location}</span>
                </div>

                {/* Social Media Links */}
                {(company.instagram_url || company.facebook_url || company.twitter_url) && (
                  <>
                    <div className="h-5 w-px bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                      {company.instagram_url && (
                        <a
                          href={company.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 bg-white hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] border border-gray-300 hover:border-transparent rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow group"
                          aria-label="Instagram"
                        >
                          <Instagram className="w-4 h-4 text-gray-700 group-hover:text-white transition-colors" />
                        </a>
                      )}
                      {company.facebook_url && (
                        <a
                          href={company.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 bg-white hover:bg-[#1877F2] border border-gray-300 hover:border-[#1877F2] rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow group"
                          aria-label="Facebook"
                        >
                          <Facebook className="w-4 h-4 text-gray-700 group-hover:text-white transition-colors" />
                        </a>
                      )}
                      {company.twitter_url && (
                        <a
                          href={company.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 bg-white hover:bg-[#1DA1F2] border border-gray-300 hover:border-[#1DA1F2] rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow group"
                          aria-label="Twitter"
                        >
                          <Twitter className="w-4 h-4 text-gray-700 group-hover:text-white transition-colors" />
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Description */}
              {company.description && (
                <p className="text-gray-700 text-lg leading-relaxed mb-6">{company.description}</p>
              )}

              {/* CTAs - Mobile/Tablet Only */}
              <div className="flex flex-wrap gap-3 lg:hidden mt-6">
                {company.phone && (
                  <a href={`tel:${company.phone}`}>
                    <Button className="bg-hockey-blue hover:bg-blue-800 text-white">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Now
                    </Button>
                  </a>
                )}
                {company.website_url && (
                  <a href={company.website_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">
                      <Globe className="w-4 h-4 mr-2" />
                      Visit Website
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Right Column: Contact Card (Desktop) */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <ContactInfoCard company={company} location={location} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8">
        {/* Unclaimed banner — claim funnel */}
        {!isClaimed && (
          <div className="mb-8 rounded-lg border border-hockey-blue/20 bg-ice-blue px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-gray-800">
              <span className="font-semibold">Is this your agency?</span>{' '}
              Claim this profile to add specialties, photos, and more.
            </p>
            <Link href={`/claim/${company.slug}`} className="flex-shrink-0">
              <Button variant="outline" className="w-full sm:w-auto">
                <CheckCircle className="w-4 h-4 mr-2" />
                Claim this profile
              </Button>
            </Link>
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Main Content */}
          <div className="flex-1 space-y-8">
            {/* About Section */}
            {company.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About {company.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{company.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Mid-page CTA band */}
            {company.state_province && (
              <div className="rounded-lg bg-gradient-to-r from-hockey-blue to-blue-800 text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-blue-50">
                  Not sure if {company.name} is the right fit? Browse all advisors in {company.state_province}.
                </p>
                <Link
                  href={`/listings?state=${encodeURIComponent(company.state_province)}`}
                  className="flex-shrink-0"
                >
                  <Button className="bg-goal-gold text-gray-900 hover:bg-yellow-400 w-full sm:w-auto">
                    Browse {company.state_province} advisors
                  </Button>
                </Link>
              </div>
            )}

            {/* FAQ Section */}
            {faqs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {faqs.map((faq, i) => (
                    <div key={i}>
                      <h3 className="font-semibold text-gray-900 mb-1">{faq.question}</h3>
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Team Members Section */}
            {teamMembers && teamMembers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Our Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                        {member.profile_image_url ? (
                          <img
                            src={member.profile_image_url}
                            alt={member.name}
                            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-hockey-blue/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-hockey-blue font-bold text-xl">
                              {member.name?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{member.name}</h3>
                          {member.title && (
                            <p className="text-sm text-gray-600">{member.title}</p>
                          )}
                          {member.years_experience && (
                            <p className="text-xs text-gray-500 mt-1">{member.years_experience} years experience</p>
                          )}
                          {member.specialties && member.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {member.specialties.slice(0, 3).map((s: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs bg-blue-50 text-blue-800 border-blue-200">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {member.bio && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-3">{member.bio}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Info Card - Mobile Only */}
            <div className="lg:hidden">
              <ContactInfoCard company={company} location={location} />
            </div>
          </div>

          {/* Right Sidebar: At a Glance */}
          {glanceRows.length > 0 && (
            <aside className="lg:w-80 flex-shrink-0">
              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">At a Glance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {glanceRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-gray-500">{row.label}</span>
                      <span className="font-medium text-gray-900 text-right tabular-nums">{row.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </aside>
          )}
        </div>
      </div>

      {/* Sticky mobile contact bar (only the actions that exist) */}
      {(company.phone || company.email || company.website_url) && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-lg">
          <div className="grid grid-flow-col auto-cols-fr">
            {company.phone && (
              <a
                href={`tel:${company.phone}`}
                className="flex flex-col items-center justify-center gap-1 py-3 text-hockey-blue"
              >
                <Phone className="w-5 h-5" />
                <span className="text-xs font-medium">Call</span>
              </a>
            )}
            {company.email && (
              <a
                href={`mailto:${company.email}`}
                className="flex flex-col items-center justify-center gap-1 py-3 text-hockey-blue border-l border-gray-100"
              >
                <Mail className="w-5 h-5" />
                <span className="text-xs font-medium">Email</span>
              </a>
            )}
            {company.website_url && (
              <a
                href={company.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1 py-3 text-hockey-blue border-l border-gray-100"
              >
                <Globe className="w-5 h-5" />
                <span className="text-xs font-medium">Website</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Schema.org Structured Data — ProfessionalService */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ProfessionalService',
            name: company.name,
            description: company.description || `Hockey advisory services by ${company.name}`,
            url: canonicalUrl,
            ...(company.phone && { telephone: company.phone }),
            ...(company.email && { email: company.email }),
            ...(sameAs.length > 0 && { sameAs }),
            ...(company.address && {
              address: {
                '@type': 'PostalAddress',
                streetAddress: company.address,
                addressLocality: company.city,
                addressRegion: company.state_province,
                addressCountry: company.country,
              },
            }),
            ...(company.logo_url && { logo: company.logo_url, image: company.logo_url }),
            areaServed: {
              '@type': 'Country',
              name: company.country === 'CA' ? 'Canada' : 'United States',
            },
          }),
        }}
      />

      {/* Schema.org Structured Data — BreadcrumbList (matches visible breadcrumb) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://thehockeydirectory.com/' },
              { '@type': 'ListItem', position: 2, name: 'Advisors', item: 'https://thehockeydirectory.com/listings' },
              ...(company.state_province
                ? [{
                    '@type': 'ListItem',
                    position: 3,
                    name: company.state_province,
                    item: `https://thehockeydirectory.com/listings?state=${encodeURIComponent(company.state_province)}`,
                  }]
                : []),
              {
                '@type': 'ListItem',
                position: company.state_province ? 4 : 3,
                name: company.name,
                item: canonicalUrl,
              },
            ],
          }),
        }}
      />

      {/* Schema.org Structured Data — FAQPage (matches the visible FAQ) */}
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
              })),
            }),
          }}
        />
      )}
    </div>
  )
}
