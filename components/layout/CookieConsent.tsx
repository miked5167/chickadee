'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiX } from 'react-icons/fi'

const CONSENT_KEY = 'hockey-directory-cookie-consent'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem(CONSENT_KEY)
    if (!consent) {
      setShowBanner(true)
    }
    setIsLoaded(true)
  }, [])

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: false,
      acceptedAt: new Date().toISOString(),
    }))
    setShowBanner(false)

    // Initialize analytics here if needed
    // Example: window.gtag('consent', 'update', { analytics_storage: 'granted' })
  }

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      acceptedAt: new Date().toISOString(),
    }))
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
    <div className="fixed bottom-0 inset-x-0 z-50 pb-2 sm:pb-5">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="p-4 rounded-lg bg-puck-black shadow-lg sm:p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">
                We use cookies to improve your experience on our site. By using The Hockey Directory, you consent to our use of cookies for analytics and functionality.{' '}
                <Link
                  href="/cookie-policy"
                  className="font-medium text-goal-gold hover:text-goal-gold/80 underline"
                >
                  Learn more
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={handleDecline}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex items-center p-2 text-white hover:text-neutral-gray transition-colors"
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
