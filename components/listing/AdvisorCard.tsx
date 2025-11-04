import Link from 'next/link'
import { FaStar, FaMapMarkerAlt, FaCheckCircle } from 'react-icons/fa'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AdvisorCardProps {
  advisor: {
    id: string
    slug: string
    name: string
    city: string | null
    state: string | null
    country: string
    description: string | null
    services_offered: string[]
    specialties: string[]
    average_rating: number | null
    review_count: number
    is_verified: boolean
    logo_url: string | null
    years_in_business: number | null
    hasCoordinates?: boolean
  }
  showDistance?: boolean
  distance?: number
}

export function AdvisorCard({ advisor, showDistance, distance }: AdvisorCardProps) {
  const location = [advisor.city, advisor.state]
    .filter(Boolean)
    .join(', ') || advisor.country

  const rating = advisor.average_rating || 0
  const reviewCount = advisor.review_count || 0

  return (
    <Link href={`/listings/${advisor.slug}`}>
      <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg line-clamp-1">{advisor.name}</CardTitle>
                {advisor.is_verified && (
                  <FaCheckCircle className="text-blue-600 flex-shrink-0" title="Verified" />
                )}
              </div>
              <CardDescription className="flex items-center gap-1 text-sm">
                <FaMapMarkerAlt className="text-gray-400 flex-shrink-0" />
                <span className="line-clamp-1">{location}</span>
                {showDistance && distance !== undefined && (
                  <span className="text-xs text-gray-500">
                    • {distance < 1 ? '< 1' : Math.round(distance)} mi
                  </span>
                )}
                {showDistance && !distance && advisor.hasCoordinates === false && (
                  <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600">
                    Location approximate
                  </Badge>
                )}
              </CardDescription>
            </div>

            {advisor.logo_url && (
              <div className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 p-2">
                <img
                  src={advisor.logo_url}
                  alt={`${advisor.name} logo`}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          {/* Rating */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`w-4 h-4 ${
                      star <= rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {rating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Description */}
          {advisor.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{advisor.description}</p>
          )}

          {/* Specialties */}
          {advisor.specialties && advisor.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {advisor.specialties.slice(0, 3).map((specialty, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
              {advisor.specialties.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{advisor.specialties.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Years in business */}
          {advisor.years_in_business && advisor.years_in_business > 0 && (
            <p className="text-xs text-gray-500">
              {advisor.years_in_business} {advisor.years_in_business === 1 ? 'year' : 'years'} in
              business
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
