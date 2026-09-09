'use client'

import type { ReactNode } from 'react'

export function TrackedContactLink({
  companyId,
  type,
  href,
  className,
  children,
  newWindow = false,
}: {
  companyId: string
  type: 'website' | 'email' | 'phone'
  href: string
  className?: string
  children: ReactNode
  newWindow?: boolean
}) {
  function recordClick() {
    try {
      const consent = localStorage.getItem('hockey-directory-cookie-consent')
      if (!consent || JSON.parse(consent).analytics !== true) return
    } catch {
      return
    }
    fetch(`/api/advisors/${companyId}/track-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ click_type: type }),
      keepalive: true,
    }).catch(() => undefined)
  }

  return <a href={href} onClick={recordClick} className={className} {...(newWindow ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>
}
