'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  CONSULTATION_FORMAT_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  RESPONSE_TIME_OPTIONS
} from '@/lib/constants/profile-fields'
import { ProfileSectionProps } from '@/types/advisor'
import { Phone, CreditCard, Clock, Globe } from 'lucide-react'

export function BusinessDetailsSection({ data, onChange, errors, mode = 'advisor' }: ProfileSectionProps) {
  const toggleArrayValue = (field: string, value: string) => {
    const currentValue = data[field as keyof typeof data] as string || ''
    const currentArray = currentValue ? currentValue.split(', ') : []

    if (currentArray.includes(value)) {
      const newArray = currentArray.filter(v => v !== value)
      onChange(field, newArray.join(', '))
    } else {
      onChange(field, [...currentArray, value].join(', '))
    }
  }

  const isChecked = (field: string, value: string) => {
    const currentValue = data[field as keyof typeof data] as string || ''
    return currentValue.split(', ').includes(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Details</CardTitle>
        <CardDescription>
          {mode === 'advisor'
            ? 'How you work with families and your business practices'
            : 'Advisor business details and practices'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Consultation Format */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Consultation Format
          </Label>
          <p className="text-sm text-gray-600">
            How do you meet with families? Select all that apply.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {CONSULTATION_FORMAT_OPTIONS.map((format) => (
              <div key={format} className="flex items-center space-x-2">
                <Checkbox
                  id={`consultation-${format}`}
                  checked={isChecked('consultation_format', format)}
                  onCheckedChange={() => toggleArrayValue('consultation_format', format)}
                />
                <Label
                  htmlFor={`consultation-${format}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {format}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payment Methods Accepted
          </Label>
          <p className="text-sm text-gray-600">
            How can families pay for your services? Select all that apply.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PAYMENT_METHOD_OPTIONS.map((method) => (
              <div key={method} className="flex items-center space-x-2">
                <Checkbox
                  id={`payment-${method}`}
                  checked={isChecked('payment_methods', method)}
                  onCheckedChange={() => toggleArrayValue('payment_methods', method)}
                />
                <Label
                  htmlFor={`payment-${method}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {method}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Response Time */}
        <div className="space-y-2">
          <Label htmlFor="response_time" className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Typical Response Time
          </Label>
          <Select
            value={data.response_time || 'Within 48 hours'}
            onValueChange={(value) => onChange('response_time', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select response time" />
            </SelectTrigger>
            <SelectContent>
              {RESPONSE_TIME_OPTIONS.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {mode === 'advisor' && (
            <p className="text-sm text-gray-500">
              How quickly do you typically respond to new inquiries?
            </p>
          )}
        </div>

        {/* Languages Spoken */}
        <div className="space-y-2">
          <Label htmlFor="languages" className="text-base font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Languages Spoken
          </Label>
          <Input
            id="languages"
            value={data.languages || ''}
            onChange={(e) => onChange('languages', e.target.value)}
            placeholder="e.g., English, French, Russian"
            className={errors?.languages ? 'border-red-500' : ''}
          />
          {errors?.languages && (
            <p className="text-sm text-red-500">{errors.languages}</p>
          )}
          {mode === 'advisor' && (
            <p className="text-sm text-gray-500">
              List all languages you can communicate in with families
            </p>
          )}
        </div>

        {/* Help Text */}
        {mode === 'advisor' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900">
              <strong>Tip:</strong> Being transparent about your business practices helps families understand how you work and sets clear expectations from the start.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
