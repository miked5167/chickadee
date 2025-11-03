'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FaSearch, FaMapMarkerAlt, FaCrosshairs, FaTimes } from 'react-icons/fa'
import { Button } from '@/components/ui/button'
import { useLocation } from '@/lib/hooks/use-location'

export function SearchBar() {
  const router = useRouter()
  const [locationInput, setLocationInput] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string
    lat: number
    lng: number
    country?: string
    state?: string
  } | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const {
    getCurrentPosition,
    reverseGeocode,
    loading: geoLoading,
    error: geoError,
    latitude,
    longitude,
    permissionDenied,
    clearLocation: clearGeoLocation,
  } = useLocation()

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey || !inputRef.current) return

    // Check if Google Maps script is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeAutocomplete()
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      // Script is already loading, wait for it
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkGoogleMaps)
          initializeAutocomplete()
        }
      }, 100)

      return () => clearInterval(checkGoogleMaps)
    }

    // Load Google Maps script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=Function.prototype`
    script.async = true
    script.defer = true
    script.onload = () => {
      initializeAutocomplete()
    }
    script.onerror = () => {
      console.error('Failed to load Google Maps script')
    }
    document.head.appendChild(script)

    // Don't remove script on cleanup - other components may need it
  }, [])

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google?.maps?.places) return

    try {
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['(cities)'],
        componentRestrictions: { country: ['us', 'ca'] }, // USA and Canada only
      })

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace()
        if (place?.geometry?.location) {
          // Detect country and state from address components
          let country = ''
          let state = ''
          if (place.address_components) {
            for (const component of place.address_components) {
              if (component.types.includes('country')) {
                country = component.short_name // "US" or "CA"
              }
              if (component.types.includes('administrative_area_level_1')) {
                state = component.short_name // "ON", "QC", "MA", "NY", etc.
              }
            }
          }

          setSelectedLocation({
            name: place.formatted_address || place.name || '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            country: country,
            state: state,
          })
          setLocationInput(place.formatted_address || place.name || '')
        }
      })
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error)
    }
  }

  // Handle "Near Me" geolocation
  const handleNearMe = async () => {
    getCurrentPosition()
  }

  // When geolocation succeeds, reverse geocode and set location
  useEffect(() => {
    if (latitude && longitude) {
      reverseGeocode(latitude, longitude).then((result) => {
        if (result) {
          const locationName = result.city && result.state
            ? `${result.city}, ${result.state}`
            : result.formattedAddress || 'Your Location'

          setSelectedLocation({
            name: locationName,
            lat: latitude,
            lng: longitude,
            country: result.country || '',
            state: result.state || '',
          })
          setLocationInput(locationName)
        }
      })
    }
  }, [latitude, longitude, reverseGeocode])

  const handleClearLocation = () => {
    setLocationInput('')
    setSelectedLocation(null)
    clearGeoLocation()
  }

  // Handle popular search click - geocode the location and navigate
  const handlePopularSearch = async (locationName: string) => {
    setLocationInput(locationName)

    // If Google Maps is loaded, geocode the location
    if (window.google?.maps?.Geocoder) {
      try {
        const geocoder = new google.maps.Geocoder()
        geocoder.geocode({ address: locationName }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location
            const formattedAddress = results[0].formatted_address || locationName

            // Detect country and state from address components
            let country = ''
            let state = ''
            const addressComponents = results[0].address_components
            for (const component of addressComponents) {
              if (component.types.includes('country')) {
                country = component.short_name // "US" or "CA"
              }
              if (component.types.includes('administrative_area_level_1')) {
                state = component.short_name // "ON", "QC", "MA", "NY", etc.
              }
            }

            const locationData = {
              name: formattedAddress,
              lat: location.lat(),
              lng: location.lng(),
              country: country,
              state: state,
            }

            setSelectedLocation(locationData)

            // Immediately navigate to search results
            const params = new URLSearchParams()
            params.set('location', locationData.name)
            params.set('lat', locationData.lat.toString())
            params.set('lng', locationData.lng.toString())
            if (locationData.country) {
              params.set('country', locationData.country)
            }
            if (locationData.state) {
              params.set('state', locationData.state)
            }
            router.push(`/listings?${params.toString()}`)
          } else {
            // Fallback: just set the text without coordinates
            console.warn('Geocoding failed for:', locationName)
          }
        })
      } catch (error) {
        console.error('Error geocoding popular search:', error)
      }
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    // Build search URL with query parameters
    const params = new URLSearchParams()

    if (selectedLocation) {
      params.set('location', selectedLocation.name)
      params.set('lat', selectedLocation.lat.toString())
      params.set('lng', selectedLocation.lng.toString())

      // Auto-set country filter if detected from geocoding
      if (selectedLocation.country) {
        params.set('country', selectedLocation.country)
      }

      // Pass state for priority sorting
      if (selectedLocation.state) {
        params.set('state', selectedLocation.state)
      }
    } else if (locationInput) {
      params.set('location', locationInput)
    }

    router.push(`/listings?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-3 bg-white rounded-lg shadow-lg p-2">
        {/* Location Input */}
        <div className="flex-1 flex items-center gap-2 px-4 py-2 border-b md:border-b-0 md:border-r border-gray-200">
          <FaMapMarkerAlt className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="City, State, or ZIP"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            className="flex-1 outline-none text-gray-700 placeholder-gray-400"
          />
          {locationInput && (
            <button
              type="button"
              onClick={handleClearLocation}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Clear location"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Near Me Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleNearMe}
          disabled={geoLoading}
          className="md:w-auto whitespace-nowrap bg-white hover:bg-gray-50 text-gray-700 border-gray-300 px-8 py-6 text-lg font-semibold"
        >
          <FaCrosshairs className="mr-2" />
          {geoLoading ? 'Locating...' : 'Near Me'}
        </Button>

        {/* Search Button */}
        <Button
          type="submit"
          className="md:w-auto px-8 py-6 text-lg font-semibold"
        >
          <FaSearch className="mr-2" />
          Search Advisors
        </Button>
      </div>

      {/* Error Message */}
      {geoError && (
        <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
          {geoError}
          {permissionDenied && (
            <p className="mt-1 text-xs">
              Please enable location permissions in your browser settings or enter a location manually.
            </p>
          )}
        </div>
      )}

      {/* Selected Location Badge */}
      {selectedLocation && (
        <div className="mt-3 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-hockey-blue text-white rounded-full text-sm">
            <FaMapMarkerAlt />
            {selectedLocation.name}
            <button
              type="button"
              onClick={handleClearLocation}
              className="hover:text-gray-200"
              aria-label="Clear selected location"
            >
              <FaTimes />
            </button>
          </span>
        </div>
      )}

      {/* Popular Searches */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-300 mb-2">Popular searches:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['Boston, MA', 'Toronto, ON', 'Minneapolis, MN', 'Calgary, AB'].map((search) => (
            <button
              key={search}
              type="button"
              onClick={() => handlePopularSearch(search)}
              className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              {search}
            </button>
          ))}
        </div>
      </div>
    </form>
  )
}
