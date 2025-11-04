'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Lazy load LocationMap (contains Google Maps)
const LocationMap = dynamic(
  () => import('@/components/listing/LocationMap').then(mod => ({ default: mod.LocationMap })),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Loading map...</span>
          </div>
        </CardContent>
      </Card>
    ),
    ssr: false, // Don't render on server (Google Maps requires window)
  }
)

interface LocationMapWrapperProps {
  latitude: number
  longitude: number
  name: string
}

export function LocationMapWrapper({ latitude, longitude, name }: LocationMapWrapperProps) {
  return <LocationMap latitude={latitude} longitude={longitude} name={name} />
}
