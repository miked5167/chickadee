import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FaStar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaCheckCircle } from 'react-icons/fa'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    .select(`
      *,
      reviews (
        id,
        rating,
        comment,
        reviewer_name,
        created_at
      )
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!advisor) {
    notFound()
  }

  // Increment view count
  await supabase.from('listing_views').insert({
    advisor_id: advisor.id,
    ip_address_hash: 'anonymous', // In production, hash the IP
    user_agent: 'web',
  })

  const location = [advisor.city, advisor.state].filter(Boolean).join(', ') || advisor.country
  const rating = advisor.average_rating || 0
  const reviewCount = advisor.review_count || 0

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
              {reviewCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={`w-5 h-5 ${
                          star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600">
                    {rating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
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

            {/* Reviews */}
            {advisor.reviews && advisor.reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {advisor.reviews.slice(0, 5).map((review: any) => (
                      <div key={review.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FaStar
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold">{review.reviewer_name}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && <p className="text-gray-700">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {advisor.phone && (
                  <a
                    href={`tel:${advisor.phone}`}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <FaPhone className="text-hockey-blue" />
                    <span className="text-gray-700">{advisor.phone}</span>
                  </a>
                )}

                {advisor.email && (
                  <a
                    href={`mailto:${advisor.email}`}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <FaEnvelope className="text-hockey-blue" />
                    <span className="text-gray-700">{advisor.email}</span>
                  </a>
                )}

                {advisor.website_url && (
                  <a
                    href={advisor.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <FaGlobe className="text-hockey-blue" />
                    <span className="text-gray-700">Visit Website</span>
                  </a>
                )}

                <Button className="w-full mt-4" size="lg">
                  Contact Advisor
                </Button>
              </CardContent>
            </Card>

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
          </div>
        </div>
      </div>
    </div>
  )
}
