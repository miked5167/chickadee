'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FaFilter, FaTimes, FaStar } from 'react-icons/fa'
import { DISTANCE_RADIUS_OPTIONS } from '@/lib/utils/distance'

// Common hockey advisor specialties
const SPECIALTIES = [
  'Player Development',
  'College Recruiting',
  'Showcase Guidance',
  'AAA Team Placement',
  'Prep School Selection',
  'Women\'s Hockey',
  'Goalie Training',
  'Skill Development',
  'Hockey IQ Training',
  'Off-Ice Training',
  'Mental Performance',
  'NCAA Compliance',
]

const SORT_OPTIONS = [
  { value: 'distance', label: 'Distance (closest first)' },
  { value: 'rating', label: 'Rating (highest first)' },
  { value: 'reviews', label: 'Most Reviewed' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'recent', label: 'Recently Added' },
]

const RATING_OPTIONS = [
  { value: '', label: 'Any Rating' },
  { value: '4', label: '4+ Stars' },
  { value: '3', label: '3+ Stars' },
  { value: '2', label: '2+ Stars' },
]

interface AdvisorFiltersProps {
  showLocationFilters?: boolean
}

export function AdvisorFilters({ showLocationFilters = true }: AdvisorFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Parse current filters from URL
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(() => {
    const specialtyParam = searchParams.get('specialty')
    return specialtyParam ? specialtyParam.split(',').map(s => s.trim()) : []
  })

  const [selectedRadius, setSelectedRadius] = useState<string>(() => {
    return searchParams.get('radius') || '50'
  })

  const [selectedRating, setSelectedRating] = useState<string>(() => {
    return searchParams.get('minRating') || ''
  })

  const [selectedSort, setSelectedSort] = useState<string>(() => {
    return searchParams.get('sort') || 'distance'
  })

  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    return searchParams.get('country') || ''
  })

  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Track if there are any active filters
  const hasActiveFilters =
    selectedSpecialties.length > 0 ||
    selectedRating !== '' ||
    selectedRadius !== '50' ||
    selectedCountry !== ''

  // Apply filters
  const applyFilters = () => {
    const params = new URLSearchParams()

    // Preserve location search params
    const location = searchParams.get('location')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const search = searchParams.get('search')
    const state = searchParams.get('state')

    if (location) params.set('location', location)
    if (lat) params.set('lat', lat)
    if (lng) params.set('lng', lng)
    if (search) params.set('search', search)
    if (state) params.set('state', state)

    // Add filter params
    if (selectedRadius) params.set('radius', selectedRadius)
    if (selectedSpecialties.length > 0) {
      params.set('specialty', selectedSpecialties.join(','))
    }
    if (selectedRating) params.set('minRating', selectedRating)
    if (selectedCountry) params.set('country', selectedCountry)
    if (selectedSort) params.set('sort', selectedSort)

    // Reset to page 1 when filters change
    params.set('page', '1')

    router.push(`/listings?${params.toString()}`)
    setShowMobileFilters(false)
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedSpecialties([])
    setSelectedRadius('50')
    setSelectedRating('')
    setSelectedCountry('')
    setSelectedSort('distance')

    const params = new URLSearchParams()
    const location = searchParams.get('location')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const search = searchParams.get('search')
    const state = searchParams.get('state')

    if (location) params.set('location', location)
    if (lat) params.set('lat', lat)
    if (lng) params.set('lng', lng)
    if (search) params.set('search', search)
    if (state) params.set('state', state)
    params.set('page', '1')

    router.push(`/listings?${params.toString()}`)
    setShowMobileFilters(false)
  }

  // Toggle specialty selection
  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev => {
      if (prev.includes(specialty)) {
        return prev.filter(s => s !== specialty)
      } else {
        return [...prev, specialty]
      }
    })
  }

  // Auto-apply when sort changes
  useEffect(() => {
    if (searchParams.get('sort') !== selectedSort) {
      applyFilters()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSort])

  return (
    <>
      {/* Mobile Filter Toggle Button */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full gap-2"
        >
          <FaFilter />
          Filters {hasActiveFilters && `(${selectedSpecialties.length + (selectedRating ? 1 : 0)})`}
        </Button>
      </div>

      {/* Filters Sidebar */}
      <div
        className={`
          fixed lg:relative inset-0 lg:inset-auto z-50 lg:z-auto
          bg-black/50 lg:bg-transparent
          ${showMobileFilters ? 'block' : 'hidden lg:block'}
        `}
        onClick={() => setShowMobileFilters(false)}
      >
        <div
          className="absolute lg:relative right-0 top-0 h-full lg:h-auto w-80 lg:w-full bg-white lg:bg-transparent p-4 lg:p-0 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <FaTimes />
            </button>
          </div>

          <div className="space-y-4">
            {/* Sort */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sort By</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedSort} onValueChange={setSelectedSort}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sort option" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Distance Radius - only show if location is set */}
            {showLocationFilters && searchParams.get('lat') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distance</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedRadius} onValueChange={setSelectedRadius}>
                    {DISTANCE_RADIUS_OPTIONS.map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value.toString()} id={`radius-${option.value}`} />
                        <Label htmlFor={`radius-${option.value}`} className="cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            {/* Country Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Country</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedCountry} onValueChange={setSelectedCountry}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="" id="country-any" />
                    <Label htmlFor="country-any" className="cursor-pointer">
                      Any Country
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="US" id="country-us" />
                    <Label htmlFor="country-us" className="cursor-pointer">
                      United States 🇺🇸
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CA" id="country-ca" />
                    <Label htmlFor="country-ca" className="cursor-pointer">
                      Canada 🇨🇦
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Rating Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Minimum Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedRating} onValueChange={setSelectedRating}>
                  {RATING_OPTIONS.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`rating-${option.value}`} />
                      <Label htmlFor={`rating-${option.value}`} className="flex items-center gap-1 cursor-pointer">
                        {option.value && (
                          <div className="flex items-center">
                            {Array.from({ length: parseInt(option.value) }).map((_, i) => (
                              <FaStar key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                        )}
                        <span>{option.label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Specialties Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Specialties
                  {selectedSpecialties.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({selectedSpecialties.length})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {SPECIALTIES.map(specialty => (
                    <div key={specialty} className="flex items-center space-x-2">
                      <Checkbox
                        id={`specialty-${specialty}`}
                        checked={selectedSpecialties.includes(specialty)}
                        onCheckedChange={() => toggleSpecialty(specialty)}
                      />
                      <Label
                        htmlFor={`specialty-${specialty}`}
                        className="text-sm cursor-pointer"
                      >
                        {specialty}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Apply/Clear Buttons */}
            <div className="space-y-2">
              <Button onClick={applyFilters} className="w-full">
                Apply Filters
              </Button>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline" className="w-full">
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
