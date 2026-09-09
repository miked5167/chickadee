'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FaFilter, FaTimes } from 'react-icons/fa'

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'recent', label: 'Recently Added' },
]

const SPECIALTY_OPTIONS = [
  'College Recruiting',
  'Junior Hockey',
  'Player Development',
  'Prep School',
  'Professional',
  'Female Hockey',
]

const SERVICE_OPTIONS = ['Advisor Selection', 'Player Assessment', 'Development Planning', 'Team Placement', 'Contract Guidance', 'Family Consultation']
const PATHWAY_OPTIONS = ['Minor Hockey', 'Prep School', 'Junior Hockey', 'NCAA', 'U SPORTS', 'Professional Hockey']
const LEVEL_OPTIONS = ['Youth', 'AAA', 'Prep', 'Junior', 'College / University', 'Professional']
const LANGUAGE_OPTIONS = ['English', 'French']
const PRICING_OPTIONS = ['one-time', 'season-long', 'package-based', 'hourly', 'retainer', 'free-consultation']

const RADIUS_OPTIONS = [25, 50, 100, 250]

interface AdvisorFiltersProps {
  showLocationFilters?: boolean
}

export function AdvisorFilters({ showLocationFilters = true }: AdvisorFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedSort, setSelectedSort] = useState<string>(() => {
    return searchParams.get('sort') || 'name'
  })

  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    return searchParams.get('country') || ''
  })

  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(() => searchParams.get('specialty') || '')
  const [selectedService, setSelectedService] = useState<string>(() => searchParams.get('service') || '')
  const [selectedPathway, setSelectedPathway] = useState<string>(() => searchParams.get('pathway') || '')
  const [selectedLevel, setSelectedLevel] = useState<string>(() => searchParams.get('level') || '')
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => searchParams.get('language') || '')
  const [selectedPricing, setSelectedPricing] = useState<string>(() => searchParams.get('pricing') || '')
  const [verifiedOnly, setVerifiedOnly] = useState(() => searchParams.get('verified') === 'true')
  const [remoteOnly, setRemoteOnly] = useState(() => searchParams.get('remote') === 'true')
  const [acceptingOnly, setAcceptingOnly] = useState(() => searchParams.get('accepting') === 'true')
  const [selectedRadius, setSelectedRadius] = useState(() => searchParams.get('radius') || '100')

  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const activeFilterCount = [selectedCountry, selectedSpecialty, selectedService, selectedPathway, selectedLevel, selectedLanguage, selectedPricing, verifiedOnly ? 'verified' : '', remoteOnly ? 'remote' : '', acceptingOnly ? 'accepting' : ''].filter(Boolean).length
  const hasActiveFilters = activeFilterCount > 0

  // Apply filters
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    // Add filter params
    if (selectedCountry) params.set('country', selectedCountry)
    else params.delete('country')
    if (selectedSpecialty) params.set('specialty', selectedSpecialty)
    else params.delete('specialty')
    if (selectedService) params.set('service', selectedService)
    else params.delete('service')
    if (selectedPathway) params.set('pathway', selectedPathway)
    else params.delete('pathway')
    if (selectedLevel) params.set('level', selectedLevel)
    else params.delete('level')
    if (selectedLanguage) params.set('language', selectedLanguage)
    else params.delete('language')
    if (selectedPricing) params.set('pricing', selectedPricing)
    else params.delete('pricing')
    if (verifiedOnly) params.set('verified', 'true')
    else params.delete('verified')
    if (remoteOnly) params.set('remote', 'true')
    else params.delete('remote')
    if (acceptingOnly) params.set('accepting', 'true')
    else params.delete('accepting')
    if (showLocationFilters) params.set('radius', selectedRadius)
    if (selectedSort) params.set('sort', selectedSort)

    params.set('page', '1')

    router.push(`/listings?${params.toString()}`)
    setShowMobileFilters(false)
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedCountry('')
    setSelectedSpecialty('')
    setSelectedService('')
    setSelectedPathway('')
    setSelectedLevel('')
    setSelectedLanguage('')
    setSelectedPricing('')
    setVerifiedOnly(false)
    setRemoteOnly(false)
    setAcceptingOnly(false)
    setSelectedSort('name')

    const params = new URLSearchParams(searchParams.toString())
    params.delete('country')
    params.delete('specialty')
    params.delete('service')
    params.delete('pathway')
    params.delete('level')
    params.delete('language')
    params.delete('pricing')
    params.delete('verified')
    params.delete('remote')
    params.delete('accepting')
    params.set('sort', 'name')
    params.set('page', '1')

    router.push(`/listings?${params.toString()}`)
    setShowMobileFilters(false)
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
          Filters {hasActiveFilters && `(${activeFilterCount})`}
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
              aria-label="Close filters"
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
                    <RadioGroupItem value="CA" id="country-ca" />
                    <Label htmlFor="country-ca" className="cursor-pointer">
                      Canada
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="US" id="country-us" />
                    <Label htmlFor="country-us" className="cursor-pointer">
                      United States
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Specialty</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedSpecialty || 'any'} onValueChange={(value) => setSelectedSpecialty(value === 'any' ? '' : value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any specialty</SelectItem>
                    {SPECIALTY_OPTIONS.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Service</CardTitle></CardHeader>
              <CardContent>
                <Select value={selectedService || 'any'} onValueChange={(value) => setSelectedService(value === 'any' ? '' : value)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Any service" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any service</SelectItem>
                    {SERVICE_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Hockey pathway</CardTitle></CardHeader>
              <CardContent>
                <Select value={selectedPathway || 'any'} onValueChange={(value) => setSelectedPathway(value === 'any' ? '' : value)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Any pathway" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any pathway</SelectItem>
                    {PATHWAY_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Player level</CardTitle></CardHeader>
              <CardContent>
                <Select value={selectedLevel || 'any'} onValueChange={(value) => setSelectedLevel(value === 'any' ? '' : value)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Any level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any level</SelectItem>
                    {LEVEL_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Language & pricing</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select value={selectedLanguage || 'any'} onValueChange={(value) => setSelectedLanguage(value === 'any' ? '' : value)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Any language" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any language</SelectItem>
                    {LANGUAGE_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selectedPricing || 'any'} onValueChange={(value) => setSelectedPricing(value === 'any' ? '' : value)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Any pricing model" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any pricing model</SelectItem>
                    {PRICING_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option.replaceAll('-', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {showLocationFilters && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distance</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedRadius} onValueChange={setSelectedRadius}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RADIUS_OPTIONS.map((radius) => (
                        <SelectItem key={radius} value={String(radius)}>Within {radius} miles</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="space-y-4 pt-6">
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-arena-navy">
                  <input type="checkbox" checked={acceptingOnly} onChange={(event) => setAcceptingOnly(event.target.checked)} className="h-5 w-5 rounded border-frost text-hockey-blue" />
                  Accepting new clients
                </label>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-arena-navy">
                  <input type="checkbox" checked={remoteOnly} onChange={(event) => setRemoteOnly(event.target.checked)} className="h-5 w-5 rounded border-frost text-hockey-blue" />
                  Remote service available
                </label>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-arena-navy">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(event) => setVerifiedOnly(event.target.checked)}
                    className="h-5 w-5 rounded border-frost text-hockey-blue"
                  />
                  Business connection verified
                </label>
                <p className="mt-2 text-xs leading-5 text-neutral-gray">Shows listings whose business relationship has been confirmed. This is not an endorsement.</p>
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
