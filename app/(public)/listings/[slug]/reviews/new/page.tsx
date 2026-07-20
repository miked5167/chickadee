import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ReviewForm } from '@/components/forms/ReviewForm'
import { Button } from '@/components/ui/button'

interface NewReviewPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: NewReviewPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('slug', slug)
    .single()

  if (!company) return { title: 'Company Not Found' }

  return {
    title: `Write a Review for ${company.name} - The Hockey Directory`,
    description: `Share your experience working with ${company.name} to help other hockey families.`,
  }
}

export default async function NewReviewPage({ params }: NewReviewPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user }, error: authenticationError } = await supabase.auth.getUser()

  if (authenticationError || !user) {
    redirect(`/login?returnTo=/listings/${slug}/reviews/new`)
  }

  const { data: company, error } = await supabase
    .from('companies')
    .select('id, name, slug, city, state_province, logo_url')
    .eq('slug', slug)
    .single()

  if (error || !company) notFound()

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <Button asChild variant="outline" size="sm" className="mb-6">
        <Link href={`/listings/${company.slug}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Link>
      </Button>

      <div className="flex items-center gap-4 mb-8">
        {company.logo_url && (
          // This existing remote logo path cannot use next/image until its host contract is constrained.
          // eslint-disable-next-line @next/next/no-img-element
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

      <ReviewForm
        companyId={company.id}
        companyName={company.name}
        companySlug={company.slug}
      />

      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-3">Review Guidelines</h3>
        <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700">
          <li>Be honest and constructive in your feedback</li>
          <li>Focus on your personal experience</li>
          <li>Be respectful and professional</li>
          <li>Do not include personal contact information</li>
          <li>Do not use offensive or inappropriate language</li>
          <li>Do not submit fake or misleading reviews</li>
        </ul>
      </div>
    </div>
  )
}
