'use client'

import { useState } from 'react'
import { getCompanyLogo } from '@/lib/branding/company-logos'

type Company = { name: string; slug: string; logo_url?: string | null; website_url?: string | null }

export function ListingCardLogo({ company }: { company: Company }) {
  const logo = getCompanyLogo(company)
  return <Logo key={logo?.src || 'initials'} name={company.name} logo={logo} />
}

function Logo({ name, logo }: { name: string; logo: ReturnType<typeof getCompanyLogo> }) {
  const [failed, setFailed] = useState(false)
  const available = logo && !failed
  const words = name.trim().split(/\s+/).filter(Boolean)
  const initials = words.slice(0, 2).map((word) => Array.from(word)[0]).join('').toUpperCase() || 'HA'

  return (
    <div className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-frost sm:h-20 sm:w-20 ${available ? 'p-2' : 'bg-arena-navy text-white'}`}
      style={available ? { backgroundColor: logo.background === 'dark' ? 'var(--board-blue)' : 'white' } : undefined}>
      {available ? <img src={logo.src} alt={`${name} logo`} width={80} height={80} loading="lazy"
        className="block h-full min-h-0 w-full min-w-0 object-contain object-center" onError={() => setFailed(true)} />
        : <span role="img" aria-label={`${name} initials`} className="font-display text-3xl font-bold sm:text-4xl">{initials}</span>}
    </div>
  )
}
