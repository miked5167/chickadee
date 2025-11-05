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
import { StarRating } from '@/components/listing/StarRating'
import { ReviewsList } from '@/components/listing/ReviewsList'
import { SocialLinks } from '@/components/listing/SocialLinks'
import { BusinessHours } from '@/components/listing/BusinessHours'
import { TeamSection } from '@/components/listing/TeamSection'
import { LocationMapWrapper } from '@/components/listing/LocationMapWrapper'
import { MessageSquarePlus, Building2, Target, School, Trophy, LineChart, Users, Shield, Zap, Award, DollarSign, Clock } from 'lucide-react'

// Incremental Static Regeneration - revalidate every hour
export const revalidate = 3600

// Pre-generate top 100 advisor pages at build time
export async function generateStaticParams() {
  // Use admin client for static generation (no cookies needed)
  const supabase = createAdminClient()

  const { data: advisors } = await supabase
    .from('advisors')
    .select('slug')
    .eq('is_published', true)
    .order('average_rating', { ascending: false })
    .order('review_count', { ascending: false })
    .limit(100)

  return advisors?.map((advisor) => ({
    slug: advisor.slug,
  })) || []
}

interface ListingPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: advisor } = await supabase
    .from('advisors')
    .select('name, description, city, state, country')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!advisor) {
    return {
      title: 'Advisor Not Found',
    }
  }

  const location = [advisor.city, advisor.state, advisor.country].filter(Boolean).join(', ')

  return {
    title: `${advisor.name} - Hockey Advisor in ${location}`,
    description: advisor.description || `Contact ${advisor.name} for hockey advisory services.`,
  }
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch advisor data
  const { data: advisor } = await supabase
    .from('advisors')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!advisor) {
    notFound()
  }

  // Fetch initial reviews for the page (first 10, sorted by newest)
  const { data: reviewsData, count: reviewCount } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      review_title,
      review_text,
      is_verified,
      created_at,
      advisor_reply,
      advisor_reply_at,
      reviewer:users_public!reviews_user_id_fkey (
        display_name
      )
    `, { count: 'exact' })
    .eq('advisor_id', advisor.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(10)

  // Transform the data to match the Review type (Supabase returns reviewer as object, not array)
  const initialReviews = reviewsData?.map((review: any) => ({
    ...review,
    title: review.review_title, // Map review_title to title for component compatibility
    reviewer: Array.isArray(review.reviewer) ? review.reviewer[0] : review.reviewer
  }))

  // Fetch team members
  const { data: teamMembers } = await supabase
    .from('advisor_team_members')
    .select('*')
    .eq('advisor_id', advisor.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  // Increment view count
  await supabase.from('listing_views').insert({
    advisor_id: advisor.id,
    ip_address_hash: 'anonymous', // In production, hash the IP
    user_agent: 'web',
  })

  const location = [advisor.city, advisor.state].filter(Boolean).join(', ') || advisor.country
  const rating = advisor.average_rating || 0
  const totalReviews = reviewCount || 0

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
              {advisor.state && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/listings?state=${advisor.state}`}>
                      {advisor.state}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage>{advisor.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Logo */}
            {advisor.logo_url && (
              <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-md">
                <img
                  src={advisor.logo_url}
                  alt={`${advisor.name} logo`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Header Info */}
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-4xl font-bold text-gray-900">{advisor.name}</h1>
                {advisor.is_verified && (
                  <Badge className="bg-amber-100 text-amber-900 border-amber-300">
                    <FaCheckCircle className="w-4 h-4 mr-1" />
                    Verified Professional
                  </Badge>
                )}
              </div>

              {/* Rating */}
              {totalReviews > 0 && (
                <div className="flex items-center gap-3 mb-3">
                  <StarRating rating={rating} showNumber={true} />
                  <span className="text-lg font-semibold text-gray-900">{rating.toFixed(1)}</span>
                  <span className="text-gray-600">
                    ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <FaMapMarkerAlt className="text-blue-600" />
                <span className="font-medium">{location}</span>
              </div>

              {/* Specialties */}
              {advisor.specialties && advisor.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {advisor.specialties.slice(0, 5).map((specialty: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <ContactModal advisorId={advisor.id} advisorName={advisor.name} />
                {advisor.website_url && (
                  <a href={advisor.website_url} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" variant="outline" className="font-semibold">
                      Visit Website
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Bar */}
        {(advisor.years_in_business || totalReviews > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-6 bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-100">
            {advisor.years_in_business && (
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">{advisor.years_in_business}+</div>
                <div className="text-sm text-gray-600 font-medium">Years Experience</div>
              </div>
            )}
            {totalReviews > 0 && (
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">{totalReviews}</div>
                <div className="text-sm text-gray-600 font-medium">{totalReviews === 1 ? 'Review' : 'Reviews'}</div>
              </div>
            )}
            {rating > 0 && (
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">{rating.toFixed(1)}⭐</div>
                <div className="text-sm text-gray-600 font-medium">Average Rating</div>
              </div>
            )}
            {advisor.is_verified && (
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">✓</div>
                <div className="text-sm text-gray-600 font-medium">Verified Business</div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {advisor.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">About {advisor.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {advisor.description}
                    </p>
                  </div>

                  {/* Background Highlights */}
                  {(advisor.years_in_business || advisor.certification_info) && (
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-blue-600" />
                        Background Highlights
                      </h3>
                      <ul className="space-y-3">
                        {advisor.years_in_business && (
                          <li className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                            <span className="text-gray-700">
                              <strong>{advisor.years_in_business}+ years</strong> of professional experience
                            </span>
                          </li>
                        )}
                        {advisor.certification_info && (
                          <li className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                            <span className="text-gray-700">{advisor.certification_info}</span>
                          </li>
                        )}
                        {totalReviews > 0 && (
                          <li className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                            <span className="text-gray-700">
                              Trusted by families with <strong>{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</strong>
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Services Offered */}
            {advisor.services_offered && advisor.services_offered.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Services Offered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {advisor.services_offered.map((service: string, index: number) => {
                      // Map services to appropriate icons
                      const getServiceIcon = (serviceName: string) => {
                        const lowerService = serviceName.toLowerCase()
                        if (lowerService.includes('assessment') || lowerService.includes('evaluation')) return Target
                        if (lowerService.includes('college') || lowerService.includes('ncaa') || lowerService.includes('placement')) return School
                        if (lowerService.includes('showcase') || lowerService.includes('tournament')) return Trophy
                        if (lowerService.includes('development') || lowerService.includes('training') || lowerService.includes('plan')) return LineChart
                        if (lowerService.includes('recruiting') || lowerService.includes('recruitment')) return Users
                        if (lowerService.includes('goalie') || lowerService.includes('defense')) return Shield
                        if (lowerService.includes('skills') || lowerService.includes('performance')) return Zap
                        return Award
                      }

                      const IconComponent = getServiceIcon(service)

                      return (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="text-gray-900 font-medium">{service}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Section */}
            {teamMembers && teamMembers.length > 0 && (
              <TeamSection teamMembers={teamMembers} />
            )}

            {/* Reviews Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Reviews</CardTitle>
                  <Link href={`/listings/${advisor.slug}/reviews/new`}>
                    <Button size="sm">
                      <MessageSquarePlus className="w-4 h-4 mr-2" />
                      Write a Review
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <ReviewsList
                  advisorId={advisor.id}
                  initialReviews={initialReviews || []}
                  totalCount={totalReviews}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-4 space-y-6">
              {/* Contact Card */}
              <ContactCard
              advisorId={advisor.id}
              advisorSlug={advisor.slug}
              phone={advisor.phone}
              email={advisor.email}
              websiteUrl={advisor.website_url}
              linkedinUrl={advisor.linkedin_url}
              instagramUrl={advisor.instagram_url}
              twitterUrl={advisor.twitter_url}
              facebookUrl={advisor.facebook_url}
              youtubeUrl={advisor.youtube_url}
            />

            {/* Claim This Listing Card */}
            {!advisor.is_claimed && (
              <Card className="border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-blue-900">Own This Business?</CardTitle>
                    <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                      FREE
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-4 font-medium">
                    Claim this listing to manage and update your business profile.
                  </p>
                  <Link href={`/claim/${advisor.slug}`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-base shadow-md hover:shadow-lg transition-all">
                      <Building2 className="w-5 h-5 mr-2" />
                      Claim This Listing
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Pricing & Business Info */}
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pricing - Featured */}
                {advisor.price_range && (
                  <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Pricing</h4>
                        <p className="text-lg font-bold text-green-700">{advisor.price_range}</p>
                        <p className="text-xs text-gray-600 mt-1">Contact for detailed pricing</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Other Business Info */}
                <div className="space-y-3 text-sm">
                  {advisor.years_in_business && (
                    <div className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-900">Years in Business:</span>{' '}
                        <span className="text-gray-700">{advisor.years_in_business}+ years</span>
                      </div>
                    </div>
                  )}
                  {advisor.certification_info && (
                    <div className="flex items-start gap-2">
                      <Trophy className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-900">Certifications:</span>{' '}
                        <span className="text-gray-700">{advisor.certification_info}</span>
                      </div>
                    </div>
                  )}
                  {advisor.business_hours && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-900">Business Hours</span>
                      </div>
                      <BusinessHours hours={advisor.business_hours} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

              {/* Location Map */}
              {advisor.latitude && advisor.longitude && (
                <LocationMapWrapper
                  latitude={advisor.latitude}
                  longitude={advisor.longitude}
                  name={advisor.name}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
