'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PROVINCES_AND_STATES, FIELD_LIMITS } from '@/lib/constants/profile-fields'
import { ProfileSectionProps } from '@/types/advisor'
import { MapPin } from 'lucide-react'

export function LocationSection({ data, onChange, errors, mode = 'advisor' }: ProfileSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Location & Service Area</CardTitle>
        <CardDescription>
          {mode === 'advisor'
            ? 'Your physical location and the geographic area you serve'
            : 'Advisor location and service area'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Street Address */}
        <div className="space-y-2">
          <Label htmlFor="address" className="text-base font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Street Address
          </Label>
          <Input
            id="address"
            value={data.address || ''}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="123 Hockey Lane"
            className={errors?.address ? 'border-red-500' : ''}
          />
          {errors?.address && (
            <p className="text-sm text-red-500">{errors.address}</p>
          )}
          {mode === 'advisor' && (
            <p className="text-sm text-gray-500">
              Optional. Your full street address (if you have a physical office).
            </p>
          )}
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city" className="text-base font-semibold">
            City <span className="text-red-500">*</span>
          </Label>
          <Input
            id="city"
            value={data.city || ''}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="Toronto"
            className={errors?.city ? 'border-red-500' : ''}
          />
          {errors?.city && (
            <p className="text-sm text-red-500">{errors.city}</p>
          )}
        </div>

        {/* Province/State and Postal Code - Two Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Province/State */}
          <div className="space-y-2">
            <Label htmlFor="state" className="text-base font-semibold">
              Province/State <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.state || ''}
              onValueChange={(value) => onChange('state', value)}
            >
              <SelectTrigger className={errors?.state ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select province/state" />
              </SelectTrigger>
              <SelectContent>
                {PROVINCES_AND_STATES.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={option.isHeader ? 'font-bold text-gray-700 bg-gray-100' : ''}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors?.state && (
              <p className="text-sm text-red-500">{errors.state}</p>
            )}
          </div>

          {/* Postal Code */}
          <div className="space-y-2">
            <Label htmlFor="zip_code" className="text-base font-semibold">
              Postal/Zip Code
            </Label>
            <Input
              id="zip_code"
              value={data.zip_code || ''}
              onChange={(e) => onChange('zip_code', e.target.value)}
              placeholder="M5H 2N2 or 12345"
              className={errors?.zip_code ? 'border-red-500' : ''}
            />
            {errors?.zip_code && (
              <p className="text-sm text-red-500">{errors.zip_code}</p>
            )}
            {mode === 'advisor' && (
              <p className="text-sm text-gray-500">
                Canadian (A1A 1A1) or US format (12345)
              </p>
            )}
          </div>
        </div>

        {/* Service Area */}
        <div className="space-y-2">
          <Label htmlFor="service_area" className="text-base font-semibold">
            Service Area <span className="text-red-500">*</span>
          </Label>
          <Input
            id="service_area"
            value={data.service_area || ''}
            onChange={(e) => onChange('service_area', e.target.value)}
            placeholder="e.g., Eastern Canada & Northeast US"
            maxLength={FIELD_LIMITS.MAX_SERVICE_AREA_LENGTH}
            className={errors?.service_area ? 'border-red-500' : ''}
          />
          {errors?.service_area && (
            <p className="text-sm text-red-500">{errors.service_area}</p>
          )}
          {mode === 'advisor' && (
            <p className="text-sm text-gray-500">
              Describe the geographic area where you provide services. Be specific but concise.
            </p>
          )}
        </div>

        {/* Information Box */}
        {mode === 'advisor' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Your location helps families find advisors near them. The service area shows where you're willing to work with clients.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
