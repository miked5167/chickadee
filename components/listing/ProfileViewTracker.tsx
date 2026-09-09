'use client'

import { useEffect } from 'react'

export function ProfileViewTracker({ companyId }: { companyId: string }) {
  useEffect(() => {
    try {
      const consent = localStorage.getItem('hockey-directory-cookie-consent')
      if (!consent || JSON.parse(consent).analytics !== true) return
    } catch {
      return
    }

    fetch(`/api/advisors/${companyId}/track-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ click_type: 'profile_view' }),
      keepalive: true,
    }).catch(() => undefined)
  }, [companyId])

  return null
}
