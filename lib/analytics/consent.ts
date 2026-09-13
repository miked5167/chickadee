'use client'

export const CONSENT_KEY = 'hockey-directory-cookie-consent'
export const CONSENT_EVENT = 'hockey-cookie-consent-changed'

export function analyticsAllowed(): boolean {
  try {
    return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null')?.analytics === true
  } catch { return false }
}

export function subscribeToConsent(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_KEY || event.key === null) listener()
  }
  window.addEventListener(CONSENT_EVENT, listener)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CONSENT_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function saveConsent(analytics: boolean) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      necessary: true, analytics, marketing: false, acceptedAt: new Date().toISOString(),
    }))
  } catch { /* Without a saved choice, analytics remain off. */ }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT))
}
