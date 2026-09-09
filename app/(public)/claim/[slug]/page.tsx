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
    title: `Claim ${company.name} - The Hockey Directory`,
    description: `Claim your business listing for ${company.name} on The Hockey Directory.`,
    robots: { index: false, follow: false },
  }
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch company data
  const { data: company, error } = await supabase
    .from('companies')
    .select('id, name, slug, city, state_province, logo_url, verified_owner_id')
    .eq('slug', slug)
    .single()

  if (error || !company) {
    notFound()
  }

  if (company.verified_owner_id) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-3xl">
        <Link href={`/listings/${company.slug}`}>
          <Button variant="outline" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
        </Link>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Listing Already Claimed</h2>
          <p className="text-gray-700 mb-6">
            This listing has already been claimed by its owner. If you believe this is an error,
             return to the listing and use the correction process once it is available.
          </p>
          <Link href={`/listings/${company.slug}`}>
            <Button>Back to Listing</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Check for pending claim
  const { data: pendingClaim } = await supabase
    .from('listing_claims')
    .select('id, claim_status')
    .eq('company_id', company.id)
    .in('claim_status', ['pending', 'under_review'])
    .maybeSingle()

  if (pendingClaim) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-3xl">
        <Link href={`/listings/${company.slug}`}>
          <Button variant="outline" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
        </Link>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Claim Pending Review</h2>
          <p className="text-gray-700 mb-6">
             You already have an active claim for this listing. No ownership access is granted while the claim is pending.
          </p>
          <Link href={`/listings/${company.slug}`}>
            <Button>Back to Listing</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
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
          <div className="w-16 h-16 rounded-lg bg-white border border-gray-200 flex items-center justify-center p-1">
            <img
              src={company.logo_url}
              alt={`${company.name} logo`}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase text-arena-navy">Claim {company.name}</h1>
          <p className="text-gray-600">
            {[company.city, company.state_province].filter(Boolean).join(', ')}
          </p>
        </div>
      </div>

      {/* Claim Form */}
      <ClaimForm
        companyId={company.id}
        companyName={company.name}
        companySlug={company.slug}
      />

      {/* Benefits Section */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-3">What an approved claim establishes</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✓ Connects an authenticated account to the company listing</li>
          <li>✓ Marks the listing as claimed by the business</li>
          <li>✓ Creates the secure ownership basis for future profile-management features</li>
        </ul>
      </div>
    </div>
  )
}
