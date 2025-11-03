'use client'

import { useState, useCallback } from 'react'

export interface LocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  loading: boolean
  error: string | null
  permissionDenied: boolean
}

export interface ReverseGeocodedLocation {
  city: string | null
  state: string | null
  country: string | null
  formattedAddress: string | null
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
    permissionDenied: false,
  })

  /**
   * Get the user's current position using the browser's Geolocation API
   */
  const getCurrentPosition = useCallback(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }))
      return
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      permissionDenied: false,
    }))

    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
          permissionDenied: false,
        })
      },
      // Error callback
      (error) => {
        let errorMessage = 'Unable to retrieve your location'
        let permissionDenied = false

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.'
            permissionDenied = true
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please try again.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.'
            break
          default:
            errorMessage = 'An unknown error occurred while retrieving your location.'
        }

        setState({
          latitude: null,
          longitude: null,
          accuracy: null,
          loading: false,
          error: errorMessage,
          permissionDenied,
        })
      },
      // Options
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 0, // Don't use cached position
      }
    )
  }, [])

  /**
   * Reverse geocode coordinates to get address information
   * Uses our API route which calls Google Geocoding API
   */
  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<ReverseGeocodedLocation | null> => {
      try {
        const response = await fetch('/api/location/reverse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ lat, lng }),
        })

        if (!response.ok) {
          console.error('Reverse geocoding failed:', response.statusText)
          return null
        }

        const data = await response.json()
        return {
          city: data.city || null,
          state: data.state || null,
          country: data.country || null,
          formattedAddress: data.formatted_address || null,
        }
      } catch (error) {
        console.error('Error reverse geocoding:', error)
        return null
      }
    },
    []
  )

  /**
   * Clear the current location state
   */
  const clearLocation = useCallback(() => {
    setState({
      latitude: null,
      longitude: null,
      accuracy: null,
      loading: false,
      error: null,
      permissionDenied: false,
    })
  }, [])

  return {
    ...state,
    getCurrentPosition,
    reverseGeocode,
    clearLocation,
    hasLocation: state.latitude !== null && state.longitude !== null,
  }
}
