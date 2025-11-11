'use client'

import { useState, useEffect } from 'react'
import { StarRating } from './StarRating'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Loader2, MessageSquare, Star } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Review {
  id: string
  rating: number
  title: string | null
  review_text: string
  is_verified: boolean
  created_at: string
  advisor_reply: string | null
  advisor_reply_at: string | null
  reviewer: {
    display_name: string | null
  } | null
}

interface ReviewsListProps {
  advisorId: string
  initialReviews?: Review[]
  totalCount?: number
}

type SortOption = 'newest' | 'highest' | 'lowest'

export function ReviewsList({ advisorId, initialReviews = [], totalCount = 0 }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [total, setTotal] = useState(totalCount)
  const [hasMore, setHasMore] = useState(totalCount > initialReviews.length)

  const limit = 10

  const fetchReviews = async (newPage: number, newSortBy: SortOption) => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/advisors/${advisorId}/reviews?page=${newPage}&limit=${limit}&sort=${newSortBy}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data = await response.json()

      if (newPage === 1) {
        setReviews(data.reviews)
      } else {
        setReviews(prev => [...prev, ...data.reviews])
      }

      setTotal(data.total)
      setHasMore(data.reviews.length === limit && reviews.length + data.reviews.length < data.total)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSortChange = (newSortBy: SortOption) => {
    setSortBy(newSortBy)
    setPage(1)
    fetchReviews(1, newSortBy)
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchReviews(nextPage, sortBy)
  }

  if (reviews.length === 0 && !loading) {
    return (
      <div className="space-y-4">
        <Card className="p-12 text-center bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-4">
              <Star className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Be the First to Share Your Experience
            </h3>
            <p className="text-gray-700 mb-6 max-w-md mx-auto">
              Help other hockey families by sharing your experience. Your review will help them make informed decisions about their hockey journey.
            </p>
          </div>

        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          {total} {total === 1 ? 'Review' : 'Reviews'}
        </h3>
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'newest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('newest')}
          >
            Newest
          </Button>
          <Button
            variant={sortBy === 'highest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('highest')}
          >
            Highest Rated
          </Button>
          <Button
            variant={sortBy === 'lowest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('lowest')}
          >
            Lowest Rated
          </Button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="p-6">
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

            {/* Advisor Reply */}
            {review.advisor_reply && (
              <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">Response from Advisor</span>
                  {review.advisor_reply_at && (
                    <span className="text-xs text-gray-600">
                      • {formatDistanceToNow(new Date(review.advisor_reply_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
                <p className="text-gray-800 whitespace-pre-line">{review.advisor_reply}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Load More Reviews'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
