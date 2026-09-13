import { createElement, StrictMode } from 'react'
import { act, render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfileViewTracker } from '@/components/listing/ProfileViewTracker'
import { recordDirectoryEvent } from '@/lib/analytics/client'
import { CONSENT_KEY, saveConsent } from '@/lib/analytics/consent'

const fetchMock = vi.fn()
beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('fetch', fetchMock.mockReset().mockResolvedValue({ ok: true }))
  window.gtag = vi.fn()
})

describe('consent-aware profile tracking', () => {
  it('does not record before consent or after consent is withdrawn', async () => {
    expect(await recordDirectoryEvent('a', 'website')).toBe(false)
    saveConsent(true)
    expect(await recordDirectoryEvent('a', 'website')).toBe(true)
    saveConsent(false)
    expect(await recordDirectoryEvent('a', 'phone')).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(window.gtag).toHaveBeenCalledTimes(1)
  })
  it('records the initial profile when consent is accepted, without duplicate strict-mode events', async () => {
    render(createElement(StrictMode, null, createElement(ProfileViewTracker, { companyId: 'a' })))
    expect(fetchMock).not.toHaveBeenCalled()
    await act(async () => { saveConsent(true) })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    await act(async () => { saveConsent(true) })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toMatchObject({ click_type: 'profile_view', analytics_consent: true })
    expect(body.event_id).toMatch(/^[a-f0-9-]{36}$/)
  })
  it('responds to consent changes in another browser tab and fails closed for corrupt storage', async () => {
    render(createElement(ProfileViewTracker, { companyId: 'a' }))
    localStorage.setItem(CONSENT_KEY, '{broken')
    expect(await recordDirectoryEvent('a', 'email')).toBe(false)
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: true }))
    await act(async () => { window.dispatchEvent(new StorageEvent('storage', { key: CONSENT_KEY })) })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
  })
})
