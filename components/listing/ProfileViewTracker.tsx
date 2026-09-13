'use client'

import { useEffect, useRef } from 'react'
import { analyticsAllowed, subscribeToConsent } from '@/lib/analytics/consent'
import { recordDirectoryEvent } from '@/lib/analytics/client'

export function ProfileViewTracker({ companyId }: { companyId: string }) {
  const recorded = useRef<string | null>(null)
  useEffect(() => {
    const record = () => {
      if (!analyticsAllowed() || recorded.current === companyId) return
      recorded.current = companyId
      void recordDirectoryEvent(companyId, 'profile_view').then((saved) => {
        if (!saved && recorded.current === companyId) recorded.current = null
      })
    }
    record()
    return subscribeToConsent(record)
  }, [companyId])

  return null
}
