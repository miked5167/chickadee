/**
 * Geocoding utility using Google Maps Geocoding API
 * Converts addresses to latitude/longitude coordinates for PostGIS
 */

export interface GeocodingResult {
  latitude: number
  longitude: number
  formattedAddress: string
  success: boolean
  error?: string
}

/**
 * Geocode an address using Google Maps Geocoding API
 */
export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zipCode?: string,
  country: string = 'US'
): Promise<GeocodingResult> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return {
      latitude: 0,
      longitude: 0,
      formattedAddress: '',
      success: false,
      error: 'Google Maps API key not configured',
    }
  }

  // Build full address string
  const fullAddress = [address, city, state, zipCode, country]
    .filter(Boolean)
    .join(', ')

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        fullAddress
      )}&key=${apiKey}`
    )

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0]
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
        success: true,
      }
    } else if (data.status === 'ZERO_RESULTS') {
      return {
        latitude: 0,
        longitude: 0,
        formattedAddress: '',
        success: false,
        error: 'Address not found',
      }
    } else {
      return {
        latitude: 0,
        longitude: 0,
        formattedAddress: '',
        success: false,
        error: `Geocoding failed: ${data.status}`,
      }
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return {
      latitude: 0,
      longitude: 0,
      formattedAddress: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown geocoding error',
    }
  }
}

/**
 * Batch geocode multiple addresses with rate limiting
 * Google Maps API has a rate limit, so we add delays between requests
 */
export async function batchGeocode(
  addresses: Array<{
    id: string
    address: string
    city: string
    state: string
    zipCode?: string
    country?: string
  }>,
  delayMs: number = 200
): Promise<
  Array<{
    id: string
    result: GeocodingResult
  }>
> {
  const results: Array<{ id: string; result: GeocodingResult }> = []

  for (const addr of addresses) {
    const result = await geocodeAddress(
      addr.address,
      addr.city,
      addr.state,
      addr.zipCode,
      addr.country || 'US'
    )

    results.push({ id: addr.id, result })

    // Add delay to respect API rate limits
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return results
}

/**
 * Create PostGIS POINT geography from lat/lng
 * Returns the SQL fragment for inserting into PostGIS geography column
 */
export function createPostGISPoint(latitude: number, longitude: number): string {
  return `POINT(${longitude} ${latitude})`
}

/**
 * Validate lat/lng coordinates
 */
export function isValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude !== 0 &&
    longitude !== 0
  )
}
