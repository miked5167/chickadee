import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | The Hockey Directory',
  description: 'Learn about The Hockey Directory - connecting hockey families with trusted advisors across North America.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-hockey-blue via-blue-700 to-ice-blue text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              About The Hockey Directory
            </h1>
            <p className="text-xl text-blue-100">
              Connecting hockey families with trusted advisors across North America
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <div className="mb-12">
              <p className="text-xl text-gray-700 leading-relaxed font-medium">
                <strong>The Hockey Directory was born from a hockey family's journey, and the recognition that finding the right advisor shouldn't be a matter of luck.</strong>
              </p>
            </div>

            <div className="space-y-6 text-gray-700 leading-relaxed">
              <p>
                For four years, our family worked with a hockey advisor as our son navigated the competitive hockey landscape. That relationship made all the difference. When trades came up, we had someone in our corner helping us evaluate opportunities and protect our son's interests. When development decisions arose, we had expert guidance to ensure he was being looked after properly... not just as a player, but as a young person.
              </p>

              <p className="font-semibold text-gray-900">
                We were fortunate. We found an advisor who genuinely cared about our son's well-being and provided honest, informed guidance throughout his journey.
              </p>

              <p>
                But we also know that not every family has been as lucky. Through our years in competitive hockey, we've heard the stories. Families who worked with advisors who prioritized their own interests over the player's development, who provided poor guidance during critical decisions, or who simply weren't qualified to be advising hockey families in the first place.
              </p>

              <p>
                The problem wasn't that these families didn't do their research. The problem was that there was nowhere to do the research. No central platform to find qualified hockey advisors, compare their backgrounds, or read honest reviews from other hockey families who had worked with them.
              </p>

              <p className="text-xl font-bold text-hockey-blue">
                That's why we created The Hockey Directory.
              </p>
            </div>

            {/* Section: Connecting Families */}
            <div className="mt-12 p-8 bg-ice-blue rounded-lg border-l-4 border-hockey-blue">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Connecting Hockey Families With Trusted Advisors
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  The Hockey Directory is the first platform dedicated to helping hockey families find and evaluate family hockey advisors across North America. We're building the resource we wish had existed when we started our search... a trusted directory where you can find qualified advisors, understand their experience and approach, and make informed decisions based on reviews from families who have been there.
                </p>
                <p>
                  Whether you're facing player movement decisions, evaluating opportunities, navigating trades, or simply want an experienced person in your corner, finding the right hockey advisor can make all the difference. It turns a stressful, uncertain situation into one where you feel confident and in control.
                </p>
              </div>
            </div>

            {/* Section: Built By Hockey Families */}
            <div className="mt-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Built By Hockey Families, For Hockey Families
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We understand the competitive hockey world because we've lived it. As players, coaches, and parents. We know what it's like to make tough decisions about your child's hockey career, often with incomplete information and pressure to act quickly.
                </p>
                <p>
                  We also know the difference the right advisor can make. And we believe every hockey family deserves access to that same quality of guidance and support.
                </p>
                <p>
                  Our mission is simple: to ensure that hockey families across North America can find qualified, trustworthy hockey advisors. Not through luck or connections, but through transparent information and honest reviews.
                </p>
              </div>
            </div>

            {/* Closing Statement */}
            <div className="mt-12 p-8 bg-gradient-to-r from-hockey-blue to-blue-600 text-white rounded-lg text-center">
              <p className="text-2xl font-bold">
                Welcome to The Hockey Directory, where hockey families find the right advisor for their journey.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Ready to Find Your Advisor?
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/listings"
                className="inline-flex items-center justify-center px-8 py-3 bg-hockey-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Advisors
              </a>
              <a
                href="/blog"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-hockey-blue font-semibold rounded-lg border-2 border-hockey-blue hover:bg-ice-blue transition-colors"
              >
                Read Our Blog
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
