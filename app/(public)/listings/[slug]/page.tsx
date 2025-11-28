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
import { StarRating } from '@/components/listing/StarRating'
import { ReviewsList } from '@/components/listing/ReviewsList'
import { SocialLinks } from '@/components/listing/SocialLinks'
import { BusinessHours } from '@/components/listing/BusinessHours'
import { TeamSection } from '@/components/listing/TeamSection'
import { LocationMapWrapper } from '@/components/listing/LocationMapWrapper'
import { MessageSquarePlus, Building2, Target, School, Trophy, LineChart, Users, Shield, Zap, Award, DollarSign, Clock, Check, Instagram, Facebook, Twitter, Youtube, Linkedin, MapPin, Globe, CheckCircle, Phone, Calendar, CreditCard, UserCheck, Tag, BadgeCheck } from 'lucide-react'
import { getEngagementRangeLabel, getPricingStructureLabel, getConsultationFeeTypeLabel, formatPrice } from '@/lib/constants/profile-fields'

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
    .select('*', { count: 'exact' })
    .eq('advisor_id', advisor.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch reviewer display names separately (since reviews.user_id -> auth.users, not users_public)
  const userIds = reviewsData?.map(r => r.user_id).filter(Boolean) || []
  const { data: usersData } = userIds.length > 0
    ? await supabase
        .from('users_public')
        .select('id, display_name')
        .in('id', userIds)
    : { data: [] }

  // Create a map of user_id to display_name
  const usersMap = new Map(usersData?.map(u => [u.id, u.display_name]) || [])

  // Transform the data to match the Review type
  const initialReviews = reviewsData?.map((review: any) => ({
    ...review,
    title: review.review_title, // Map review_title to title for component compatibility
    reviewer: {
      display_name: usersMap.get(review.user_id) || null
    }
  }))

  // Fetch team members
  const { data: teamMembers } = await supabase
    .from('advisor_team_members')
    .select('*')
    .eq('advisor_id', advisor.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  // Increment view count (don't block page load if this fails)
  try {
    await supabase.from('listing_views').insert({
      advisor_id: advisor.id,
      ip_address: 'anonymous', // In production, hash the IP
      user_agent: 'web',
    })
  } catch (error) {
    // Log error but don't block page load
    console.error('Failed to track listing view:', error)
  }

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
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Left Column: Logo */}
            {advisor.logo_url && (
              <div className="flex-shrink-0">
                <div className="w-36 h-36 rounded-2xl overflow-hidden bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-center p-2">
                  <img
                    src={advisor.logo_url}
                    alt={`${advisor.name} logo`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Middle Column: Main Info */}
            <div className="flex-1 min-w-0">
              {/* Name & Verification */}
              <div className="flex items-start gap-3 mb-3 flex-wrap">
                <h1 className="text-5xl font-bold text-gray-900 leading-tight">{advisor.name}</h1>
                {advisor.is_verified && (
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
                {(advisor.instagram_url || advisor.facebook_url || advisor.twitter_url || advisor.linkedin_url || advisor.youtube_url) && (
                  <>
                    <div className="h-5 w-px bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                      {advisor.instagram_url && (
                        <a
                          href={advisor.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 bg-white hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] border border-gray-300 hover:border-transparent rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow group"
                          aria-label="Instagram"
                        >
                          <Instagram className="w-4 h-4 text-gray-700 group-hover:text-white transition-colors" />
                        </a>
                      )}
                      {advisor.facebook_url && (
                        <a
                          href={advisor.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 bg-white hover:bg-[#1877F2] border border-gray-300 hover:border-[#1877F2] rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow group"
                          aria-label="Facebook"
                        >
                          <Facebook className="w-4 h-4 text-gray-700 group-hover:text-white transition-colors" />
                        </a>
                      )}
                      {advisor.twitter_url && (
                        <a
                          href={advisor.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 bg-white hover:bg-[#1DA1F2] border border-gray-300 hover:border-[#1DA1F2] rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow group"
                          aria-label="Twitter"
                        >
                          <Twitter className="w-4 h-4 text-gray-700 group-hover:text-white transition-colors" />
                        </a>
                      )}
                      {advisor.linkedin_url && (
                        <a
                          href={advisor.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 bg-white hover:bg-[#0077B5] border border-gray-300 hover:border-[#0077B5] rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow group"
                          aria-label="LinkedIn"
                        >
                          <Linkedin className="w-4 h-4 text-gray-700 group-hover:text-white transition-colors" />
                        </a>
                      )}
                      {advisor.youtube_url && (
                        <a
                          href={advisor.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 bg-white hover:bg-[#FF0000] border border-gray-300 hover:border-[#FF0000] rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow group"
                          aria-label="YouTube"
                        >
                          <Youtube className="w-4 h-4 text-gray-700 group-hover:text-white transition-colors" />
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Quick Stats Row */}
              <div className="flex items-center gap-6 mb-6 flex-wrap" role="region" aria-label="Quick statistics">
                {/* Reviews */}
                {totalReviews > 0 ? (
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-amber-200 shadow-sm" aria-label={`Rating: ${rating.toFixed(1)} out of 5 stars, ${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'}`}>
                    <StarRating rating={rating} size="sm" showNumber={false} />
                    <span className="font-bold text-gray-900 text-lg" aria-hidden="true">{rating.toFixed(1)}</span>
                    <span className="text-gray-600 text-sm" aria-hidden="true">({totalReviews})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm" aria-label="No reviews yet">
                    <StarRating rating={0} size="sm" showNumber={false} />
                    <span className="text-gray-600 text-sm" aria-hidden="true">No reviews yet</span>
                  </div>
                )}

                {/* Years in Business */}
                {advisor.years_in_business && (
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-blue-200 shadow-sm">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">{advisor.years_in_business}+ Years</span>
                  </div>
                )}
              </div>

              {/* Three Stat Boxes */}
              <div className="flex flex-wrap items-stretch justify-start gap-4 mb-8 lg:justify-start" role="region" aria-label="Advisor statistics">
                {/* Experience Box - Only show when data exists */}
                {advisor.years_in_business && advisor.years_in_business > 0 && (
                  <article className="group w-[180px] bg-white border-2 border-blue-100 rounded-xl p-5 text-center hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl" aria-hidden="true">📊</span>
                    </div>
                    <div className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">EXPERIENCE</div>
                    <div className="text-xl font-bold text-gray-900" aria-label={`${advisor.years_in_business} plus years of experience`}>
                      {advisor.years_in_business}+ <span className="text-base font-semibold text-gray-600">Years</span>
                    </div>
                  </article>
                )}

                {/* Clients Served Box - Only show when data exists */}
                {advisor.clients_served && advisor.clients_served > 0 && (
                  <article className="group w-[180px] bg-white border-2 border-green-100 rounded-xl p-5 text-center hover:border-green-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl" aria-hidden="true">💼</span>
                    </div>
                    <div className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">CLIENTS SERVED</div>
                    <div className="text-xl font-bold text-gray-900" aria-label={`${advisor.clients_served} plus families served`}>
                      {advisor.clients_served}+ <span className="text-base font-semibold text-gray-600">Families</span>
                    </div>
                  </article>
                )}

                {/* Specialization Box */}
                <article className="group w-[180px] bg-white border-2 border-purple-100 rounded-xl p-5 text-center hover:border-purple-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl" aria-hidden="true">🎯</span>
                  </div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">SPECIALIZATION</div>
                  <div className="text-base font-bold text-gray-900 leading-tight" aria-label={`Specialization: ${advisor.specializations && advisor.specializations.length > 0 ? advisor.specializations[0] : 'NCAA & Junior'}`}>
                    {advisor.specializations && advisor.specializations.length > 0 ? advisor.specializations[0] : 'NCAA & Junior'}
                  </div>
                </article>

                {/* Accepting Clients Box */}
                <article className="group w-[180px] bg-white border-2 border-green-100 hover:border-green-300 rounded-xl p-5 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl text-green-600" aria-hidden="true">✓</span>
                  </div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">AVAILABILITY</div>
                  <div className="text-base font-bold text-green-700 leading-tight">
                    Accepting Clients
                  </div>
                </article>
              </div>

              {/* Specializations */}
              {advisor.specializations && advisor.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {advisor.specializations.slice(0, 6).map((specialization: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all text-xs font-medium px-3 py-1">
                      {specialization}
                    </Badge>
                  ))}
                </div>
              )}

              {/* CTAs - Mobile/Tablet Only */}
              <div className="flex flex-wrap gap-3 lg:hidden mt-6">
                <ContactModal
                  advisorId={advisor.id}
                  advisorName={advisor.name}
                  trigger={
                    <Button size="lg" className="font-semibold shadow-md hover:shadow-lg transition-shadow">
                      Contact Advisor
                    </Button>
                  }
                />
                {advisor.website_url && (
                  <a href={advisor.website_url} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" variant="outline" className="font-semibold border-2">
                      Visit Website
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Right Column: Contact Card - Desktop Only */}
            <div className="hidden lg:block flex-shrink-0">
              <HeroContactCard
                advisorId={advisor.id}
                advisorName={advisor.name}
                phone={advisor.phone}
                email={advisor.email}
                websiteUrl={advisor.website_url}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-6 pb-8">
        {/* Statistics Bar */}
        {(advisor.years_in_business || totalReviews > 0) && (
          <div className="flex justify-center mb-8">
            <div className="flex flex-wrap justify-center items-center gap-8 p-6 bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-100 shadow-sm max-w-4xl">
              {advisor.years_in_business && (
                <div className="text-center min-w-[140px]">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{advisor.years_in_business}+</div>
                  <div className="text-sm text-gray-600 font-medium">Years Experience</div>
                </div>
              )}
              {totalReviews > 0 && (
                <div className="text-center min-w-[140px]">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{totalReviews}</div>
                  <div className="text-sm text-gray-600 font-medium">{totalReviews === 1 ? 'Review' : 'Reviews'}</div>
                </div>
              )}
              {rating > 0 && (
                <div className="text-center min-w-[140px]">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{rating.toFixed(1)}⭐</div>
                  <div className="text-sm text-gray-600 font-medium">Average Rating</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prominent Claim This Listing Banner - Only shown if unclaimed */}
        {!advisor.is_claimed && (
          <div className="mb-6 mt-6 mx-4 md:mx-0 bg-blue-50 border-2 border-blue-500 rounded-xl p-6 md:p-8 text-center shadow-lg">
            <div className="max-w-2xl mx-auto">
              {/* Icon */}
              <div className="text-3xl mb-3">💡</div>

              {/* Heading */}
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                Is this your business?
              </h2>

              {/* Description */}
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-6 px-2">
                Claim this listing to manage your profile, respond to reviews, and connect with families.
              </p>

              {/* CTA Button */}
              <Link href={`/claim/${advisor.slug}`} className="block md:inline-block">
                <Button
                  size="lg"
                  className="w-full md:w-auto h-14 px-8 text-base md:text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  🏒 Claim This Listing - FREE
                </Button>
              </Link>

              {/* Sign In Link */}
              <p className="text-sm text-gray-600 mt-4">
                Already claimed?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </div>
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
                  <div className="space-y-3">
                    {advisor.description.split('\n').filter((line: string) => line.trim()).map((line: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <p className="text-gray-700 leading-relaxed flex-1">{line.trim()}</p>
                      </div>
                    ))}
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
                {/* Star Rating Summary */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  {totalReviews > 0 ? (
                    <div className="flex items-center gap-3">
                      <StarRating rating={rating} size="lg" showNumber={false} />
                      <span className="text-2xl font-bold text-gray-900">{rating.toFixed(1)}</span>
                      <span className="text-gray-600">
                        ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <StarRating rating={0} size="lg" showNumber={false} />
                      <span className="text-gray-600">No reviews yet</span>
                    </div>
                  )}
                </div>
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
              {/* Contact Card - Mobile/Tablet Only */}
              <div className="lg:hidden">
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
              </div>

            {/* Claim This Listing Card */}
            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Typical Engagement Range - Always shown */}
                <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                  <div className="flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-semibold">Typical Engagement Range</div>
                    <div className="text-base font-semibold text-gray-900">
                      {getEngagementRangeLabel(advisor.typical_engagement_range)}
                    </div>
                  </div>
                </div>

                {/* Starting Price - If provided */}
                {advisor.starting_price && (
                  <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                    <div className="flex-shrink-0">
                      <Tag className="w-5 h-5 text-blue-600 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-semibold">Starting Price</div>
                      <div className="text-base font-semibold text-gray-900">
                        {formatPrice(advisor.starting_price)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing & Engagement Options - If provided */}
                {advisor.pricing_structure && advisor.pricing_structure.length > 0 && (
                  <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                    <div className="flex-shrink-0">
                      <BadgeCheck className="w-5 h-5 text-blue-600 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-semibold">Pricing & Engagement Options</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {advisor.pricing_structure.map((structure: string, index: number) => (
                          <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-800 border border-blue-200 text-xs font-medium px-2 py-1">
                            {getPricingStructureLabel(structure)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Initial Consultation Fee - If provided */}
                {advisor.consultation_fee_type && (
                  <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                    <div className="flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-semibold">Initial Consultation</div>
                      <div className="text-base font-semibold text-gray-900">
                        {getConsultationFeeTypeLabel(advisor.consultation_fee_type)}
                        {advisor.consultation_fee_amount && (
                          <span className="text-gray-700"> - {formatPrice(advisor.consultation_fee_amount)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Pricing Details - If provided */}
                {advisor.pricing_details && (
                  <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                    <div className="flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-semibold">Pricing Details</div>
                      <div className="text-sm text-gray-700 leading-relaxed">
                        {advisor.pricing_details}
                      </div>
                    </div>
                  </div>
                )}

                {/* Service Area - Conditional */}
                {advisor.service_area && (
                  <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                    <div className="flex-shrink-0">
                      <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-semibold">Service Area</div>
                      <div className="text-base font-semibold text-gray-900">{advisor.service_area}</div>
                    </div>
                  </div>
                )}

                {/* Consultation Format - Conditional */}
                {advisor.consultation_format && (
                  <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                    <div className="flex-shrink-0">
                      <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-semibold">Consultation Format</div>
                      <div className="text-base font-semibold text-gray-900">{advisor.consultation_format}</div>
                    </div>
                  </div>
                )}

                {/* Payment Methods - Conditional */}
                {advisor.payment_methods && (
                  <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                    <div className="flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-semibold">Payment Methods</div>
                      <div className="text-base font-semibold text-gray-900">{advisor.payment_methods}</div>
                    </div>
                  </div>
                )}

                {/* Response Time - Always shown with default */}
                <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                  <div className="flex-shrink-0">
                    <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-semibold">Typical Response</div>
                    <div className="text-base font-semibold text-gray-900">{advisor.response_time || 'Within 48 hours'}</div>
                  </div>
                </div>

                {/* Player Levels - Conditional */}
                {advisor.player_levels && (
                  <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                    <div className="flex-shrink-0">
                      <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-semibold">Player Levels</div>
                      <div className="text-base font-semibold text-gray-900">{advisor.player_levels}</div>
                    </div>
                  </div>
                )}

                {/* Languages - Optional */}
                {advisor.languages && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-semibold">Languages</div>
                      <div className="text-base font-semibold text-gray-900">{advisor.languages}</div>
                    </div>
                  </div>
                )}
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

      {/* Schema.org Structured Data - LocalBusiness */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            '@id': `https://hockeydirectory.com/listings/${advisor.slug}`,
            name: advisor.name,
            description: advisor.description || `Professional hockey advisor services in ${location}`,
            url: advisor.website_url || `https://hockeydirectory.com/listings/${advisor.slug}`,
            image: advisor.logo_url,
            telephone: advisor.phone,
            email: advisor.email,
            address: {
              '@type': 'PostalAddress',
              addressLocality: advisor.city,
              addressRegion: advisor.state,
              addressCountry: advisor.country,
            },
            ...(advisor.latitude && advisor.longitude && {
              geo: {
                '@type': 'GeoCoordinates',
                latitude: advisor.latitude,
                longitude: advisor.longitude,
              },
            }),
            ...(totalReviews > 0 && {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: rating.toFixed(1),
                reviewCount: totalReviews,
                bestRating: 5,
                worstRating: 1,
              },
            }),
            ...(advisor.services_offered && advisor.services_offered.length > 0 && {
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Hockey Advisory Services',
                itemListElement: advisor.services_offered.map((service: string) => ({
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: service,
                  },
                })),
              },
            }),
            ...(advisor.price_range && {
              priceRange: advisor.price_range,
            }),
          }),
        }}
      />

      {/* Schema.org Structured Data - BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://hockeydirectory.com',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Hockey Advisors',
                item: 'https://hockeydirectory.com/listings',
              },
              ...(advisor.state ? [{
                '@type': 'ListItem',
                position: 3,
                name: advisor.state,
                item: `https://hockeydirectory.com/listings?state=${advisor.state}`,
              }] : []),
              {
                '@type': 'ListItem',
                position: advisor.state ? 4 : 3,
                name: advisor.name,
                item: `https://hockeydirectory.com/listings/${advisor.slug}`,
              },
            ],
          }),
        }}
      />
    </div>
  )
}
