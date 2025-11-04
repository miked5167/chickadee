import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ReviewForm } from '@/components/forms/ReviewForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface NewReviewPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: NewReviewPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: advisor } = await supabase
    .from('advisors')
    .select('name')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!advisor) {
    return {
      title: 'Advisor Not Found',
    }
  }

  return {
    title: `Write a Review for ${advisor.name} - The Hockey Directory`,
    description: `Share your experience working with ${advisor.name} to help other hockey families.`,
  }
}

export default async function NewReviewPage({ params }: NewReviewPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    // Redirect to login with return URL
    redirect(`/login?returnTo=/listings/${slug}/reviews/new`)
  }

  // Fetch advisor data
  const { data: advisor, error } = await supabase
    .from('advisors')
    .select('id, name, slug, city, state, logo_url')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error || !advisor) {
    notFound()
  }

  // Check if user has already reviewed this advisor
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('advisor_id', advisor.id)
    .eq('reviewer_id', user.id)
    .single()

  if (existingReview) {
    // User has already reviewed this advisor
    return (
      <div className="container mx-auto py-12 px-4 max-w-3xl">
        <Link href={`/listings/${advisor.slug}`}>
          <Button variant="outline" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
        </Link>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">You've Already Reviewed This Advisor</h2>
          <p className="text-gray-700 mb-6">
            You can only submit one review per advisor. If you'd like to update your review,
            please contact us.
          </p>
          <Link href={`/listings/${advisor.slug}`}>
            <Button>View Your Review</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      {/* Back Button */}
      <Link href={`/listings/${advisor.slug}`}>
        <Button variant="outline" size="sm" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>
      </Link>

      {/* Advisor Header */}
      <div className="flex items-center gap-4 mb-8">
        {advisor.logo_url && (
          <img
            src={advisor.logo_url}
            alt={`${advisor.name} logo`}
            className="w-16 h-16 rounded-lg object-cover"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold">{advisor.name}</h1>
          <p className="text-gray-600">
            {advisor.city}, {advisor.state}
          </p>
        </div>
      </div>

      {/* Review Form */}
      <ReviewForm
        advisorId={advisor.id}
        advisorName={advisor.name}
        userId={user.id}
      />

      {/* Guidelines */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-3">Review Guidelines</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li> Be honest and constructive in your feedback</li>
          <li> Focus on your personal experience</li>
          <li> Be respectful and professional</li>
          <li> Don't include personal contact information</li>
          <li> Don't use offensive or inappropriate language</li>
          <li> Don't submit fake or misleading reviews</li>
        </ul>
      </div>
    </div>
  )
}
