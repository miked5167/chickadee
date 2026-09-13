'use client'

import { analyticsAllowed } from './consent'

export type DirectoryEvent = 'profile_view' | 'website' | 'email' | 'phone'

export async function recordDirectoryEvent(companyId: string, type: DirectoryEvent, eventId = crypto.randomUUID()) {
  if (!analyticsAllowed()) return false
  window.gtag?.('event', type === 'profile_view' ? 'advisor_view' : `${type}_click`, { company_id: companyId })
  try {
    const response = await fetch(`/api/advisors/${companyId}/track-click`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ click_type: type, event_id: eventId, analytics_consent: true, referrer: document.referrer || undefined }),
      keepalive: true,
    })
    return response.ok
  } catch { return false }
}
