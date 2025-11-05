'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StarRating } from '@/components/listing/StarRating'
import {
  ChevronLeft,
  Star,
  AlertCircle,
  CheckCircle,
  TrendingUp
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// Mock reviews data
const mockReviews = [
  {
    id: '1',
    rating: 5,
    title: 'Excellent coaching and development program',
    review_text: 'My son has been working with Elite Hockey Development for 6 months and the improvement has been incredible. The coaches are professional, knowledgeable, and really care about each player\'s development. Highly recommend!',
    is_verified: true,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    reviewer: {
      display_name: 'Sarah Johnson'
    }
  },
  {
    id: '2',
    rating: 5,
    title: 'Best investment we\'ve made in our daughter\'s hockey career',
    review_text: 'The personalized training plans and attention to detail are outstanding. Our daughter made her AAA team after just 4 months of training. The college recruitment guidance has also been invaluable.',
    is_verified: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    reviewer: {
      display_name: 'Jennifer Lee'
    }
  },
  {
    id: '3',
    rating: 4,
    title: 'Great program, very professional',
    review_text: 'Very impressed with the skill development program. The only reason for 4 stars instead of 5 is the price point, but the quality is definitely there. My son\'s skating has improved dramatically.',
    is_verified: false,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    reviewer: {
      display_name: 'Robert Chen'
    }
  },
  {
    id: '4',
    rating: 5,
    title: 'Transformed my son\'s game',
    review_text: 'The coaches identified weaknesses in my son\'s game that we didn\'t even know existed. Their systematic approach to improvement is impressive. He went from AA to AAA in one season!',
    is_verified: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    reviewer: {
      display_name: 'Mike Davis'
    }
  },
  {
    id: '5',
    rating: 5,
    title: 'Highly recommend for serious players',
    review_text: 'If you want your child to reach the next level, this is the place. The combination of on-ice skills, off-ice training, and mental preparation is comprehensive. Worth every penny.',
    is_verified: true,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    reviewer: {
      display_name: 'Amanda Brown'
    }
  },
  {
    id: '6',
    rating: 4,
    title: 'Solid coaching with good results',
    review_text: 'My daughter has been training here for 3 months. The coaches are knowledgeable and the facilities are good. She\'s definitely improved, though I\'d like to see more communication about her progress.',
    is_verified: false,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    reviewer: {
      display_name: 'Chris Martinez'
    }
  },
  {
    id: '7',
    rating: 5,
    title: 'Outstanding college prep program',
    review_text: 'The college recruitment services are top-notch. They helped my son get recruited by multiple D1 schools. The connections and expertise in the college hockey world are invaluable.',
    is_verified: true,
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    reviewer: {
      display_name: 'David Thompson'
    }
  },
  {
    id: '8',
    rating: 5,
    title: 'Best decision for our hockey family',
    review_text: 'Three of my children have trained here over the years. Consistent excellence, professional staff, and real results. They truly care about developing not just players, but people.',
    is_verified: true,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    reviewer: {
      display_name: 'Emily Wilson'
    }
  }
]

const mockStats = {
  averageRating: 4.8,
  totalReviews: 23,
  ratingDistribution: {
    5: 18,
    4: 4,
    3: 1,
    2: 0,
    1: 0
  }
}

type RatingFilter = 'all' | 5 | 4 | 3 | 2 | 1
type SortOption = 'newest' | 'highest' | 'lowest'

export default function DemoReviewsPage() {
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showDemoNotice, setShowDemoNotice] = useState(true)

  // Filter reviews
  let filteredReviews = ratingFilter === 'all'
    ? mockReviews
    : mockReviews.filter(review => review.rating === ratingFilter)

  // Sort reviews
  filteredReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sortBy === 'highest') {
      return b.rating - a.rating
    } else {
      return a.rating - b.rating
    }
  })

  const getPercentage = (count: number) => {
    return ((count / mockStats.totalReviews) * 100).toFixed(0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Demo Notice Banner */}
        {showDemoNotice && (
          <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Demo Dashboard - Reviews Management</h3>
              <p className="text-sm text-blue-800">
                This demonstrates how advisors view and manage their reviews. All data is mock/demo data.
              </p>
            </div>
            <button
              onClick={() => setShowDemoNotice(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Back Button */}
        <div className="mb-6">
          <Link href="/demo/dashboard">
            <Button variant="ghost" className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Reviews</h1>
          <p className="text-gray-600">View and manage customer reviews</p>
        </div>

        {/* Rating Overview Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Rating Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Average Rating */}
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <div className="text-5xl font-bold text-gray-900">
                    {mockStats.averageRating}
                  </div>
                  <Star className="w-12 h-12 text-yellow-400 fill-yellow-400" />
                </div>
                <StarRating rating={mockStats.averageRating} size="lg" />
                <p className="text-gray-600 mt-2">
                  Based on {mockStats.totalReviews} reviews
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12">
                      <span className="text-sm font-medium">{stars}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${getPercentage(mockStats.ratingDistribution[stars as keyof typeof mockStats.ratingDistribution])}%` }}
                      />
                    </div>
                    <div className="w-12 text-sm text-gray-600 text-right">
                      {mockStats.ratingDistribution[stars as keyof typeof mockStats.ratingDistribution]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Sort */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Rating Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 self-center mr-2">Filter by:</span>
            <Button
              size="sm"
              variant={ratingFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setRatingFilter('all')}
            >
              All Reviews
            </Button>
            {[5, 4, 3, 2, 1].map((stars) => (
              <Button
                key={stars}
                size="sm"
                variant={ratingFilter === stars ? 'default' : 'outline'}
                onClick={() => setRatingFilter(stars as RatingFilter)}
                className="gap-1"
              >
                {stars} <Star className="w-3 h-3" />
              </Button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex gap-2 md:ml-auto">
            <span className="text-sm font-medium text-gray-700 self-center mr-2">Sort:</span>
            <Button
              size="sm"
              variant={sortBy === 'newest' ? 'default' : 'outline'}
              onClick={() => setSortBy('newest')}
            >
              Newest
            </Button>
            <Button
              size="sm"
              variant={sortBy === 'highest' ? 'default' : 'outline'}
              onClick={() => setSortBy('highest')}
            >
              Highest
            </Button>
            <Button
              size="sm"
              variant={sortBy === 'lowest' ? 'default' : 'outline'}
              onClick={() => setSortBy('lowest')}
            >
              Lowest
            </Button>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No reviews found</h3>
                <p className="text-gray-600">
                  {ratingFilter === 'all'
                    ? 'You haven\'t received any reviews yet.'
                    : `You don't have any ${ratingFilter}-star reviews.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredReviews.map((review) => (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  {/* Header: Rating, Name, Date */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <StarRating rating={review.rating} size="sm" />
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-medium text-gray-900">
                          {review.reviewer?.display_name || 'Anonymous'}
                        </span>
                        {review.is_verified && (
                          <div className="flex items-center gap-1 text-green-600 text-xs">
                            <CheckCircle className="w-4 h-4" />
                            <span>Verified</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Review Title */}
                  {review.title && (
                    <h4 className="font-semibold text-lg mb-2">{review.title}</h4>
                  )}

                  {/* Review Text */}
                  <p className="text-gray-700 whitespace-pre-line">{review.review_text}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Tip */}
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Improve Your Rating</h4>
                <p className="text-sm text-blue-800">
                  Respond to reviews to show you value feedback. Encourage satisfied clients to leave reviews by providing excellent service and following up after sessions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
