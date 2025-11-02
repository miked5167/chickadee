import { Metadata } from 'next'
import { SearchBar } from '@/components/search/SearchBar'
import { FeaturedListings } from '@/components/listing/FeaturedListings'
import { FaCheckCircle, FaUsers, FaShieldAlt, FaStar, FaQuoteLeft } from 'react-icons/fa'

export const metadata: Metadata = {
  title: 'The Hockey Directory - Find Top Hockey Advisors Near You',
  description:
    'Connect with 200+ verified hockey advisors across North America. Get expert guidance for AAA team placement, prep school selection, college recruiting, and elite player development.',
}

export default function HomePage() {
  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'The Hockey Directory',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://thehockeydirectory.com',
    description: 'Find and connect with verified hockey advisors across North America',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://thehockeydirectory.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'The Hockey Directory',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://thehockeydirectory.com',
    logo: typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : 'https://thehockeydirectory.com/logo.png',
    description: 'North America\'s trusted directory of hockey advisors and development professionals',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '200',
    },
  }

  return (
    <div>
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
              Find Your Perfect
              <br />
              <span className="text-goal-gold">Hockey Advisor</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Connect with verified hockey advisors who can guide your player's journey from youth
              leagues to the pros
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

      {/* Testimonials Section */}
      <section className="py-16 bg-ice-blue">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">What Families Are Saying</h2>
            <p className="text-gray-600">
              Hear from hockey families who found the right guidance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar key={star} className="text-yellow-400 fill-yellow-400 w-5 h-5" />
                ))}
              </div>
              <FaQuoteLeft className="text-hockey-blue text-2xl mb-4 opacity-20" />
              <p className="text-gray-700 mb-6 italic">
                "Finding the right advisor made all the difference in our son's journey to AAA hockey. The directory connected us with someone who truly understood the pathway."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                  SM
                </div>
                <div>
                  <p className="font-semibold">Sarah M.</p>
                  <p className="text-sm text-gray-500">Hockey Parent, Toronto</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar key={star} className="text-yellow-400 fill-yellow-400 w-5 h-5" />
                ))}
              </div>
              <FaQuoteLeft className="text-hockey-blue text-2xl mb-4 opacity-20" />
              <p className="text-gray-700 mb-6 italic">
                "The advisor we found through this platform helped navigate the prep school process. Their expertise and connections were invaluable to our family."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                  JR
                </div>
                <div>
                  <p className="font-semibold">James R.</p>
                  <p className="text-sm text-gray-500">Hockey Parent, Boston</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar key={star} className="text-yellow-400 fill-yellow-400 w-5 h-5" />
                ))}
              </div>
              <FaQuoteLeft className="text-hockey-blue text-2xl mb-4 opacity-20" />
              <p className="text-gray-700 mb-6 italic">
                "As first-time hockey parents, we had no idea where to start. The directory helped us find an advisor who answered all our questions and set realistic expectations."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                  MC
                </div>
                <div>
                  <p className="font-semibold">Maria C.</p>
                  <p className="text-sm text-gray-500">Hockey Parent, Chicago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
    </div>
  )
}
