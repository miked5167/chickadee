'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { YEARS_OF_EXPERIENCE_OPTIONS, FIELD_LIMITS } from '@/lib/constants/profile-fields'
import { ProfileSectionProps } from '@/types/advisor'
import { useState } from 'react'

export function BasicInformationSection({ data, onChange, errors, mode = 'advisor' }: ProfileSectionProps) {
  const [charCount, setCharCount] = useState(data.description?.length || 0)

  const handleDescriptionChange = (value: string) => {
    setCharCount(value.length)
    onChange('description', value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>
          {mode === 'advisor'
            ? 'Your company name, description, and professional experience'
            : 'Advisor company name, description, and professional experience'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company/Advisor Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base font-semibold">
            Company/Advisor Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={data.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="e.g., Advancement Hockey Advising"
            maxLength={FIELD_LIMITS.MAX_NAME_LENGTH}
            className={errors?.name ? 'border-red-500' : ''}
          />
          {errors?.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
          {mode === 'advisor' && (
            <p className="text-sm text-gray-500">
              This is how your business will appear to families
            </p>
          )}
        </div>

        {/* Bio/Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-base font-semibold">
            Bio/Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            value={data.description || ''}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Tell families about your expertise, approach, and what makes your services unique..."
            rows={8}
            maxLength={FIELD_LIMITS.MAX_BIO_LENGTH}
            className={errors?.description ? 'border-red-500' : ''}
          />
          <div className="flex justify-between items-center">
            <div>
              {errors?.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>
            <p className={`text-sm ${charCount < FIELD_LIMITS.MIN_BIO_LENGTH ? 'text-amber-600' : charCount >= FIELD_LIMITS.MAX_BIO_LENGTH ? 'text-red-500' : 'text-gray-500'}`}>
              {charCount} / {FIELD_LIMITS.MAX_BIO_LENGTH} characters
              {charCount < FIELD_LIMITS.MIN_BIO_LENGTH && ` (minimum ${FIELD_LIMITS.MIN_BIO_LENGTH})`}
            </p>
          </div>
          {mode === 'advisor' && (
            <p className="text-sm text-gray-500">
              Tip: Include your background, specialties, and what families can expect when working with you
            </p>
          )}
        </div>

        {/* Years of Experience */}
        <div className="space-y-2">
          <Label htmlFor="years_in_business" className="text-base font-semibold">
            Years of Experience <span className="text-red-500">*</span>
          </Label>
          <Select
            value={data.years_in_business || undefined}
            onValueChange={(value) => onChange('years_in_business', value)}
          >
            <SelectTrigger className={errors?.years_in_business ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select years of experience" />
            </SelectTrigger>
            <SelectContent>
              {YEARS_OF_EXPERIENCE_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.years_in_business && (
            <p className="text-sm text-red-500">{errors.years_in_business}</p>
          )}
          {mode === 'advisor' && (
            <p className="text-sm text-gray-500">
              How long have you been advising hockey players and families?
            </p>
          )}
        </div>

        {/* Logo Upload Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Logo Upload:</strong> Logo management is handled in a separate section.
            {mode === 'advisor' && ' You can upload or change your logo in the "Media" or "Branding" tab.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
