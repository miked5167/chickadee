'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

const CONSENT_KEY = 'hockey-directory-cookie-consent'

type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    gtag?: Gtag
  }
}

export function GoogleAnalytics({ measurementId }: { measurementId?: string }) {
  const gaId = measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false)

  useEffect(() => {
    const readConsent = () => {
      try {
        const stored = localStorage.getItem(CONSENT_KEY)
        setAnalyticsAllowed(Boolean(stored && JSON.parse(stored).analytics === true))
      } catch {
        setAnalyticsAllowed(false)
      }
    }

    const handleConsentChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ analytics?: boolean }>
      setAnalyticsAllowed(customEvent.detail?.analytics === true)
    }

    readConsent()
    window.addEventListener('hockey-cookie-consent-changed', handleConsentChange)
    return () => window.removeEventListener('hockey-cookie-consent-changed', handleConsentChange)
  }, [])

  if (!gaId || !analyticsAllowed) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  )
}

// Helper functions for tracking events
export const trackEvent = (eventName: string, eventParams?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams)
  }
}

export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }
}

export const trackAdvisorView = (advisorId: string, advisorName: string) => {
  trackEvent('advisor_view', {
    advisor_id: advisorId,
    advisor_name: advisorName,
  })
}

export const trackLeadSubmission = (advisorId: string) => {
  trackEvent('lead_submission', {
    advisor_id: advisorId,
  })
}

export const trackReviewSubmission = (advisorId: string, rating: number) => {
  trackEvent('review_submission', {
    advisor_id: advisorId,
    rating: rating,
  })
}
