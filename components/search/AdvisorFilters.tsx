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

  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const hasActiveFilters = selectedCountry !== ''

  // Apply filters
  const applyFilters = () => {
    const params = new URLSearchParams()

    // Preserve search params
    const search = searchParams.get('search')
    const state = searchParams.get('state')

    if (search) params.set('search', search)
    if (state) params.set('state', state)

    // Add filter params
    if (selectedCountry) params.set('country', selectedCountry)
    if (selectedSort) params.set('sort', selectedSort)

    params.set('page', '1')

    router.push(`/listings?${params.toString()}`)
    setShowMobileFilters(false)
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedCountry('')
    setSelectedSort('name')

    const params = new URLSearchParams()
    const search = searchParams.get('search')
    const state = searchParams.get('state')

    if (search) params.set('search', search)
    if (state) params.set('state', state)
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
          Filters {hasActiveFilters && '(1)'}
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
