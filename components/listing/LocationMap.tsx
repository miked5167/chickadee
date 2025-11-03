'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LocationMapProps {
  latitude: number
  longitude: number
  name: string
}

declare global {
  interface Window {
    google?: typeof google
    initGoogleMaps?: () => void
  }
}

export function LocationMap({ latitude, longitude, name }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [error, setError] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    // Create the map div dynamically to avoid React managing it
    if (containerRef.current && !mapRef.current) {
      const mapDiv = document.createElement('div')
      mapDiv.className = 'absolute inset-0 rounded-lg'
      mapDiv.style.width = '100%'
      mapDiv.style.height = '100%'
      containerRef.current.appendChild(mapDiv)
      mapRef.current = mapDiv
    }
  }, [])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setError(true)
      console.error('Google Maps API key not found')
      return
    }

    const initMap = () => {
      if (!mapRef.current || !window.google?.maps || !mountedRef.current) return

      try {
        const position = { lat: latitude, lng: longitude }

        const map = new window.google.maps.Map(mapRef.current, {
          center: position,
          zoom: 12,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true,
        })

        new window.google.maps.Marker({
          position: position,
          map: map,
          title: name,
        })

        if (mountedRef.current) {
          setMapLoaded(true)
        }
      } catch (err) {
        console.error('Error initializing map:', err)
        if (mountedRef.current) {
          setError(true)
        }
      }
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initMap()
      return
    }

    // Check if script is already in the DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')

    if (existingScript) {
      // Script exists, wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval)
          initMap()
        }
      }, 100)

      return () => {
        clearInterval(checkInterval)
      }
    }

    // Load the script for the first time
    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.defer = true
    script.onload = () => {
      initMap()
    }
    script.onerror = () => {
      console.error('Failed to load Google Maps script')
      if (mountedRef.current) {
        setError(true)
      }
    }

    // Only append if not already present
    if (!document.getElementById('google-maps-script')) {
      document.head.appendChild(script)
    }

    // Don't clean up the script - leave it in the DOM for other components
  }, [latitude, longitude, name])

  if (error) {
    return null // Silently fail - map is optional
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className="w-full h-64 rounded-lg bg-gray-100 relative"
          style={{ minHeight: '256px' }}
        >
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none z-10">
              Loading map...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
