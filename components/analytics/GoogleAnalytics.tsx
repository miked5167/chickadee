'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { analyticsAllowed, subscribeToConsent } from '@/lib/analytics/consent'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export function GoogleAnalytics({ measurementId }: { measurementId?: string }) {
  const gaId = measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''
  const pathname = usePathname()
  const [allowed, setAllowed] = useState(false)
  const configured = useRef<string | null>(null)
  const lastPage = useRef<string | null>(null)
  const publicPage = !/^\/(admin|dashboard|research|login|signup|auth|reset-password)(\/|$)/.test(pathname || '')
  // Preview traffic belongs in Supabase's excluded development bucket.
  const enabled = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ||
    (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_VERCEL_ENV)

  useEffect(() => {
    const update = () => {
      const consent = analyticsAllowed()
      setAllowed(consent)
      if (!/^G-[A-Z0-9]+$/.test(gaId)) return
      Object.assign(window, { [`ga-disable-${gaId}`]: !consent || !enabled || !publicPage })
      if (window.gtag && configured.current === gaId) {
        window.gtag('consent', 'update', { analytics_storage: consent ? 'granted' : 'denied' })
      }
      if (!consent) lastPage.current = null
    }
    update()
    return subscribeToConsent(update)
  }, [gaId, enabled, publicPage])

  useEffect(() => {
    if (!allowed || !enabled || !publicPage || !/^G-[A-Z0-9]+$/.test(gaId)) return
    window.dataLayer ||= []
    // eslint-disable-next-line prefer-rest-params -- Preserve Google's standard Arguments command queue format.
    window.gtag ||= function () { window.dataLayer!.push(arguments) }
    if (configured.current !== gaId) {
      window.gtag('consent', 'default', {
        analytics_storage: 'granted', ad_storage: 'denied',
        ad_user_data: 'denied', ad_personalization: 'denied',
      })
      window.gtag('js', new Date())
      window.gtag('config', gaId, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false })
      configured.current = gaId
    }
    if (lastPage.current !== pathname) {
      lastPage.current = pathname
      // Omit query strings and fragments, which can contain email addresses or tokens.
      window.gtag('event', 'page_view', {
        page_location: window.location.origin + pathname,
        page_path: pathname,
        page_referrer: safePageUrl(document.referrer),
      })
    }
  }, [allowed, enabled, gaId, pathname, publicPage])

  if (!allowed || !enabled || !publicPage || !/^G-[A-Z0-9]+$/.test(gaId)) return null
  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
}

function safePageUrl(value: string) {
  try { const url = new URL(value); return url.origin + url.pathname } catch { return '' }
}

export function trackEvent(eventName: string, eventParams?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && analyticsAllowed()) window.gtag?.('event', eventName, eventParams)
}

export const trackPageView = (url: string) => trackEvent('page_view', { page_location: safePageUrl(url) })
export const trackAdvisorView = (advisorId: string, advisorName: string) => trackEvent('advisor_view', { advisor_id: advisorId, advisor_name: advisorName })
export const trackLeadSubmission = (advisorId: string) => trackEvent('generate_lead', { advisor_id: advisorId })
export const trackReviewSubmission = (advisorId: string, rating: number) => trackEvent('review_submission', { advisor_id: advisorId, rating })
