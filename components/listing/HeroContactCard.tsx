import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Phone, Mail, Globe } from 'lucide-react'
import { ContactModal } from './ContactModal'

interface HeroContactCardProps {
  advisorId: string
  advisorName: string
  phone?: string | null
  email?: string | null
  websiteUrl?: string | null
}

export function HeroContactCard({
  advisorId,
  advisorName,
  phone,
  email,
  websiteUrl,
}: HeroContactCardProps) {

  return (
    <Card className="w-[280px] bg-white border border-gray-200 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow duration-200">
      <CardContent className="p-6 space-y-4">
        {/* Contact Information */}
        <div className="space-y-3">
          {/* Phone */}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-3 text-gray-700 hover:underline transition-all group"
              aria-label={`Call ${phone}`}
            >
              <div className="flex-shrink-0">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase mb-1 tracking-wide">Phone</p>
                <p className="text-sm font-medium text-gray-900 truncate">{phone}</p>
              </div>
            </a>
          )}

          {/* Email */}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-3 text-gray-700 hover:underline transition-all group"
              aria-label={`Email ${email}`}
            >
              <div className="flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase mb-1 tracking-wide">Email</p>
                <p className="text-sm font-medium text-gray-900 truncate">{email}</p>
              </div>
            </a>
          )}

          {/* Website */}
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-gray-700 hover:underline transition-all group"
              aria-label="Visit website"
            >
              <div className="flex-shrink-0">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase mb-1 tracking-wide">Website</p>
                <p className="text-sm font-medium text-gray-900 truncate">Visit Website</p>
              </div>
            </a>
          )}
        </div>

        {/* Primary CTA Button */}
        <ContactModal
          advisorId={advisorId}
          advisorName={advisorName}
          trigger={
            <Button
              size="lg"
              className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              aria-label={`Contact ${advisorName}`}
            >
              Contact Advisor
            </Button>
          }
        />
      </CardContent>
    </Card>
  )
}
