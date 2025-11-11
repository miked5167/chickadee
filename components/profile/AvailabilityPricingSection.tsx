'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ACCEPTING_CLIENTS_OPTIONS,
  TYPICAL_ENGAGEMENT_RANGES,
  PRICING_STRUCTURE_OPTIONS,
  CONSULTATION_FEE_TYPES,
  FIELD_LIMITS,
  formatPrice
} from '@/lib/constants/profile-fields'
import { ProfileSectionProps } from '@/types/advisor'
import { CheckCircle2, Clock, DollarSign, Info, AlertCircle } from 'lucide-react'

export function AvailabilityPricingSection({ data, onChange, errors, mode = 'advisor' }: ProfileSectionProps) {
  // Helper function to handle pricing structure checkboxes
  const handlePricingStructureChange = (value: string, checked: boolean) => {
    const currentStructure = data.pricing_structure || []
    const newStructure = checked
      ? [...currentStructure, value]
      : currentStructure.filter((v: string) => v !== value)
    onChange('pricing_structure', newStructure)
  }

  // Format starting price for display (convert cents to dollars)
  const formatPriceInput = (cents: number | null | undefined): string => {
    if (cents === null || cents === undefined) return ''
    return (cents / 100).toString()
  }

  // Parse starting price input (convert dollars to cents)
  const parsePriceInput = (value: string): number | null => {
    const cleaned = value.replace(/[^0-9.]/g, '')
    if (cleaned === '') return null
    const dollars = parseFloat(cleaned)
    if (isNaN(dollars)) return null
    return Math.round(dollars * 100)
  }

  // Format consultation fee for display
  const formatConsultationFee = (cents: number | null | undefined): string => {
    if (cents === null || cents === undefined) return ''
    return (cents / 100).toString()
  }

  // Parse consultation fee input
  const parseConsultationFee = (value: string): number | null => {
    const cleaned = value.replace(/[^0-9.]/g, '')
    if (cleaned === '') return null
    const dollars = parseFloat(cleaned)
    if (isNaN(dollars)) return null
    return Math.round(dollars * 100)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability, Pricing & Engagement Options</CardTitle>
        <CardDescription>
          {mode === 'advisor'
            ? 'Your availability, pricing models, and engagement types offered to families'
            : 'Advisor availability, pricing models, and engagement options'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Client Acceptance Status */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Client Acceptance Status <span className="text-red-500">*</span>
          </Label>
          <p className="text-sm text-gray-600">
            Are you currently accepting new clients?
          </p>
          <RadioGroup
            value={data.accepting_clients || 'accepting'}
            onValueChange={(value) => onChange('accepting_clients', value)}
            className="space-y-3"
          >
            {ACCEPTING_CLIENTS_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`accepting-${option.value}`} />
                <Label
                  htmlFor={`accepting-${option.value}`}
                  className="text-sm font-normal cursor-pointer flex items-center gap-2"
                >
                  {option.value === 'accepting' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  {option.value === 'waitlist' && <Clock className="w-4 h-4 text-amber-600" />}
                  {option.value === 'not_accepting' && <span className="w-4 h-4 text-red-600">✕</span>}
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors?.accepting_clients && (
            <p className="text-sm text-red-500">{errors.accepting_clients}</p>
          )}
        </div>

        {/* Typical Engagement Range */}
        <div className="space-y-2">
          <Label htmlFor="typical_engagement_range" className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Typical Engagement Range <span className="text-red-500">*</span>
          </Label>
          <p className="text-sm text-gray-600">
            What is the typical total cost for a full engagement with a family?
          </p>
          <Select
            value={data.typical_engagement_range || 'varies'}
            onValueChange={(value) => onChange('typical_engagement_range', value)}
          >
            <SelectTrigger id="typical_engagement_range" className={errors?.typical_engagement_range ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select a price range" />
            </SelectTrigger>
            <SelectContent>
              {TYPICAL_ENGAGEMENT_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.typical_engagement_range && (
            <p className="text-sm text-red-500">{errors.typical_engagement_range}</p>
          )}
          {mode === 'advisor' && (
            <p className="text-sm text-gray-500">
              Required. This helps families filter advisors by budget.
            </p>
          )}
        </div>

        {/* Pricing & Engagement Options (Multi-select) */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Pricing & Engagement Options
          </Label>
          <p className="text-sm text-gray-600">
            Select all pricing models and engagement types you offer (optional)
          </p>
          <div className="space-y-2">
            {PRICING_STRUCTURE_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`pricing-structure-${option.value}`}
                  checked={(data.pricing_structure || []).includes(option.value)}
                  onCheckedChange={(checked) => handlePricingStructureChange(option.value, checked as boolean)}
                />
                <Label
                  htmlFor={`pricing-structure-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
          {errors?.pricing_structure && (
            <p className="text-sm text-red-500">{errors.pricing_structure}</p>
          )}
        </div>

        {/* Starting Price */}
        <div className="space-y-2">
          <Label htmlFor="starting_price" className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Starting Price
          </Label>
          <p className="text-sm text-gray-600">
            Your minimum service fee or starting package price (optional)
          </p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <Input
              id="starting_price"
              type="text"
              value={formatPriceInput(data.starting_price)}
              onChange={(e) => onChange('starting_price', parsePriceInput(e.target.value))}
              placeholder="e.g., 2500"
              className={`pl-7 ${errors?.starting_price ? 'border-red-500' : ''}`}
            />
          </div>
          {errors?.starting_price && (
            <p className="text-sm text-red-500">{errors.starting_price}</p>
          )}
          {mode === 'advisor' && (
            <p className="text-sm text-gray-500">
              Optional. Range: $100 - $100,000. Leave blank if not applicable.
            </p>
          )}
        </div>

        {/* Initial Consultation Fee */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Info className="w-4 h-4" />
            Initial Consultation Fee
          </Label>
          <p className="text-sm text-gray-600">
            Do you charge for initial consultations? (optional)
          </p>

          {/* Consultation Fee Type */}
          <div className="space-y-2">
            <Label htmlFor="consultation_fee_type" className="text-sm">Consultation Type</Label>
            <Select
              value={data.consultation_fee_type || 'not-specified'}
              onValueChange={(value) => {
                const newValue = value === 'not-specified' ? null : value
                onChange('consultation_fee_type', newValue)
                // Reset amount if changing to free or null
                if (newValue === 'free' || newValue === null) {
                  onChange('consultation_fee_amount', null)
                }
              }}
            >
              <SelectTrigger id="consultation_fee_type" className={errors?.consultation_fee_type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select consultation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not-specified">Not specified</SelectItem>
                {CONSULTATION_FEE_TYPES.filter(t => t.value !== null).map((type) => (
                  <SelectItem key={type.value} value={type.value as string}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors?.consultation_fee_type && (
              <p className="text-sm text-red-500">{errors.consultation_fee_type}</p>
            )}
          </div>

          {/* Consultation Fee Amount (only show if paid or paid-applied) */}
          {(data.consultation_fee_type === 'paid' || data.consultation_fee_type === 'paid-applied') && (
            <div className="space-y-2">
              <Label htmlFor="consultation_fee_amount" className="text-sm">
                Consultation Fee Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="consultation_fee_amount"
                  type="text"
                  value={formatConsultationFee(data.consultation_fee_amount)}
                  onChange={(e) => onChange('consultation_fee_amount', parseConsultationFee(e.target.value))}
                  placeholder="e.g., 500"
                  className={`pl-7 ${errors?.consultation_fee_amount ? 'border-red-500' : ''}`}
                />
              </div>
              {errors?.consultation_fee_amount && (
                <p className="text-sm text-red-500">{errors.consultation_fee_amount}</p>
              )}
              <p className="text-sm text-gray-500">
                Range: $0 - $10,000
              </p>
            </div>
          )}
        </div>

        {/* Additional Pricing Details */}
        <div className="space-y-2">
          <Label htmlFor="pricing_details" className="text-base font-semibold flex items-center gap-2">
            <Info className="w-4 h-4" />
            Additional Pricing Details
          </Label>
          <p className="text-sm text-gray-600">
            Any additional context about your pricing (optional)
          </p>
          <Textarea
            id="pricing_details"
            value={data.pricing_details || ''}
            onChange={(e) => onChange('pricing_details', e.target.value)}
            placeholder="e.g., Package discounts available, Seasonal promotions, Payment plan options, Scholarship programs..."
            rows={4}
            maxLength={FIELD_LIMITS.MAX_PRICING_DETAILS_LENGTH}
            className={errors?.pricing_details ? 'border-red-500' : ''}
          />
          {errors?.pricing_details && (
            <p className="text-sm text-red-500">{errors.pricing_details}</p>
          )}
          <p className="text-sm text-gray-500">
            {data.pricing_details?.length || 0} / {FIELD_LIMITS.MAX_PRICING_DETAILS_LENGTH} characters
          </p>
        </div>

        {/* Help Text */}
        {mode === 'advisor' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-blue-900 font-semibold">
                  Pricing Transparency Best Practices
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Clear pricing helps families make informed decisions</li>
                  <li>You can always provide custom quotes for unique situations</li>
                  <li>Being upfront about costs builds trust from the start</li>
                  <li>Consider offering payment plans to make services accessible</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
