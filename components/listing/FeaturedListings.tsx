import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AdvisorCard } from './AdvisorCard'
import { publicPreviewFeedUrl, publicPreviewProfileUrl } from '@/lib/preview/advisor-feed'

interface FeaturedAdvisor {
  id: string
  slug: string
  name: string
  city: string | null
  state: string | null
  country: string
  description: string | null
  logo_url: string | null
  verified: boolean
  website_url: string | null
  profile_url?: string | null
}

export async function FeaturedListings() {
  const previewFeedUrl = publicPreviewFeedUrl(new URLSearchParams({ limit: '6', sort: 'name' }))
  let advisors: FeaturedAdvisor[] = []

  if (previewFeedUrl) {
    const response = await fetch(previewFeedUrl, { cache: 'no-store' })
    if (response.ok) {
      const payload = await response.json() as { advisors?: FeaturedAdvisor[] }
      advisors = (payload.advisors || []).map((advisor) => ({
        ...advisor,
        profile_url: publicPreviewProfileUrl(advisor.slug),
      }))
    }
  } else {
    const supabase = await createClient()

    // Fetch companies ordered by name (no is_featured column yet)
    const { data: companies } = await supabase
      .from('companies')
      .select(`
        id,
        slug,
        name,
        city,
        state_province,
        country,
        description,
        logo_url,
        verified,
        website_url
      `)
      .order('name', { ascending: true })
      .limit(6)

    advisors = (companies || []).map((company) => ({
      id: company.id,
      slug: company.slug,
      name: company.name,
      city: company.city,
      state: company.state_province,
      country: company.country,
      description: company.description,
      logo_url: company.logo_url,
      verified: company.verified,
      website_url: company.website_url,
    }))
  }

  if (advisors.length === 0) {
    return (
      <section className="bg-ice-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-4xl font-extrabold uppercase text-arena-navy">Explore the directory</h2>
            <p className="mt-3 text-neutral-gray">Directory listings are temporarily unavailable. Please try again shortly.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-ice-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-line">Start your research</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold uppercase leading-none text-arena-navy sm:text-6xl">Explore the directory.</h2>
            <p className="mt-4 text-lg leading-8 text-neutral-gray">
              A sample of company profiles from the full directory, shown alphabetically.
            </p>
          </div>
          <Link href="/listings" className="inline-flex min-h-11 items-center gap-2 font-bold text-hockey-blue hover:text-board-blue">
            See all listings <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {advisors.map((advisor) => (
            <AdvisorCard key={advisor.id} advisor={advisor} />
          ))}
        </div>

      </div>
    </section>
  )
}
