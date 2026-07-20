'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, Star } from 'lucide-react'
import { StarRating } from './StarRating'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Review {
  id: string
  rating: number
  title: string | null
  review_text: string
  created_at: string
}

interface ReviewsListProps {
  companyId: string
  companySlug: string
}

type SortOption = 'newest' | 'highest' | 'lowest'

export function ReviewsList({ companyId, companySlug }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 10

  const fetchReviews = useCallback(async (newPage: number, newSortBy: SortOption) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/companies/${companyId}/reviews?page=${newPage}&limit=${limit}&sort=${newSortBy}`,
      )
      if (!response.ok) throw new Error('Reviews could not be loaded.')

      const data = await response.json() as { reviews: Review[]; total: number }
      setReviews((current) => newPage === 1 ? data.reviews : [...current, ...data.reviews])
      setTotal(data.total)
      setHasMore(newPage * limit < data.total)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Reviews could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    void fetchReviews(1, 'newest')
  }, [fetchReviews])

  const handleSortChange = (newSortBy: SortOption) => {
    setSortBy(newSortBy)
    setPage(1)
    void fetchReviews(1, newSortBy)
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    void fetchReviews(nextPage, sortBy)
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-600" role="status">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading reviews…
      </div>
    )
  }

  if (error && reviews.length === 0) {
    return <p className="py-8 text-center text-red-700" role="alert">{error}</p>
  }

  if (reviews.length === 0) {
    return (
      <Card className="p-12 text-center bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-4">
          <Star className="w-10 h-10 text-amber-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Be the First to Share Your Experience</h3>
        <p className="text-gray-700 mb-6 max-w-md mx-auto">
          Help other hockey families make informed decisions by sharing your experience.
        </p>
        <Button asChild>
          <Link href={`/listings/${companySlug}/reviews/new`}>Write a Review</Link>
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xl font-semibold">{total} {total === 1 ? 'Review' : 'Reviews'}</h3>
        <div className="flex flex-wrap gap-2" aria-label="Sort reviews">
          {(['newest', 'highest', 'lowest'] as const).map((option) => (
            <Button
              key={option}
              variant={sortBy === option ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortChange(option)}
            >
              {option === 'newest' ? 'Newest' : option === 'highest' ? 'Highest Rated' : 'Lowest Rated'}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="p-6" data-testid="review">
            <div className="flex items-start justify-between mb-3">
              <div>
                <StarRating rating={review.rating} size="sm" />
                <span className="mt-2 block font-medium text-gray-900">Directory member</span>
              </div>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </span>
            </div>
            {review.title && <h4 className="font-semibold text-lg mb-2">{review.title}</h4>}
            <p className="text-gray-700 whitespace-pre-line">{review.review_text}</p>
          </Card>
        ))}
      </div>

      {error && <p className="text-center text-red-700" role="alert">{error}</p>}
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Loading…</> : 'Load More Reviews'}
          </Button>
        </div>
      )}

      <div className="text-center">
        <Button asChild variant="outline">
          <Link href={`/listings/${companySlug}/reviews/new`}>Write a Review</Link>
        </Button>
      </div>
    </div>
  )
}
