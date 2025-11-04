'use client'

import Script from 'next/script'

export function GoogleAnalytics({ measurementId }: { measurementId?: string }) {
  // Use environment variable or prop
  const gaId = measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  if (!gaId) {
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
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, eventParams)
  }
}

export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
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
