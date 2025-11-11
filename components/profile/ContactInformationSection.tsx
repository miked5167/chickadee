'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProfileSectionProps } from '@/types/advisor'
import { Mail, Phone, Globe } from 'lucide-react'

export function ContactInformationSection({ data, onChange, errors, mode = 'advisor' }: ProfileSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>
          {mode === 'advisor'
            ? 'How families can reach you. This information will be displayed on your public profile.'
            : 'Advisor contact information for families to reach them.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={data.email || ''}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="contact@youradvisory.com"
            className={errors?.email ? 'border-red-500' : ''}
          />
          {errors?.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
          {mode === 'advisor' && (
            <p className="text-sm text-gray-500">
              This email will be visible to families and used for contact forms
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-base font-semibold flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone || ''}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className={errors?.phone ? 'border-red-500' : ''}
          />
          {errors?.phone && (
            <p className="text-sm text-red-500">{errors.phone}</p>
          )}
          {mode === 'advisor' && (
            <p className="text-sm text-gray-500">
              Optional. Include country code for international numbers.
            </p>
          )}
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website_url" className="text-base font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Website URL
          </Label>
          <Input
            id="website_url"
            type="url"
            value={data.website_url || ''}
            onChange={(e) => onChange('website_url', e.target.value)}
            placeholder="https://www.youradvisory.com"
            className={errors?.website_url ? 'border-red-500' : ''}
          />
          {errors?.website_url && (
            <p className="text-sm text-red-500">{errors.website_url}</p>
          )}
          {mode === 'advisor' && (
            <p className="text-sm text-gray-500">
              Include the full URL including https://
            </p>
          )}
        </div>

        {/* Information Box */}
        {mode === 'advisor' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <strong>Privacy Note:</strong> All contact information entered here will be publicly visible on your profile page. Only include information you're comfortable sharing with potential clients.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
