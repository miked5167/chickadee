import Link from 'next/link'
import { FaSearch } from 'react-icons/fa'
import { Button } from '@/components/ui/button'

export default function ListingNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="text-6xl font-bold text-hockey-blue mb-4">404</div>
          <h1 className="text-3xl font-bold mb-2">Advisor Not Found</h1>
          <p className="text-gray-600 mb-8">
            We couldn't find the advisor you're looking for. They may have been removed or the link
            might be incorrect.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/listings">
            <Button variant="default" size="lg">
              <FaSearch className="mr-2" />
              Browse All Advisors
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="lg">
              Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
