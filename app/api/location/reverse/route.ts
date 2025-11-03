import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/location/reverse
 * Reverse geocode coordinates to address using Google Geocoding API
 */
export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json()

    // Validate coordinates
    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return NextResponse.json(
        { error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180' },
        { status: 400 }
      )
    }

    // Check for Google Maps API key
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Reverse geocoding service is not configured' },
        { status: 500 }
      )
    }

    // Call Google Reverse Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`

    const response = await fetch(geocodeUrl)
    const data = await response.json()

    if (data.status === 'ZERO_RESULTS') {
      return NextResponse.json(
        { error: 'No address found for these coordinates' },
        { status: 404 }
      )
    }

    if (data.status !== 'OK') {
      console.error('Reverse geocoding API error:', data.status, data.error_message)
      return NextResponse.json(
        { error: 'Unable to reverse geocode coordinates' },
        { status: 500 }
      )
    }

    const result = data.results[0]

    // Extract city, state, country from address components
    const addressComponents = result.address_components
    let city = null
    let state = null
    let country = null
    let zipCode = null

    for (const component of addressComponents) {
      if (component.types.includes('locality')) {
        city = component.long_name
      } else if (component.types.includes('administrative_area_level_1')) {
        state = component.short_name
      } else if (component.types.includes('country')) {
        country = component.short_name
      } else if (component.types.includes('postal_code')) {
        zipCode = component.long_name
      }
    }

    return NextResponse.json({
      formatted_address: result.formatted_address,
      city,
      state,
      country,
      zip_code: zipCode,
    })
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return NextResponse.json(
      { error: 'Internal server error during reverse geocoding' },
      { status: 500 }
    )
  }
}
