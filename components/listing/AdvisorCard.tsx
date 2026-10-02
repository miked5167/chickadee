import Link from 'next/link'
import { ArrowRight, BadgeCheck, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DirectoryShortlistActions } from '@/components/listing/DirectoryShortlistActions'
import { ListingCardLogo } from './ListingCardLogo'
import { cardTags, playerFit, type ListingCardDetails } from '@/lib/listing-cards'

interface AdvisorCardProps {
  advisor: ListingCardDetails & {
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
  const profileHref = `/listings/${encodeURIComponent(advisor.slug)}`
  const location = [advisor.city, advisor.state]
    .filter(Boolean)
    .join(', ') || advisor.country
  const tags = cardTags(advisor.card_tags)
  const fit = playerFit(advisor)
  const summary = advisor.tagline?.trim() || advisor.description?.trim()

  return (
    <article aria-label={`${advisor.name} listing`} className="group h-full min-w-0 rounded-xl">
      <Card className="relative h-full gap-0 overflow-hidden border-frost bg-white py-0 shadow-sm transition-shadow duration-200 group-hover:border-hockey-blue/40 group-hover:shadow-lg">
        <div className="h-1 w-full bg-[linear-gradient(90deg,var(--hockey-blue)_0_78%,var(--red-line)_78%_86%,var(--ice-blue)_86%)]" />
        <CardHeader className="px-5 pb-4 pt-5">
          <div className="flex items-start gap-3">
            <ListingCardLogo company={advisor} />
            <div className="min-w-0 flex-1">
              <h3 className="break-words font-display text-2xl font-bold leading-tight text-arena-navy"><Link href={profileHref} className="rounded-sm hover:text-hockey-blue">{advisor.name}</Link></h3>
              <div className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-neutral-gray">
                <MapPin className="h-4 w-4 flex-shrink-0 text-hockey-blue" aria-hidden="true" />
                <span className="break-words">{location}{showDistance && distance !== undefined && Number.isFinite(distance) && <> · {distance < 1 ? '< 1' : Math.round(distance)} mi</>}</span>
              </div>
              {advisor.verified && <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-neutral-gray"><BadgeCheck className="h-4 w-4 shrink-0 text-success-green" aria-hidden="true" /><span>Business connection verified</span></p>}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 px-5 pb-5">
          {/* Description */}
          {summary && (
            <p className="line-clamp-2 break-words text-sm leading-6 text-neutral-gray">{summary}</p>
          )}
          {tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Services and pathways">
              {tags.map((tag) => (
                <li key={tag.id} className={`rounded-full border px-3 py-1 text-xs font-semibold ${tag.group_key === 'services' ? 'border-ice-blue bg-ice-blue text-board-blue' : 'border-frost bg-white text-board-blue'}`}>
                  {tag.label}
                </li>
              ))}
            </ul>
          )}
          {fit && <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-frost pt-3 text-sm"><span className="font-semibold text-neutral-gray">Players served</span><span className="break-words text-arena-navy">{fit}</span></div>}
          {(advisor.accepting_clients === true || advisor.offers_remote) && (
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-board-blue">
              {advisor.accepting_clients === true && <span>Accepting clients</span>}
              {advisor.offers_remote && <span>Remote available</span>}
            </div>
          )}
          <div className="mt-auto pt-2">
            <div className="flex flex-wrap items-start gap-2">
              <Link href={profileHref} aria-label={`View ${advisor.name} profile`} className="inline-flex min-h-12 min-w-32 flex-1 items-center justify-center gap-2 rounded-lg bg-hockey-blue px-3 text-sm font-bold text-white transition-colors hover:bg-board-blue">View profile <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
              <DirectoryShortlistActions companyId={advisor.id} companyName={advisor.name} cardLayout />
            </div>
          </div>
        </CardContent>
      </Card>
    </article>
  )
}
