import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ClaimForm } from '@/components/forms/ClaimForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface ClaimPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: ClaimPageProps): Promise<Metadata> {
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
    title: `Claim ${advisor.name} - The Hockey Directory`,
    description: `Claim your business listing for ${advisor.name} on The Hockey Directory.`,
  }
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch advisor data
  const { data: advisor, error } = await supabase
    .from('advisors')
    .select('id, name, slug, city, state, logo_url, is_claimed')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error || !advisor) {
    notFound()
  }

  // Check if advisor is already claimed
  if (advisor.is_claimed) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-3xl">
        <Link href={`/listings/${advisor.slug}`}>
          <Button variant="outline" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
        </Link>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Listing Already Claimed</h2>
          <p className="text-gray-700 mb-6">
            This listing has already been claimed by its owner. If you believe this is an error,
            please contact our support team.
          </p>
          <Link href={`/listings/${advisor.slug}`}>
            <Button>Back to Listing</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Check for pending claim
  const { data: pendingClaim } = await supabase
    .from('listing_claims')
    .select('id, status')
    .eq('advisor_id', advisor.id)
    .eq('status', 'pending')
    .single()

  if (pendingClaim) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-3xl">
        <Link href={`/listings/${advisor.slug}`}>
          <Button variant="outline" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
        </Link>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Claim Pending Review</h2>
          <p className="text-gray-700 mb-6">
            A claim for this listing is currently under review. We'll notify the claimant via email
            once the review is complete (typically within 2-3 business days).
          </p>
          <Link href={`/listings/${advisor.slug}`}>
            <Button>Back to Listing</Button>
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
          <div className="w-16 h-16 rounded-lg bg-white border border-gray-200 flex items-center justify-center p-1">
            <img
              src={advisor.logo_url}
              alt={`${advisor.name} logo`}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">{advisor.name}</h1>
          <p className="text-gray-600">
            {advisor.city}, {advisor.state}
          </p>
        </div>
      </div>

      {/* Claim Form */}
      <ClaimForm
        advisorId={advisor.id}
        advisorName={advisor.name}
        advisorSlug={advisor.slug}
      />

      {/* Benefits Section */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-3">Benefits of Claiming Your Listing</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✓ Respond to and manage reviews</li>
          <li>✓ Update your business information</li>
          <li>✓ View and respond to leads from interested families</li>
          <li>✓ Track profile views and engagement</li>
          <li>✓ Add photos and showcase your services</li>
          <li>✓ Gain verified business status</li>
        </ul>
      </div>
    </div>
  )
}
