'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  SERVICES_OFFERED_OPTIONS,
  SPECIALIZATION_OPTIONS,
  ALL_SPECIALIZATIONS,
  AGE_GROUPS_OPTIONS,
  CREDENTIALS_OPTIONS,
  ALL_CREDENTIALS,
  FIELD_LIMITS
} from '@/lib/constants/profile-fields'
import { ProfileSectionProps } from '@/types/advisor'
import { Briefcase, Target, Users, Award, Star, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react'
import { useState, useEffect } from 'react'

export function ServicesExpertiseSection({ data, onChange, errors, mode = 'advisor' }: ProfileSectionProps) {
  // Helper function to check if a value exists in an array field
  const isCheckedInArray = (field: string, value: string) => {
    const currentValue = data[field as keyof typeof data] as string[] | undefined
    if (Array.isArray(currentValue)) {
      return currentValue.includes(value)
    }
    return false
  }

  // Helper function to toggle a value in an array field
  const toggleArrayItem = (field: string, value: string) => {
    const currentValue = data[field as keyof typeof data] as string[] || []

    if (currentValue.includes(value)) {
      const newArray = currentValue.filter(v => v !== value)
      onChange(field, newArray)
    } else {
      onChange(field, [...currentValue, value])
    }
  }

  // State for managing top 4 specializations
  const [topSpecializations, setTopSpecializations] = useState<string[]>([])

  // Load top specializations from data on mount
  useEffect(() => {
    const specializations = (data.specializations as string[]) || []
    // Take first 4 as the "top" ones (in the future we might store this separately)
    setTopSpecializations(specializations.slice(0, Math.min(4, specializations.length)))
  }, [])

  // Update parent when top specializations change
  useEffect(() => {
    const specializations = (data.specializations as string[]) || []
    // Reorder: top specializations first, then the rest
    const others = specializations.filter(s => !topSpecializations.includes(s))
    const reordered = [...topSpecializations, ...others]
    if (JSON.stringify(reordered) !== JSON.stringify(specializations)) {
      onChange('specializations', reordered)
    }
  }, [topSpecializations])

  const handleSpecializationToggle = (value: string) => {
    const specializations = (data.specializations as string[]) || []

    if (specializations.includes(value)) {
      // Remove from both arrays
      const newSpecializations = specializations.filter(v => v !== value)
      const newTop = topSpecializations.filter(v => v !== value)
      onChange('specializations', newSpecializations)
      setTopSpecializations(newTop)
    } else {
      // Check if we're at the limit
      if (specializations.length >= FIELD_LIMITS.TOP_SPECIALIZATIONS) {
        return // Don't add if at max
      }
      onChange('specializations', [...specializations, value])
    }
  }

  const toggleTopSpecialization = (value: string) => {
    const specializations = (data.specializations as string[]) || []
    if (!specializations.includes(value)) return // Can't mark as top if not selected

    if (topSpecializations.includes(value)) {
      setTopSpecializations(topSpecializations.filter(v => v !== value))
    } else {
      if (topSpecializations.length >= FIELD_LIMITS.TOP_SPECIALIZATIONS) {
        return // Don't add if at max
      }
      setTopSpecializations([...topSpecializations, value])
    }
  }

  const moveTopSpecializationUp = (index: number) => {
    if (index === 0) return
    const newTop = [...topSpecializations]
    const temp = newTop[index - 1]
    newTop[index - 1] = newTop[index]
    newTop[index] = temp
    setTopSpecializations(newTop)
  }

  const moveTopSpecializationDown = (index: number) => {
    if (index === topSpecializations.length - 1) return
    const newTop = [...topSpecializations]
    const temp = newTop[index + 1]
    newTop[index + 1] = newTop[index]
    newTop[index] = temp
    setTopSpecializations(newTop)
  }

  const selectedServices = (data.services_offered as string[]) || []
  const selectedSpecializations = (data.specializations as string[]) || []
  const selectedAgeGroups = (data.age_groups_served as string[]) || []
  const selectedCredentials = (data.credentials as string[]) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services & Expertise</CardTitle>
        <CardDescription>
          {mode === 'advisor'
            ? 'The services you offer and your areas of specialization'
            : 'Advisor services and areas of expertise'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Services Offered */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Services Offered <span className="text-red-500">*</span>
          </Label>
          <p className="text-sm text-gray-600">
            What services do you provide? Select at least {FIELD_LIMITS.MIN_SERVICES}.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SERVICES_OFFERED_OPTIONS.map((service) => (
              <div key={service} className="flex items-center space-x-2">
                <Checkbox
                  id={`service-${service}`}
                  checked={isCheckedInArray('services_offered', service)}
                  onCheckedChange={() => toggleArrayItem('services_offered', service)}
                />
                <Label
                  htmlFor={`service-${service}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {service}
                </Label>
              </div>
            ))}
          </div>
          {errors?.services_offered && (
            <p className="text-sm text-red-500">{errors.services_offered}</p>
          )}
          <p className={`text-sm ${selectedServices.length < FIELD_LIMITS.MIN_SERVICES ? 'text-amber-600' : 'text-gray-500'}`}>
            {selectedServices.length} selected
            {selectedServices.length < FIELD_LIMITS.MIN_SERVICES && ` (minimum ${FIELD_LIMITS.MIN_SERVICES} required)`}
          </p>
        </div>

        {/* Specializations */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            Specializations <span className="text-red-500">*</span>
          </Label>
          <p className="text-sm text-gray-600">
            Select at least {FIELD_LIMITS.MIN_SPECIALIZATIONS} specialization, then mark your top {FIELD_LIMITS.TOP_SPECIALIZATIONS} and rank them.
          </p>

          {/* Specializations by category */}
          {Object.entries(SPECIALIZATION_OPTIONS).map(([category, options]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 mt-4">{category}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                {options.map((specialization) => {
                  const isSelected = selectedSpecializations.includes(specialization)
                  const isTop = topSpecializations.includes(specialization)

                  return (
                    <div key={specialization} className="flex items-center space-x-2">
                      <Checkbox
                        id={`specialization-${specialization}`}
                        checked={isSelected}
                        onCheckedChange={() => handleSpecializationToggle(specialization)}
                        disabled={!isSelected && selectedSpecializations.length >= FIELD_LIMITS.TOP_SPECIALIZATIONS}
                      />
                      <Label
                        htmlFor={`specialization-${specialization}`}
                        className="text-sm font-normal cursor-pointer flex items-center gap-2 flex-1"
                      >
                        {specialization}
                        {isTop && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                      </Label>
                      {isSelected && (
                        <Button
                          type="button"
                          variant={isTop ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleTopSpecialization(specialization)}
                          disabled={!isTop && topSpecializations.length >= FIELD_LIMITS.TOP_SPECIALIZATIONS}
                          className="h-6 text-xs"
                        >
                          {isTop ? 'Top 4' : 'Mark Top'}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {errors?.specializations && (
            <p className="text-sm text-red-500">{errors.specializations}</p>
          )}

          <p className={`text-sm ${selectedSpecializations.length === 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {selectedSpecializations.length} / {FIELD_LIMITS.TOP_SPECIALIZATIONS} selected
          </p>

          {/* Top 4 Ranking Display */}
          {topSpecializations.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-semibold text-amber-900">
                  Your Top {topSpecializations.length} Specialization{topSpecializations.length !== 1 ? 's' : ''} (Ranked)
                </h4>
              </div>
              <p className="text-xs text-amber-700 mb-3">
                These will be prominently displayed on your profile. Use the arrows to reorder.
              </p>
              <div className="space-y-2">
                {topSpecializations.map((spec, index) => (
                  <div key={spec} className="flex items-center gap-2 bg-white p-2 rounded border border-amber-200">
                    <Badge className="text-xs bg-blue-600 text-white hover:bg-blue-700">#{index + 1}</Badge>
                    <span className="text-sm flex-1">{spec}</span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveTopSpecializationUp(index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveTopSpecializationDown(index)}
                        disabled={index === topSpecializations.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {topSpecializations.length < FIELD_LIMITS.TOP_SPECIALIZATIONS && (
                <p className="text-xs text-amber-700 mt-2">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  Select {FIELD_LIMITS.TOP_SPECIALIZATIONS - topSpecializations.length} more to reach the recommended {FIELD_LIMITS.TOP_SPECIALIZATIONS} top specializations.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Age Groups Served */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />
            Age Groups Served <span className="text-red-500">*</span>
          </Label>
          <p className="text-sm text-gray-600">
            Which age groups do you work with? Select at least {FIELD_LIMITS.MIN_AGE_GROUPS}.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AGE_GROUPS_OPTIONS.map((ageGroup) => (
              <div key={ageGroup} className="flex items-center space-x-2">
                <Checkbox
                  id={`age-${ageGroup}`}
                  checked={isCheckedInArray('age_groups_served', ageGroup)}
                  onCheckedChange={() => toggleArrayItem('age_groups_served', ageGroup)}
                />
                <Label
                  htmlFor={`age-${ageGroup}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {ageGroup}
                </Label>
              </div>
            ))}
          </div>
          {errors?.age_groups_served && (
            <p className="text-sm text-red-500">{errors.age_groups_served}</p>
          )}
          <p className={`text-sm ${selectedAgeGroups.length < FIELD_LIMITS.MIN_AGE_GROUPS ? 'text-amber-600' : 'text-gray-500'}`}>
            {selectedAgeGroups.length} selected
            {selectedAgeGroups.length < FIELD_LIMITS.MIN_AGE_GROUPS && ` (minimum ${FIELD_LIMITS.MIN_AGE_GROUPS} required)`}
          </p>
        </div>

        {/* Credentials */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Award className="w-4 h-4" />
            Credentials & Certifications
          </Label>
          <p className="text-sm text-gray-600">
            Select all credentials and certifications that apply to you.
          </p>

          {/* Credentials by category */}
          {Object.entries(CREDENTIALS_OPTIONS).map(([category, options]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 mt-4">{category}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                {options.map((credential) => (
                  <div key={credential} className="flex items-center space-x-2">
                    <Checkbox
                      id={`credential-${credential}`}
                      checked={isCheckedInArray('credentials', credential)}
                      onCheckedChange={() => toggleArrayItem('credentials', credential)}
                    />
                    <Label
                      htmlFor={`credential-${credential}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {credential}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {errors?.credentials && (
            <p className="text-sm text-red-500">{errors.credentials}</p>
          )}
          <p className="text-sm text-gray-500">
            {selectedCredentials.length} selected
          </p>
        </div>

        {/* Help Text */}
        {mode === 'advisor' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Tip:</strong> Be thorough but honest about your services and expertise. Families will use these details to find advisors who match their specific needs.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
