import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/location
 * Geocode an address string to coordinates using Google Geocoding API
 */
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Address is required and must be a string' },
        { status: 400 }
      )
    }

    // Check for Google Maps API key
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Geocoding service is not configured' },
        { status: 500 }
      )
    }

    // Call Google Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`

    const response = await fetch(geocodeUrl)
    const data = await response.json()

    if (data.status === 'ZERO_RESULTS') {
      return NextResponse.json(
        { error: 'No results found for this address' },
        { status: 404 }
      )
    }

    if (data.status !== 'OK') {
      console.error('Geocoding API error:', data.status, data.error_message)
      return NextResponse.json(
        { error: 'Unable to geocode address' },
        { status: 500 }
      )
    }

    const result = data.results[0]
    const location = result.geometry.location

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
      lat: location.lat,
      lng: location.lng,
      formatted_address: result.formatted_address,
      city,
      state,
      country,
      zip_code: zipCode,
    })
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { error: 'Internal server error during geocoding' },
      { status: 500 }
    )
  }
}
