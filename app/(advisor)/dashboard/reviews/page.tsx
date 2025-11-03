'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StarRating } from '@/components/listing/StarRating'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  ArrowLeft,
  Star,
  CheckCircle,
  MessageSquare
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Review {
  id: string
  rating: number
  title: string | null
  review_text: string
  is_verified: boolean
  created_at: string
  reviewer: {
    display_name: string | null
  } | null
}

export default function AdvisorReviewsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [averageRating, setAverageRating] = useState(0)
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest')

  useEffect(() => {
    fetchReviews()
  }, [ratingFilter, sortBy])

  const fetchReviews = async () => {
    setLoading(true)
    setError(null)

    try {
      // First, get the advisor info to get their ID
      const dashboardResponse = await fetch('/api/advisor/dashboard')

      if (dashboardResponse.status === 401) {
        router.push('/login?returnTo=/dashboard/reviews')
        return
      }

      if (!dashboardResponse.ok) {
        throw new Error('Failed to fetch advisor information')
      }

      const dashboardData = await dashboardResponse.json()
      const advisorId = dashboardData.advisor.id
      setAverageRating(dashboardData.advisor.average_rating)

      // Now fetch reviews
      const response = await fetch(
        `/api/advisors/${advisorId}/reviews?sort=${sortBy}&limit=100`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data = await response.json()
      let filteredReviews = data.reviews

      // Filter by rating if needed
      if (ratingFilter !== 'all') {
        filteredReviews = filteredReviews.filter((r: Review) => r.rating === ratingFilter)
      }

      setReviews(filteredReviews)
      setTotal(ratingFilter === 'all' ? data.total : filteredReviews.length)
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setError('Failed to load reviews. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0]
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating - 1]++
      }
    })
    return distribution
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading reviews...</span>
      </div>
    )
  }

  const ratingDistribution = getRatingDistribution()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Your Reviews</h1>
          <p className="text-gray-600 mt-1">View all reviews from your customers</p>
        </div>

        {/* Summary Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Rating Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Average Rating */}
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">{averageRating.toFixed(1)}</div>
                <Star Rating rating={averageRating} size="lg" />
                <p className="text-gray-600 mt-2">
                  Based on {total} {total === 1 ? 'review' : 'reviews'}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = ratingDistribution[rating - 1]
                  const percentage = total > 0 ? (count / total) * 100 : 0
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-6">{rating}★</span>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Rating</label>
            <div className="flex gap-2">
              <Button
                variant={ratingFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRatingFilter('all')}
              >
                All
              </Button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <Button
                  key={rating}
                  variant={ratingFilter === rating ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRatingFilter(rating)}
                >
                  {rating}★
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Sort by</label>
            <div className="flex gap-2">
              {(['newest', 'highest', 'lowest'] as const).map((sort) => (
                <Button
                  key={sort}
                  variant={sortBy === sort ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy(sort)}
                >
                  {sort.charAt(0).toUpperCase() + sort.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No reviews yet</h3>
              <p className="text-gray-600">
                {ratingFilter === 'all'
                  ? 'Reviews from customers will appear here'
                  : `No ${ratingFilter}-star reviews found`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <StarRating rating={review.rating} size="sm" />
                          {review.is_verified && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">
                            {review.reviewer?.display_name || 'Anonymous'}
                          </span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    {review.title && (
                      <h3 className="font-semibold text-lg">{review.title}</h3>
                    )}

                    {/* Review Text */}
                    <p className="text-gray-700 whitespace-pre-line">{review.review_text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
