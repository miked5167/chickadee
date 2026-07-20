'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2, Star, CheckCircle } from 'lucide-react'
import { z } from 'zod'
import { reviewSubmissionSchema } from '@/lib/reviews/validation'

interface ReviewFormProps {
  companyId: string
  companyName: string
  companySlug: string
}

export function ReviewForm({ companyId, companyName, companySlug }: ReviewFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [experienceConfirmed, setExperienceConfirmed] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate with Zod
    try {
      const formData = {
        company_id: companyId,
        rating,
        title: title || undefined,
        review_text: reviewText,
        experience_confirmed: experienceConfirmed,
      }

      reviewSubmissionSchema.parse(formData)
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message)
      } else {
        setError('Validation failed. Please check your inputs.')
      }
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          rating,
          title: title || null,
          review_text: reviewText,
          experience_confirmed: experienceConfirmed,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit review')
      }

      setSuccess(true)

      // Redirect back to listing page after 2 seconds
      setTimeout(() => {
        router.push(`/listings/${companySlug}`)
        router.refresh()
      }, 2000)
    } catch (err) {
      console.error('Error submitting review:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Review Submitted!</h3>
          <p className="text-gray-600 mb-4">
            Thank you for reviewing {companyName}. Your review is now published and helps other hockey families make informed decisions.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting you back to the listing...
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Write a Review for {companyName}</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star Rating */}
        <div>
          <Label className="mb-3 block">Rating *</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                disabled={loading}
                aria-label={`${star} star${star === 1 ? '' : 's'}`}
                aria-pressed={rating === star}
                className="transition-transform hover:scale-110 disabled:opacity-50"
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {rating === 5 && 'Excellent!'}
              {rating === 4 && 'Very Good'}
              {rating === 3 && 'Good'}
              {rating === 2 && 'Fair'}
              {rating === 1 && 'Poor'}
            </p>
          )}
        </div>

        {/* Review Title */}
        <div>
          <Label htmlFor="title">Review Title (Optional)</Label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sum up your experience in one line"
            disabled={loading}
            maxLength={100}
          />
          {title && (
            <p className="text-sm text-gray-500 mt-1">
              {title.length} / 100 characters
            </p>
          )}
        </div>

        {/* Review Text */}
        <div>
          <Label htmlFor="reviewText">Your Review *</Label>
          <textarea
            id="reviewText"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience working with this company. What did you appreciate? What could be improved? (minimum 50 characters)"
            required
            rows={6}
            disabled={loading}
            maxLength={1000}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-hockey-blue disabled:opacity-50"
          />
          <p className="text-sm text-gray-500 mt-1">
            {reviewText.length} / 50 characters minimum ({1000 - reviewText.length} remaining)
          </p>
        </div>

        {/* Experience confirmation */}
        <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg">
          <input
            type="checkbox"
            id="experience-confirmed"
            checked={experienceConfirmed}
            onChange={(e) => setExperienceConfirmed(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 mt-1 text-hockey-blue border-gray-300 rounded focus:ring-hockey-blue"
          />
          <Label htmlFor="experience-confirmed" className="text-sm">
            I confirm that this review is based on my personal experience with this company.
            I understand that fake or misleading reviews violate our{' '}
            <a href="/terms" target="_blank" className="text-hockey-blue hover:underline">
              Terms of Service
            </a>.
          </Label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={loading || rating === 0 || reviewText.trim().length < 50 || !experienceConfirmed}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            'Submit Review'
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Your review will be published immediately. It will be attributed to a Directory member without displaying your account identity.
        </p>
      </form>
    </Card>
  )
}
