'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, MessageSquare, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Review = {
  id: string
  rating: number
  title: string | null
  review_text: string
  experience_confirmed_at: string
  created_at: string
}

export default function AdvisorReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState<'newest' | 'highest' | 'lowest'>('newest')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const dashboardResponse = await fetch('/api/advisor/dashboard')
        if (!dashboardResponse.ok) throw new Error('Your verified listing could not be found.')
        const dashboard = await dashboardResponse.json()

        const reviewsResponse = await fetch(`/api/companies/${dashboard.advisor.id}/reviews?sort=${sort}&limit=100`)
        if (!reviewsResponse.ok) throw new Error('Published reviews could not be loaded.')
        const result = await reviewsResponse.json()
        setReviews(result.reviews ?? [])
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Published reviews could not be loaded.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [sort])

  const average = useMemo(
    () => reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0,
    [reviews],
  )

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Button asChild variant="ghost" className="mb-5">
          <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to dashboard</Link>
        </Button>

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-hockey-blue">Reputation</p>
            <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-arena-navy">Published reviews</h1>
            <p className="mt-2 text-slate-600">A read-only view of reviews currently visible to families.</p>
          </div>
          <label className="text-sm font-semibold text-slate-700">
            Sort
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as typeof sort)}
              className="ml-3 rounded-md border border-slate-300 bg-white px-3 py-2"
            >
              <option value="newest">Newest</option>
              <option value="highest">Highest rating</option>
              <option value="lowest">Lowest rating</option>
            </select>
          </label>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Card><CardContent className="p-5"><div className="text-3xl font-bold text-arena-navy">{reviews.length}</div><div className="text-sm text-slate-600">Published reviews</div></CardContent></Card>
          <Card><CardContent className="p-5"><div className="flex items-center gap-2 text-3xl font-bold text-arena-navy"><Star className="h-6 w-6 fill-goal-gold text-goal-gold" />{average.toFixed(1)}</div><div className="text-sm text-slate-600">Average published rating</div></CardContent></Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-600"><Loader2 className="mr-3 h-6 w-6 animate-spin" />Loading reviews…</div>
        ) : error ? (
          <Card><CardContent className="p-8 text-center text-red-700">{error}</CardContent></Card>
        ) : reviews.length === 0 ? (
          <Card><CardContent className="p-12 text-center"><MessageSquare className="mx-auto mb-4 h-12 w-12 text-slate-400" /><h2 className="text-xl font-bold">No published reviews yet</h2><p className="mt-2 text-slate-600">New approved reviews will appear here and on your public profile.</p></CardContent></Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-lg">{review.title || 'Hockey family review'}</CardTitle>
                    <div className="flex shrink-0" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-4 w-4 ${index < review.rating ? 'fill-goal-gold text-goal-gold' : 'text-slate-300'}`} />)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line leading-7 text-slate-700">{review.review_text}</p>
                  <p className="mt-4 text-xs text-slate-500">Published {new Date(review.created_at).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <p className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
          Review replies are not enabled yet. This avoids promising a moderation feature before its rules and safeguards are complete.
        </p>
      </div>
    </div>
  )
}
