import { createClient } from '@/lib/supabase/server'
import { AdvisorCard } from './AdvisorCard'

export async function FeaturedListings() {
  const supabase = await createClient()

  // Fetch featured advisors (prioritize is_featured=true, then by rating and review count)
  const { data: advisors } = await supabase
    .from('advisors')
    .select(`
      id,
      slug,
      name,
      city,
      state,
      country,
      description,
      services_offered,
      specialties,
      average_rating,
      review_count,
      is_verified,
      logo_url,
      years_in_business,
      is_featured
    `)
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('average_rating', { ascending: false, nullsFirst: false })
    .order('review_count', { ascending: false })
    .limit(6)

  if (!advisors || advisors.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Featured Hockey Advisors</h2>
            <p className="text-gray-600 mb-12">
              Discover top-rated hockey advisors across North America
            </p>
            <p className="text-gray-500">No advisors available at this time.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Featured Hockey Advisors</h2>
          <p className="text-gray-600">
            Discover top-rated hockey advisors across North America
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {advisors.map((advisor) => (
            <AdvisorCard key={advisor.id} advisor={advisor} />
          ))}
        </div>

        <div className="text-center">
          <a
            href="/listings"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            View All Advisors
          </a>
        </div>
      </div>
    </section>
  )
}
