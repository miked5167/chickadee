import { createElement } from 'react'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const route = vi.hoisted(() => ({ pathname: '/listings/advisor' }))
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }))
vi.mock('next/script', () => ({ default: () => createElement('div', { 'data-testid': 'google-script' }) }))
import { GoogleAnalytics, trackLeadSubmission } from '@/components/analytics/GoogleAnalytics'
import { saveConsent } from '@/lib/analytics/consent'

beforeEach(() => {
  localStorage.clear()
  window.gtag = vi.fn()
  route.pathname = '/listings/advisor'
  vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production')
})
afterEach(() => vi.unstubAllEnvs())

describe('Google Analytics', () => {
  it('starts only after consent, tracks SPA navigation, and stops after withdrawal', async () => {
    const element = () => createElement(GoogleAnalytics, { measurementId: 'G-TEST123' })
    const view = render(element())
    expect(screen.queryByTestId('google-script')).not.toBeInTheDocument()
    expect(window.gtag).not.toHaveBeenCalled()
    await act(async () => { saveConsent(true) })
    expect(screen.getByTestId('google-script')).toBeInTheDocument()
    expect(window.gtag).toHaveBeenCalledWith('config', 'G-TEST123', expect.objectContaining({ send_page_view: false }))
    route.pathname = '/about'
    view.rerender(element())
    expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', expect.objectContaining({ page_path: '/about' }))
    await act(async () => { saveConsent(false) })
    expect(screen.queryByTestId('google-script')).not.toBeInTheDocument()
    expect((window as unknown as Record<string, unknown>)['ga-disable-G-TEST123']).toBe(true)
    const calls = vi.mocked(window.gtag!).mock.calls.length
    trackLeadSubmission('company')
    expect(window.gtag).toHaveBeenCalledTimes(calls)
  })
  it('excludes preview and private admin pages', async () => {
    saveConsent(true)
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview')
    const element = () => createElement(GoogleAnalytics, { measurementId: 'G-TEST123' })
    const view = render(element())
    expect(screen.queryByTestId('google-script')).not.toBeInTheDocument()
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production')
    route.pathname = '/admin/analytics'
    view.rerender(element())
    expect(screen.queryByTestId('google-script')).not.toBeInTheDocument()
    expect(window.gtag).not.toHaveBeenCalled()
  })
})
