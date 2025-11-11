/**
 * Geocoding utilities for location services
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */

export interface GeocodedLocation {
  city: string
  state: string
  country: string
  formatted: string
  latitude: number
  longitude: number
}

export interface CachedLocation extends GeocodedLocation {
  timestamp: number
}

const CACHE_KEY = 'detectedLocation'
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

/**
 * Reverse geocode coordinates to city/state format
 * Uses OpenStreetMap Nominatim API
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodedLocation | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'User-Agent': 'HockeyDirectory/1.0', // Nominatim requires a user agent
        },
      }
    )

    if (!response.ok) {
      console.error('Reverse geocoding failed:', response.status)
      return null
    }

    const data = await response.json()

    // Extract city, state, and country from response
    const address = data.address || {}

    // Try to get city name (various possible fields)
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      'Unknown'

    // Get state/province
    const state = address.state || address.province || ''

    // Get country code
    const country = address.country_code?.toUpperCase() || ''

    // Format as "City, State" or "City, Province"
    let formatted = city
    if (state) {
      // For US/Canada, use state abbreviations if possible
      const stateAbbr = getStateAbbreviation(state, country)
      formatted = `${city}, ${stateAbbr || state}`
    } else if (country) {
      formatted = `${city}, ${country}`
    }

    return {
      city,
      state: state || '',
      country,
      formatted,
      latitude,
      longitude,
    }
  } catch (error) {
    console.error('Error reverse geocoding:', error)
    return null
  }
}

/**
 * Get cached location from sessionStorage
 * Returns null if not cached or expired
 */
export function getCachedLocation(): CachedLocation | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const location: CachedLocation = JSON.parse(cached)

    // Check if expired (older than 30 minutes)
    if (Date.now() - location.timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }

    return location
  } catch (error) {
    console.error('Error reading cached location:', error)
    return null
  }
}

/**
 * Cache location in sessionStorage
 */
export function cacheLocation(location: GeocodedLocation): void {
  try {
    const cached: CachedLocation = {
      ...location,
      timestamp: Date.now(),
    }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached))
  } catch (error) {
    console.error('Error caching location:', error)
  }
}

/**
 * Clear cached location
 */
export function clearCachedLocation(): void {
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch (error) {
    console.error('Error clearing cached location:', error)
  }
}

/**
 * Forward geocode an address to coordinates
 * Uses OpenStreetMap Nominatim API
 */
export async function geocodeAddress(
  address?: string,
  city?: string,
  state?: string,
  zipCode?: string,
  country?: string
): Promise<{
  success: boolean
  latitude?: number
  longitude?: number
  error?: string
}> {
  try {
    // Build search query
    const parts: string[] = []
    if (address) parts.push(address)
    if (city) parts.push(city)
    if (state) parts.push(state)
    if (zipCode) parts.push(zipCode)
    if (country) parts.push(country)

    if (parts.length === 0) {
      return {
        success: false,
        error: 'No address components provided',
      }
    }

    const query = parts.join(', ')
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          'User-Agent': 'HockeyDirectory/1.0',
        },
      }
    )

    if (!response.ok) {
      return {
        success: false,
        error: `Geocoding API returned ${response.status}`,
      }
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'No results found for address',
      }
    }

    const result = data[0]
    return {
      success: true,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    }
  } catch (error) {
    console.error('Error geocoding address:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown geocoding error',
    }
  }
}

/**
 * Helper to get state abbreviation if possible
 * This is a simplified version - could be expanded with a full mapping
 */
function getStateAbbreviation(stateName: string, country: string): string | null {
  // Common US states
  const usStates: Record<string, string> = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
    'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
    'Wisconsin': 'WI', 'Wyoming': 'WY',
  }

  // Canadian provinces
  const canadianProvinces: Record<string, string> = {
    'Alberta': 'AB', 'British Columbia': 'BC', 'Manitoba': 'MB',
    'New Brunswick': 'NB', 'Newfoundland and Labrador': 'NL',
    'Northwest Territories': 'NT', 'Nova Scotia': 'NS', 'Nunavut': 'NU',
    'Ontario': 'ON', 'Prince Edward Island': 'PE', 'Quebec': 'QC',
    'Saskatchewan': 'SK', 'Yukon': 'YT',
  }

  if (country === 'US') {
    return usStates[stateName] || null
  } else if (country === 'CA') {
    return canadianProvinces[stateName] || null
  }

  return null
}
