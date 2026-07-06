import { Metadata } from 'next'
import { SearchBar } from '@/components/search/SearchBar'
import { FeaturedListings } from '@/components/listing/FeaturedListings'
import { FaCheckCircle, FaUsers, FaHockeyPuck, FaGlobeAmericas, FaRoute, FaSchool, FaGraduationCap } from 'react-icons/fa'

export const metadata: Metadata = {
  title: 'The Hockey Directory - Find Top Hockey Advisors Near You',
  description:
    'Connect with 200+ hockey advisors and agencies across North America. Get expert guidance for AAA team placement, prep school selection, college recruiting, and elite player development.',
}

export default function HomePage() {
  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'The Hockey Directory',
    url: 'https://thehockeydirectory.com',
    description: 'Find and connect with hockey advisors across North America',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://thehockeydirectory.com/listings?location={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'The Hockey Directory',
    url: 'https://thehockeydirectory.com',
    logo: 'https://thehockeydirectory.com/logo.png',
    description: 'North America\'s trusted directory of hockey advisors and development professionals',
  }

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-rink-navy via-hockey-blue to-rink-navy text-white py-20 md:py-32">
        {/* Subtle ice texture — faint diagonal striations + a soft sheen (no dots, no photos) */}
        <div
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 22px), radial-gradient(120% 80% at 50% -20%, rgba(255,255,255,0.10), transparent 60%)',
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-4 uppercase tracking-tight">
              Find the Right
              <br />
              <span className="text-goal-gold">Hockey Advisor</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Connect with advisors who help navigate your player's hockey journey and find the right opportunities at every level
            </p>
          </div>

          {/* Search Bar */}
          <SearchBar />
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <FaUsers className="text-4xl text-hockey-blue mb-2" />
              <p className="font-display text-3xl md:text-4xl font-semibold tabular-nums text-rink-navy">200+</p>
              <p className="text-sm text-gray-600">Advisors & Agencies Listed</p>
            </div>
            <div className="flex flex-col items-center">
              <FaHockeyPuck className="text-4xl text-hockey-blue mb-2" />
              <p className="font-display text-3xl md:text-4xl font-semibold tabular-nums text-rink-navy">8,800+</p>
              <p className="text-sm text-gray-600">Players Represented</p>
            </div>
            <div className="flex flex-col items-center">
              <FaGlobeAmericas className="text-4xl text-goal-gold mb-2" />
              <p className="font-display text-3xl md:text-4xl font-semibold tabular-nums text-rink-navy">US & Canada</p>
              <p className="text-sm text-gray-600">Coast-to-Coast Coverage</p>
            </div>
            <div className="flex flex-col items-center">
              <FaCheckCircle className="text-4xl text-green-600 mb-2" />
              <p className="font-display text-3xl md:text-4xl font-semibold tabular-nums text-rink-navy">Free</p>
              <p className="text-sm text-gray-600">For Families, Always</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <FeaturedListings />

      {/* Why Work With an Advisor Section */}
      <section className="py-16 bg-ice-blue">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-2 uppercase tracking-tight">Why Hockey Families Work With an Advisor</h2>
            <p className="text-gray-600">
              The road through competitive hockey is full of high-stakes decisions. The right advisor has seen them all before.
            </p>
            <div className="rink-divider w-20 mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card 1 */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <FaRoute className="text-hockey-blue text-4xl mb-4" />
              <h3 className="text-xl font-semibold mb-2">Navigating the Pathways</h3>
              <p className="text-gray-700">
                AAA or academy? Major junior or the college route? One decision at 15 can close doors at 18. Advisors know how the OHL, USHL, BCHL, and NCAA pathways actually work — and what each choice means for your player's future.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <FaSchool className="text-hockey-blue text-4xl mb-4" />
              <h3 className="text-xl font-semibold mb-2">Choosing Schools & Programs</h3>
              <p className="text-gray-700">
                Prep schools and academies vary wildly in cost, coaching, and real exposure. An advisor who knows the programs firsthand can tell you which ones develop players — and which ones just develop invoices.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <FaGraduationCap className="text-hockey-blue text-4xl mb-4" />
              <h3 className="text-xl font-semibold mb-2">Getting Recruited</h3>
              <p className="text-gray-700">
                College coaches see thousands of players. Advisors help families build realistic plans, protect eligibility, and get film in front of the right people at the right time — without the guesswork.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-2 uppercase tracking-tight">How It Works</h2>
            <p className="text-gray-600">Finding the right hockey advisor is easy</p>
            <div className="rink-divider w-20 mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-hockey-blue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Search</h3>
              <p className="text-gray-600">
                Enter your location to find hockey advisors near you. Filter by specialty, rating,
                and more.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-hockey-blue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Compare</h3>
              <p className="text-gray-600">
                Check specialties, experience, and credentials side by side to find the right match for your player.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-hockey-blue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect</h3>
              <p className="text-gray-600">
                Contact advisors directly through phone, email, or website to start your hockey
                journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-hockey-blue to-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4 uppercase tracking-tight">
            Are You a Hockey Advisor?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join our directory and connect with players and families looking for expert guidance
          </p>
          <a
            href="/claim"
            className="inline-block px-8 py-4 bg-goal-gold text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Claim Your Free Listing
          </a>
        </div>
      </section>
    </>
  )
}
