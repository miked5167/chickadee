import Link from 'next/link'
import { ArrowUpRight, BadgeCheck, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DirectoryShortlistActions } from '@/components/listing/DirectoryShortlistActions'

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
    specialties?: string[]
    services?: string[]
    offers_remote?: boolean
    accepting_clients?: boolean | null
    tagline?: string | null
    profile_url?: string | null
  }
  showDistance?: boolean
  distance?: number
}

export function AdvisorCard({ advisor, showDistance, distance }: AdvisorCardProps) {
  const profileHref = advisor.profile_url || `/listings/${advisor.slug}`
  const location = [advisor.city, advisor.state]
    .filter(Boolean)
    .join(', ') || advisor.country

  return (
    <article className="group h-full rounded-xl">
      <Card className="relative h-full overflow-hidden border-frost bg-white shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:border-hockey-blue/40 group-hover:shadow-xl">
        <div className="h-1 w-full bg-[linear-gradient(90deg,var(--hockey-blue)_0_78%,var(--red-line)_78%_86%,var(--ice-blue)_86%)]" />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="font-display text-2xl font-bold uppercase leading-tight text-arena-navy"><Link href={profileHref} className="hover:text-hockey-blue">{advisor.name}</Link></CardTitle>
                {advisor.verified && (
                  <BadgeCheck className="h-5 w-5 flex-shrink-0 text-success-green" aria-label="Business connection verified" />
                )}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-neutral-gray">
                <MapPin className="h-4 w-4 flex-shrink-0 text-hockey-blue" aria-hidden="true" />
                <span className="line-clamp-1">{location}</span>
                {showDistance && distance !== undefined && (
                  <span className="text-xs text-gray-500">
                    &bull; {distance < 1 ? '< 1' : Math.round(distance)} mi
                  </span>
                )}
              </div>
            </div>

            {advisor.logo_url && (
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-frost bg-ice-white p-2">
                <img
                  src={advisor.logo_url}
                  alt={`${advisor.name} logo`}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-col space-y-4 pb-6">
          {/* Description */}
          {(advisor.tagline || advisor.description) && (
            <p className="line-clamp-3 text-sm leading-6 text-neutral-gray">{advisor.tagline || advisor.description}</p>
          )}
          {(advisor.specialties?.length || advisor.services?.length) ? (
            <div className="flex flex-wrap gap-1.5" aria-label="Advisor specialties">
              {Array.from(new Set([...(advisor.specialties || []), ...(advisor.services || [])])).slice(0, 3).map((specialty) => (
                <span key={specialty} className="rounded-full bg-ice-blue px-2.5 py-1 text-[11px] font-bold text-board-blue">
                  {specialty}
                </span>
              ))}
            </div>
          ) : null}
          {(advisor.accepting_clients === true || advisor.offers_remote) && (
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-board-blue">
              {advisor.accepting_clients === true && <span>Accepting clients</span>}
              {advisor.offers_remote && <span>Remote available</span>}
            </div>
          )}
          <div className="mt-auto border-t border-frost pt-4">
            <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider"><span className={advisor.verified ? 'text-success-green' : 'text-neutral-gray'}>{advisor.verified ? 'Business connection verified' : 'Unclaimed listing'}</span><Link href={profileHref} aria-label={`View ${advisor.name} profile`} className="flex min-h-10 items-center gap-1 text-hockey-blue">Profile <ArrowUpRight className="h-4 w-4" /></Link></div>
            <DirectoryShortlistActions companyId={advisor.id} companyName={advisor.name} />
          </div>
        </CardContent>
      </Card>
    </article>
  )
}
