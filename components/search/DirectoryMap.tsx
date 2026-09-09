'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, MapPin } from 'lucide-react'

type MapAdvisor = {
  id: string
  slug: string
  name: string
  city: string | null
  state: string | null
  country: string
  latitude?: number | null
  longitude?: number | null
}

export function DirectoryMap({ advisors }: { advisors: MapAdvisor[] }) {
  const mapNode = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const points = useMemo(
    () => advisors.filter((advisor) => typeof advisor.latitude === 'number' && typeof advisor.longitude === 'number'),
    [advisors],
  )

  useEffect(() => {
    if (!apiKey || !points.length || !mapNode.current) return

    function draw() {
      if (!mapNode.current || !window.google?.maps) return
      const bounds = new window.google.maps.LatLngBounds()
      const map = new window.google.maps.Map(mapNode.current, {
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      })
      for (const advisor of points) {
        const position = { lat: advisor.latitude!, lng: advisor.longitude! }
        bounds.extend(position)
        const marker = new window.google.maps.Marker({ map, position, title: advisor.name })
        const safeName = advisor.name.replace(/[<>&"']/g, '')
        const safeLocation = [advisor.city, advisor.state].filter(Boolean).join(', ').replace(/[<>&"']/g, '')
        const information = new window.google.maps.InfoWindow({ content: `<strong>${safeName}</strong><br>${safeLocation}` })
        marker.addListener('click', () => information.open({ map, anchor: marker }))
      }
      map.fitBounds(bounds)
      if (points.length === 1) map.setZoom(10)
    }

    if (window.google?.maps) {
      draw()
      return
    }
    const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', draw, { once: true })
      return () => existing.removeEventListener('load', draw)
    }
    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`
    script.async = true
    script.onload = draw
    script.onerror = () => setError(true)
    document.head.appendChild(script)
  }, [apiKey, points])

  if (!points.length || !apiKey || error) {
    return <div className="rounded-xl border border-frost bg-white p-6">
      <h2 className="font-display text-2xl font-bold uppercase text-arena-navy">Map links</h2>
      <p className="mt-2 text-sm text-neutral-gray">Interactive coordinates are not available for these results. Open a location in your map provider:</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {advisors.map((advisor) => (
          <a key={advisor.id} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([advisor.name, advisor.city, advisor.state, advisor.country].filter(Boolean).join(', '))}`} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-between rounded-lg border border-frost px-3 text-sm font-bold text-board-blue hover:border-hockey-blue">
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{advisor.name}</span><ExternalLink className="h-4 w-4" />
          </a>
        ))}
      </div>
    </div>
  }

  return <div className="overflow-hidden rounded-xl border border-frost bg-white">
    <div ref={mapNode} className="h-[32rem] w-full" aria-label={`Map showing ${points.length} hockey advisor companies`} />
    <div className="grid gap-2 border-t border-frost p-4 sm:grid-cols-2">
      {points.map((advisor) => <Link key={advisor.id} href={`/listings/${advisor.slug}`} className="text-sm font-bold text-board-blue hover:text-hockey-blue">{advisor.name} — {[advisor.city, advisor.state].filter(Boolean).join(', ')}</Link>)}
    </div>
  </div>
}
