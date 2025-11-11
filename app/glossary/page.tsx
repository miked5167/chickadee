import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hockey Glossary | The Hockey Directory',
  description: 'Plain-English definitions of hockey terms, pathways, and programs to help families navigate the hockey world.',
}

export default function GlossaryPage() {
  return (
    <div className="min-h-screen bg-ice-blue">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-puck-black sm:text-6xl mb-6">
            Hockey Glossary
          </h1>
          <p className="text-xl text-neutral-gray mb-12 max-w-2xl mx-auto">
            Your comprehensive guide to hockey terminology, pathways, and programs
          </p>

          <div className="bg-white rounded-lg shadow-lg p-12 max-w-2xl mx-auto">
            <div className="mb-8">
              <svg
                className="mx-auto h-24 w-24 text-hockey-blue"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-puck-black mb-4">
              Coming Soon
            </h2>

            <p className="text-lg text-neutral-gray mb-6">
              We're building a comprehensive glossary to help hockey families understand:
            </p>

            <ul className="text-left text-neutral-gray space-y-3 mb-8 max-w-md mx-auto">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-hockey-blue mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Hockey pathways (AAA, Junior, NCAA, USports)</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-hockey-blue mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>College recruiting terms and timelines</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-hockey-blue mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Hockey development programs</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-hockey-blue mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>How to find the right advisor for your needs</span>
              </li>
            </ul>

            <p className="text-neutral-gray">
              Check back soon for plain-English definitions and guides to help you navigate your hockey journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
