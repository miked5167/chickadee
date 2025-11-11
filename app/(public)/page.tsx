/**
 * Hockey Directory Homepage - Full featured landing page
 * Updated: 2025-11-11
 */
import { Metadata } from 'next'
import { SearchBar } from '@/components/search/SearchBar'
import { FeaturedListings } from '@/components/listing/FeaturedListings'
import { FaCheckCircle, FaUsers, FaShieldAlt, FaStar } from 'react-icons/fa'

export const metadata: Metadata = {
  title: 'Best Hockey Advisors Directory 2025 | 200+ Verified Advisors',
  description:
    'Find the best hockey advisors near you. Compare 200+ verified hockey advisors, agents, and consultants. Free advisor matching. Start your hockey career today!',
  keywords:
    'hockey advisor, hockey agent, hockey consultant, hockey recruiting, hockey family advisor, youth hockey advisor, junior hockey advisor, NCAA hockey recruiting',
}

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-hockey-blue to-blue-900 text-white py-20 md:py-32">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Find the Best <span className="text-goal-gold">Hockey Advisors</span> for Your Career
            </h1>
            <h2 className="text-2xl md:text-3xl text-blue-100 mb-8 font-semibold">
              Compare 200+ Verified Hockey Advisors, Agents & Consultants
            </h2>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Connect with verified hockey advisors who can guide your player's journey from youth
              leagues to the pros. Get expert guidance for player development, recruiting, and career
              advancement.
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
              <p className="text-2xl font-bold text-gray-800">200+</p>
              <p className="text-sm text-gray-600">Verified Advisors</p>
            </div>
            <div className="flex flex-col items-center">
              <FaShieldAlt className="text-4xl text-hockey-blue mb-2" />
              <p className="text-2xl font-bold text-gray-800">100%</p>
              <p className="text-sm text-gray-600">Verified Profiles</p>
            </div>
            <div className="flex flex-col items-center">
              <FaStar className="text-4xl text-goal-gold mb-2" />
              <p className="text-2xl font-bold text-gray-800">4.8/5</p>
              <p className="text-sm text-gray-600">Average Rating</p>
            </div>
            <div className="flex flex-col items-center">
              <FaCheckCircle className="text-4xl text-green-600 mb-2" />
              <p className="text-2xl font-bold text-gray-800">Free</p>
              <p className="text-sm text-gray-600">To Use</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <FeaturedListings />

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">How It Works</h2>
            <p className="text-gray-600">Finding the right hockey advisor is easy</p>
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
                Read reviews, check credentials, and compare services to find the perfect match for
                your needs.
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
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

      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ProfessionalService',
            name: 'The Hockey Directory',
            description:
              'Leading directory of verified hockey advisors, agents, and consultants across North America',
            url: 'https://hockeydirectory.com',
            areaServed: ['United States', 'Canada'],
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Hockey Advisor Services',
              itemListElement: [
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'Hockey Career Advising',
                  },
                },
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'Junior Hockey Recruiting',
                  },
                },
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'NCAA Hockey Recruiting',
                  },
                },
              ],
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              reviewCount: '200',
            },
          }),
        }}
      />
    </div>
  )
}
