'use client'

import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { getCompanyLogo } from '@/lib/branding/company-logos'

type Props = {
  company: { name: string; slug: string; logo_url?: string | null; website_url?: string | null }
  className: string
  loading?: 'eager' | 'lazy'
}

export function CompanyLogo({ company, className, loading = 'eager' }: Props) {
  const logo = getCompanyLogo(company)
  return <LogoImage key={logo?.src || 'missing'} companyName={company.name} logo={logo} className={className} loading={loading} />
}

function LogoImage({ companyName, logo, className, loading }: {
  companyName: string
  logo: ReturnType<typeof getCompanyLogo>
  className: string
  loading: 'eager' | 'lazy'
}) {
  const [failed, setFailed] = useState(false)
  const available = logo && !failed
  return <div className={className} style={{ backgroundColor: available && logo.background === 'dark' ? 'var(--board-blue)' : 'white' }}>
    {available ? <img src={logo.src} alt={`${companyName} logo`} width={144} height={144} loading={loading}
      className="h-full w-full object-contain" onError={() => setFailed(true)} />
      : <div role="img" aria-label={`${failed ? 'Logo unavailable' : 'Logo not added'} for ${companyName}`} className="flex flex-col items-center gap-2 text-center text-neutral-gray">
        <Building2 size={28} aria-hidden="true" />
        <span className="font-sans text-[10px] font-semibold leading-4">{failed ? 'Logo unavailable' : 'Logo not added'}</span>
      </div>}
  </div>
}
