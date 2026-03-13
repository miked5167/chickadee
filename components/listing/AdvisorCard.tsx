import Link from 'next/link'
import { FaMapMarkerAlt, FaCheckCircle } from 'react-icons/fa'
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
    verified: boolean
    logo_url: string | null
    website_url?: string | null
  }
  showDistance?: boolean
  distance?: number
}

export function AdvisorCard({ advisor, showDistance, distance }: AdvisorCardProps) {
  const location = [advisor.city, advisor.state]
    .filter(Boolean)
    .join(', ') || advisor.country

  return (
    <Link href={`/listings/${advisor.slug}`}>
      <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer relative">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg line-clamp-1">{advisor.name}</CardTitle>
                {advisor.verified && (
                  <FaCheckCircle className="text-blue-600 flex-shrink-0" title="Verified" />
                )}
              </div>
              <CardDescription className="flex items-center gap-1 text-sm">
                <FaMapMarkerAlt className="text-gray-400 flex-shrink-0" />
                <span className="line-clamp-1">{location}</span>
                {showDistance && distance !== undefined && (
                  <span className="text-xs text-gray-500">
                    &bull; {distance < 1 ? '< 1' : Math.round(distance)} mi
                  </span>
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
        </CardHeader>

        <CardContent className="space-y-3 flex flex-col">
          {/* Description */}
          {advisor.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{advisor.description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
