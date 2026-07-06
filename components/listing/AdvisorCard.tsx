import Link from 'next/link'
import { FaMapMarkerAlt, FaCheckCircle } from 'react-icons/fa'
import { Card, CardContent } from '@/components/ui/card'
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
    client_count?: number | null
    agency_tier?: 'elite_pro' | 'established' | 'family_advisor' | string | null
    specializations?: string[] | null
    accepting_clients?: string | null
    years_in_business?: number | string | null
  }
  showDistance?: boolean
  distance?: number
}

// Tier styling — a subtle 2px accent (foil-parallel feel), not a glow.
const TIER_CONFIG: Record<string, { label: string; border: string; hover: string }> = {
  elite_pro: { label: 'Elite & Pro', border: 'border-goal-gold', hover: 'hover:border-yellow-500' },
  established: { label: 'Established', border: 'border-sky-300', hover: 'hover:border-sky-400' },
  family_advisor: { label: 'Family Advisor', border: 'border-gray-200', hover: 'hover:border-gray-300' },
}

export function AdvisorCard({ advisor, showDistance, distance }: AdvisorCardProps) {
  const location = [advisor.city, advisor.state].filter(Boolean).join(', ') || advisor.country
  const tier = TIER_CONFIG[advisor.agency_tier as string] ?? TIER_CONFIG.family_advisor
  const monogram = advisor.name?.trim()?.charAt(0)?.toUpperCase() || '?'
  const isClaimed = advisor.verified
  const isAccepting = advisor.accepting_clients === 'accepting' && isClaimed

  const specialties = (advisor.specializations || []).filter(Boolean).slice(0, 3)

  // Stat strip — only stats that actually exist.
  const stats: string[] = []
  if (typeof advisor.client_count === 'number' && advisor.client_count > 0) {
    stats.push(`${advisor.client_count.toLocaleString()} players`)
  }
  if (advisor.agency_tier && TIER_CONFIG[advisor.agency_tier as string]) {
    stats.push(tier.label)
  }
  if (advisor.years_in_business) {
    stats.push(`${advisor.years_in_business} yrs`)
  }

  return (
    <Link href={`/listings/${advisor.slug}`} className="block h-full">
      <Card
        className={`
          h-full relative cursor-pointer bg-white
          border-2 ${tier.border} ${tier.hover}
          hover:shadow-lg
          motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-1
        `}
      >
        <CardContent className="p-5 flex flex-col gap-3">
          {/* Top row: logo / monogram + claim status */}
          <div className="flex items-start justify-between gap-3">
            {advisor.logo_url ? (
              <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-gray-200 p-1.5 flex items-center justify-center">
                <img
                  src={advisor.logo_url}
                  alt={`${advisor.name} logo`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-16 h-16 flex-shrink-0 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-100 border border-sky-100">
                <span className="text-2xl font-bold text-hockey-blue">{monogram}</span>
              </div>
            )}

            <div className="flex-shrink-0">
              {isClaimed ? (
                <span className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium">
                  <FaCheckCircle className="w-4 h-4" />
                  Verified
                </span>
              ) : (
                <span className="text-xs text-gray-400">Unclaimed</span>
              )}
            </div>
          </div>

          {/* Name + accepting indicator */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{advisor.name}</h3>
              {isAccepting && (
                <span
                  className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-green-700"
                  title="Accepting clients"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Accepting
                </span>
              )}
            </div>
            <p className="flex items-center gap-1 text-sm text-gray-600 mt-0.5">
              <FaMapMarkerAlt className="text-gray-400 flex-shrink-0 w-3.5 h-3.5" />
              <span className="line-clamp-1">{location}</span>
              {showDistance && distance !== undefined && (
                <span className="text-xs text-gray-500">
                  &bull; {distance < 1 ? '< 1' : Math.round(distance)} mi
                </span>
              )}
            </p>
          </div>

          {/* Specialty chips — only when specializations exist */}
          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {specialties.map((s, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs bg-blue-50 text-blue-800 border border-blue-100"
                >
                  {s}
                </Badge>
              ))}
            </div>
          )}

          {/* Compact stat strip */}
          {stats.length > 0 && (
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-gray-700 tabular-nums">
              {stats.map((stat, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <span className="text-gray-300">&bull;</span>}
                  <span className="font-display font-medium">{stat}</span>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
