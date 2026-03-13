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

  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('slug', slug)
    .single()

  if (!company) {
    return {
      title: 'Advisor Not Found',
    }
  }

  return {
    title: `Write a Review for ${company.name} - The Hockey Directory`,
    description: `Share your experience working with ${company.name} to help other hockey families.`,
  }
}

export default async function NewReviewPage({ params }: NewReviewPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(`/login?returnTo=/listings/${slug}/reviews/new`)
  }

  // Fetch company data
  const { data: company, error } = await supabase
    .from('companies')
    .select('id, name, slug, city, state_province, logo_url')
    .eq('slug', slug)
    .single()

  if (error || !company) {
    notFound()
  }

  // Check if user has already reviewed this company
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('advisor_id', company.id)
    .eq('reviewer_id', user.id)
    .single()

  if (existingReview) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-3xl">
        <Link href={`/listings/${company.slug}`}>
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
          <Link href={`/listings/${company.slug}`}>
            <Button>View Your Review</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      {/* Back Button */}
      <Link href={`/listings/${company.slug}`}>
        <Button variant="outline" size="sm" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>
      </Link>

      {/* Company Header */}
      <div className="flex items-center gap-4 mb-8">
        {company.logo_url && (
          <img
            src={company.logo_url}
            alt={`${company.name} logo`}
            className="w-16 h-16 rounded-lg object-cover"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <p className="text-gray-600">
            {[company.city, company.state_province].filter(Boolean).join(', ')}
          </p>
        </div>
      </div>

      {/* Review Form */}
      <ReviewForm
        advisorId={company.id}
        advisorName={company.name}
        userId={user.id}
      />

      {/* Guidelines */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-3">Review Guidelines</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✓ Be honest and constructive in your feedback</li>
          <li>✓ Focus on your personal experience</li>
          <li>✓ Be respectful and professional</li>
          <li>✗ Don't include personal contact information</li>
          <li>✗ Don't use offensive or inappropriate language</li>
          <li>✗ Don't submit fake or misleading reviews</li>
        </ul>
      </div>
    </div>
  )
}
