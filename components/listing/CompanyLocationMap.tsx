'use client'

import { useState } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'
import type { CompanyLocationDetails } from '@/lib/maps/company-location'
import styles from './AdvisorProfile.module.css'

export function CompanyLocationMap({ location, companyName }: { location: CompanyLocationDetails; companyName: string }) {
  const [showMap, setShowMap] = useState(false)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY?.trim()
  const embedUrl = apiKey ? `https://www.google.com/maps/embed/v1/place?${new URLSearchParams({
    key: apiKey, q: location.mapQuery, zoom: location.kind === 'address' ? '15' : '10',
  })}` : null

  return <div className={styles.locationBlock}>
    <div className={styles.locationHeading}>
      <MapPin size={22} aria-hidden="true" />
      <div><p className={styles.locationLabel}>{location.kind === 'address' ? 'Listed address' : 'General area'}</p><p>{location.label}</p></div>
    </div>
    {embedUrl && <div className={styles.mapFrame}>
      {showMap ? <iframe
        title={location.kind === 'address' ? `Map of the listed address for ${companyName}` : `General area map for ${companyName}, not an office location`}
        src={embedUrl}
        width="600" height="300" loading="lazy" allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      /> : <div className={styles.mapConsent}>
        <MapPin size={30} aria-hidden="true" />
        <button type="button" onClick={() => setShowMap(true)}>Load Google map</button>
        <p>Loading the map connects your browser to Google. You can also use the links below.</p>
      </div>}
    </div>}
    <p className={styles.locationNote}>{location.kind === 'address'
      ? 'This is the address recorded in the directory, not a verified Google Business match. Confirm the address and appointment arrangements before visiting.'
      : 'Only a city or general area is listed. This is not an office location or a confirmed service area.'}</p>
    <div className={styles.mapLinks}>
      <a href={location.companySearchUrl} target="_blank" rel="noopener noreferrer">Find company on Google Maps<ExternalLink size={14} aria-hidden="true" /></a>
      <a href={location.locationUrl} target="_blank" rel="noopener noreferrer">{location.kind === 'address' ? 'View listed address' : 'View general area'}<ExternalLink size={14} aria-hidden="true" /></a>
    </div>
  </div>
}
