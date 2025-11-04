'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/listing/StarRating'
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Trash2,
  ExternalLink
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Review {
  id: string
  rating: number
  title: string | null
  review_text: string
  is_verified: boolean
  admin_notes: string | null
  created_at: string
  advisors: {
    name: string
    slug: string
  }
  users_public: {
    display_name: string | null
  } | null
}

export default function ModerateReviewsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'true' | 'false'>('all')
  const [ratingFilter, setRatingFilter] = useState<'all' | string>('all')
  const [expandedReview, setExpandedReview] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({})
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [verifiedFilter, ratingFilter, page])

  const fetchReviews = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        verified: verifiedFilter,
        rating: ratingFilter,
        page: page.toString(),
        limit: '50'
      })

      const response = await fetch(`/api/admin/reviews?${params}`)

      if (response.status === 401) {
        router.push('/login?returnTo=/admin/reviews')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data = await response.json()
      setReviews(data.reviews)
      setTotal(data.total)
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setError('Failed to load reviews. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleVerified = async (reviewId: string, currentStatus: boolean) => {
    setUpdating(reviewId)

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: !currentStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update review')
      }

      // Update local state
      setReviews(reviews.map(review =>
        review.id === reviewId ? { ...review, is_verified: !currentStatus } : review
      ))
    } catch (err) {
      console.error('Error updating review:', err)
      alert('Failed to update review verification status')
    } finally {
      setUpdating(null)
    }
  }

  const saveNotes = async (reviewId: string) => {
    setUpdating(reviewId)

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: editingNotes[reviewId] || '' }),
      })

      if (!response.ok) {
        throw new Error('Failed to save notes')
      }

      // Update local state
      setReviews(reviews.map(review =>
        review.id === reviewId ? { ...review, admin_notes: editingNotes[reviewId] || '' } : review
      ))

      // Clear editing state
      const newEditing = { ...editingNotes }
      delete newEditing[reviewId]
      setEditingNotes(newEditing)
    } catch (err) {
      console.error('Error saving notes:', err)
      alert('Failed to save admin notes')
    } finally {
      setUpdating(null)
    }
  }

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete review')
      }

      // Refresh the list
      await fetchReviews()
    } catch (err) {
      console.error('Error deleting review:', err)
      alert('Failed to delete review')
    }
  }

  const startEditingNotes = (reviewId: string, currentNotes: string | null) => {
    setEditingNotes({
      ...editingNotes,
      [reviewId]: currentNotes || ''
    })
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading reviews...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Moderate Reviews</h1>
          <p className="text-gray-600 mt-1">Manage and moderate all reviews</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Verified Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Status
                </label>
                <select
                  value={verifiedFilter}
                  onChange={(e) => setVerifiedFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Reviews</option>
                  <option value="true">Verified Only</option>
                  <option value="false">Unverified Only</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Reviews List */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Reviews ({total})</h2>
        </div>

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No reviews found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <StarRating rating={review.rating} size="sm" />
                          {review.is_verified ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">
                              Unverified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">
                            {review.users_public?.display_name || 'Anonymous'}
                          </span>
                          <span>•</span>
                          <Link href={`/listings/${review.advisors.slug}`} target="_blank" className="hover:text-blue-600 flex items-center gap-1">
                            {review.advisors.name}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleVerified(review.id, review.is_verified)}
                          disabled={updating === review.id}
                        >
                          {updating === review.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : review.is_verified ? (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Unverify
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Verify
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteReview(review.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    {/* Title */}
                    {review.title && (
                      <h3 className="font-semibold text-lg">{review.title}</h3>
                    )}

                    {/* Review Text */}
                    <p className="text-gray-700 whitespace-pre-line">{review.review_text}</p>

                    {/* Admin Notes Section */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          Admin Notes
                        </label>
                        {editingNotes[review.id] !== undefined && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newEditing = { ...editingNotes }
                                delete newEditing[review.id]
                                setEditingNotes(newEditing)
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveNotes(review.id)}
                              disabled={updating === review.id}
                            >
                              {updating === review.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Save Notes'
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                      {editingNotes[review.id] !== undefined ? (
                        <Textarea
                          value={editingNotes[review.id]}
                          onChange={(e) => setEditingNotes({
                            ...editingNotes,
                            [review.id]: e.target.value
                          })}
                          rows={3}
                          placeholder="Add internal notes about this review..."
                        />
                      ) : (
                        <div
                          onClick={() => startEditingNotes(review.id, review.admin_notes)}
                          className="min-h-[60px] p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          {review.admin_notes ? (
                            <p className="text-sm text-gray-700 whitespace-pre-line">{review.admin_notes}</p>
                          ) : (
                            <p className="text-sm text-gray-400">Click to add admin notes...</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 50 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, total)} of {total}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page * 50 >= total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
