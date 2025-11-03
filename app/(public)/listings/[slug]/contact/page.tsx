import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ContactForm } from '@/components/forms/ContactForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface ContactPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const supabase = await createClient()

  const { data: advisor } = await supabase
    .from('advisors')
    .select('name, city, state')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!advisor) {
    return {
      title: 'Advisor Not Found',
    }
  }

  return {
    title: `Contact ${advisor.name} - The Hockey Directory`,
    description: `Send a message to ${advisor.name} in ${advisor.city}, ${advisor.state} to discuss your hockey development needs.`,
  }
}

export default async function ContactPage({ params }: ContactPageProps) {
  const supabase = await createClient()

  // Fetch advisor data
  const { data: advisor, error } = await supabase
    .from('advisors')
    .select('id, name, slug, city, state, logo_url')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (error || !advisor) {
    notFound()
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

      {/* Contact Form */}
      <ContactForm advisorId={advisor.id} advisorName={advisor.name} />

      {/* Info Box */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">What happens next?</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✓ Your message will be sent directly to {advisor.name}</li>
          <li>✓ They will receive an email notification</li>
          <li>✓ Most advisors respond within 24-48 hours</li>
          <li>✓ You&apos;ll receive their response via email</li>
        </ul>
      </div>
    </div>
  )
}
