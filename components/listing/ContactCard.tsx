'use client'

import Link from 'next/link'
import { FaPhone, FaEnvelope, FaGlobe } from 'react-icons/fa'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SocialLinks } from './SocialLinks'

interface ContactCardProps {
  advisorId: string
  advisorSlug: string
  phone?: string | null
  email?: string | null
  websiteUrl?: string | null
  linkedinUrl?: string | null
  instagramUrl?: string | null
  twitterUrl?: string | null
  facebookUrl?: string | null
  youtubeUrl?: string | null
}

export function ContactCard({
  advisorId,
  advisorSlug,
  phone,
  email,
  websiteUrl,
  linkedinUrl,
  instagramUrl,
  twitterUrl,
  facebookUrl,
  youtubeUrl
}: ContactCardProps) {
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

        {/* Social Links */}
        {(linkedinUrl || instagramUrl || twitterUrl || facebookUrl || youtubeUrl) && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Connect With Us</h3>
            <SocialLinks
              linkedin={linkedinUrl}
              instagram={instagramUrl}
              twitter={twitterUrl}
              facebook={facebookUrl}
              youtube={youtubeUrl}
              size="sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
