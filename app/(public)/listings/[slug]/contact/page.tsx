import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ContactForm } from '@/components/forms/ContactForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface ContactPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: company } = await supabase
    .from('companies')
    .select('name, city, state_province')
    .eq('slug', slug)
    .single()

  if (!company) {
    return {
      title: 'Advisor Not Found',
    }
  }

  return {
    title: `Contact ${company.name} - The Hockey Directory`,
    description: `Send a message to ${company.name} in ${[company.city, company.state_province].filter(Boolean).join(', ')} to discuss your hockey development needs.`,
  }
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch company data
  const { data: company, error } = await supabase
    .from('companies')
    .select('id, name, slug, city, state_province, logo_url')
    .eq('slug', slug)
    .single()

  if (error || !company) {
    notFound()
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

      {/* Contact Form */}
      <ContactForm advisorId={company.id} advisorName={company.name} />

      {/* Info Box */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">What happens next?</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✓ Your message will be sent directly to {company.name}</li>
          <li>✓ They will receive an email notification</li>
          <li>✓ Most advisors respond within 24-48 hours</li>
          <li>✓ You&apos;ll receive their response via email</li>
        </ul>
      </div>
    </div>
  )
}
