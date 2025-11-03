'use client'

import Link from 'next/link'
import { FaPhone, FaEnvelope, FaGlobe } from 'react-icons/fa'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ContactCardProps {
  advisorId: string
  advisorSlug: string
  phone?: string | null
  email?: string | null
  websiteUrl?: string | null
}

export function ContactCard({ advisorId, advisorSlug, phone, email, websiteUrl }: ContactCardProps) {
  const trackClick = async (clickType: 'phone' | 'email' | 'website') => {
    try {
      await fetch(`/api/advisors/${advisorId}/track-click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ click_type: clickType }),
      })
    } catch (error) {
      // Silently fail - tracking shouldn't block user action
      console.error('Click tracking failed:', error)
    }
  }

  const handlePhoneClick = () => {
    trackClick('phone')
  }

  const handleEmailClick = () => {
    trackClick('email')
  }

  const handleWebsiteClick = () => {
    trackClick('website')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {phone && (
          <a
            href={`tel:${phone}`}
            onClick={handlePhoneClick}
            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <FaPhone className="text-hockey-blue" />
            <span className="text-gray-700">{phone}</span>
          </a>
        )}

        {email && (
          <a
            href={`mailto:${email}`}
            onClick={handleEmailClick}
            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <FaEnvelope className="text-hockey-blue" />
            <span className="text-gray-700">{email}</span>
          </a>
        )}

        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWebsiteClick}
            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <FaGlobe className="text-hockey-blue" />
            <span className="text-gray-700">Visit Website</span>
          </a>
        )}

        <Link href={`/listings/${advisorSlug}/contact`} className="block mt-4">
          <Button className="w-full" size="lg">
            Contact Advisor
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
