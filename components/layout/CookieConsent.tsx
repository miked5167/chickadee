'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiX } from 'react-icons/fi'

import { CONSENT_KEY, saveConsent } from '@/lib/analytics/consent'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const consent = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null')
        setShowBanner(typeof consent?.analytics !== 'boolean')
      } catch { setShowBanner(true) }
      setIsLoaded(true)
    }, 0)

    const handleReset = () => setShowBanner(true)
    window.addEventListener('hockey-cookie-consent-reset', handleReset)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('hockey-cookie-consent-reset', handleReset)
    }
  }, [])

  const handleAccept = () => {
    saveConsent(true)
    setShowBanner(false)
  }

  const handleDecline = () => {
    saveConsent(false)
    setShowBanner(false)
  }

  const handleDismiss = () => {
    // Treat dismiss as decline
    handleDecline()
  }

  // Don't render anything until we've checked localStorage
  if (!isLoaded || !showBanner) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pb-2 sm:pb-5" role="region" aria-label="Cookie preferences">
      <div className="mx-auto max-w-5xl px-2 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-white/10 bg-puck-black p-4 shadow-2xl sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 sm:flex-1">
              <p className="text-sm leading-6 text-white">
                We use necessary storage for site preferences. With your permission, we also use analytics to understand how the directory is used.{' '}
                <Link
                  href="/cookie-policy"
                  className="font-medium text-goal-gold hover:text-goal-gold/80 underline"
                >
                  Learn more about cookies
                </Link>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0 sm:flex-nowrap">
              <button
                type="button"
                onClick={handleDecline}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-white/25 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10 sm:flex-none"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-hockey-blue px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-board-blue sm:flex-none"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-white transition-colors hover:text-frost"
                aria-label="Dismiss cookie banner"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CookieSettingsButton({ className = '' }: { className?: string }) {
  const reopenSettings = () => {
    saveConsent(false)
    window.dispatchEvent(new CustomEvent('hockey-cookie-consent-reset'))
  }

  return (
    <button type="button" onClick={reopenSettings} className={className}>
      Cookie settings
    </button>
  )
}
