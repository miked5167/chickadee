import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FaMapMarkerAlt, FaCheckCircle } from 'react-icons/fa'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContactCard } from '@/components/listing/ContactCard'
import { LocationMap } from '@/components/listing/LocationMap'
import { StarRating } from '@/components/listing/StarRating'
import { ReviewsList } from '@/components/listing/ReviewsList'
import { MessageSquarePlus, Building2 } from 'lucide-react'

// Force dynamic rendering - don't try to statically generate at build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
  const { data: initialReviews, count: reviewCount } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      title,
      review_text,
      is_verified,
      created_at,
      reviewer:users_public!reviews_reviewer_id_fkey (
        display_name
      )
    `, { count: 'exact' })
    .eq('advisor_id', advisor.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(10)

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
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start gap-6">
            {/* Logo */}
            {advisor.logo_url && (
              <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border">
                <img
                  src={advisor.logo_url}
                  alt={`${advisor.name} logo`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Header Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{advisor.name}</h1>
                {advisor.is_verified && (
                  <FaCheckCircle className="text-blue-600 text-2xl" title="Verified" />
                )}
              </div>

              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <FaMapMarkerAlt />
                <span>{location}</span>
              </div>

              {/* Rating */}
              {totalReviews > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={rating} showNumber={true} />
                  <span className="text-gray-600">
                    ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {advisor.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">{advisor.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Services Offered */}
            {advisor.services_offered && advisor.services_offered.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Services Offered</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    {advisor.services_offered.map((service: string, index: number) => (
                      <li key={index} className="text-gray-700">
                        {service}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Specialties */}
            {advisor.specialties && advisor.specialties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Specialties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {advisor.specialties.map((specialty: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
            {/* Contact Card */}
            <ContactCard
              advisorId={advisor.id}
              advisorSlug={advisor.slug}
              phone={advisor.phone}
              email={advisor.email}
              websiteUrl={advisor.website_url}
            />

            {/* Claim This Listing Card */}
            {!advisor.is_claimed && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Own This Business?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Claim this listing to manage your profile, respond to reviews, and view leads.
                  </p>
                  <Link href={`/claim/${advisor.slug}`}>
                    <Button variant="outline" className="w-full">
                      <Building2 className="w-4 h-4 mr-2" />
                      Claim This Listing
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Business Info */}
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {advisor.years_in_business && (
                  <div>
                    <span className="font-semibold">Years in Business:</span>{' '}
                    <span className="text-gray-700">{advisor.years_in_business}</span>
                  </div>
                )}
                {advisor.certification_info && (
                  <div>
                    <span className="font-semibold">Certifications:</span>{' '}
                    <span className="text-gray-700">{advisor.certification_info}</span>
                  </div>
                )}
                {advisor.price_range && (
                  <div>
                    <span className="font-semibold">Price Range:</span>{' '}
                    <span className="text-gray-700">{advisor.price_range}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location Map */}
            {advisor.latitude && advisor.longitude && (
              <LocationMap
                latitude={advisor.latitude}
                longitude={advisor.longitude}
                name={advisor.name}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
