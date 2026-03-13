import { createClient } from '@/lib/supabase/server'
import { AdvisorCard } from './AdvisorCard'

export async function FeaturedListings() {
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

  if (!companies || companies.length === 0) {
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

  // Map to advisor card shape
  const advisors = companies.map(c => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    city: c.city,
    state: c.state_province,
    country: c.country,
    description: c.description,
    logo_url: c.logo_url,
    verified: c.verified,
    website_url: c.website_url,
  }))

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
