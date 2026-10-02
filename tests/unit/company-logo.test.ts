import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { getCompanyLogo, reviewedCompanyLogos } from '@/lib/branding/company-logos'
import { CompanyLogo } from '@/components/listing/CompanyLogo'
import { AdvisorCard } from '@/components/listing/AdvisorCard'

const company = { name: '2112 Hockey Agency', slug: '2112-hockey-agency', website_url: 'https://2112hockeyagency.com/', logo_url: null }

describe('reviewed company logos', () => {
  it('uses the reviewed official asset when no database logo is available', () => {
    expect(getCompanyLogo(company)).toEqual({ src: '/company-logos/2112-hockey-agency.png', background: 'dark' })
    expect(getCompanyLogo({ ...company, website_url: 'http://www.2112hockeyagency.com/' })?.src).toBe('/company-logos/2112-hockey-agency.png')
  })
  it('does not apply a logo to a different or unconfirmed website', () => {
    expect(getCompanyLogo({ ...company, website_url: 'https://another-business.example' })).toBeNull()
    expect(getCompanyLogo({ ...company, website_url: null })).toBeNull()
    expect(getCompanyLogo({ ...company, slug: 'unreviewed-company' })).toBeNull()
    expect(getCompanyLogo({ ...company, slug: 'constructor' })).toBeNull()
  })
  it('preserves an existing logo without overwriting company data', () => {
    expect(getCompanyLogo({ ...company, logo_url: 'https://example.com/existing-logo.png' })?.src).toBe('https://example.com/existing-logo.png')
    expect(company.logo_url).toBeNull()
  })
  it('rejects unsafe image protocols and protocol-relative sources', () => {
    for (const logo_url of ['javascript:alert(1)', '//untrusted.example/logo.png', '/\\untrusted.example/logo.png']) {
      expect(getCompanyLogo({ ...company, slug: 'no-reviewed-logo', logo_url })).toBeNull()
    }
  })
  it('keeps a source record and a local image file for every reviewed asset', () => {
    expect(Object.keys(reviewedCompanyLogos)).toHaveLength(134)
    for (const logo of Object.values(reviewedCompanyLogos)) {
      const file = path.join(process.cwd(), 'public', logo.src)
      expect(existsSync(file)).toBe(true)
      expect(readFileSync(file).length).toBeGreaterThan(1000)
      expect(['http:', 'https:']).toContain(new URL(logo.sourceImage).protocol)
      expect(logo.reviewedAt).toMatch(/^2026-(?:09-12|10-02)$/)
    }
  })
})

describe('company logo display', () => {
  it('uses the same reviewed logo on directory cards', () => {
    render(createElement(AdvisorCard, { advisor: { ...company, id: 'test-company', city: null, state: null, country: 'CA', description: null, verified: false } }))
    expect(screen.getByRole('img', { name: '2112 Hockey Agency logo' })).toHaveAttribute('src', '/company-logos/2112-hockey-agency.png')
  })
  it('keeps directory profile links on the current site', () => {
    render(createElement(AdvisorCard, { advisor: { ...company, id: 'test-company', city: null, state: null, country: 'CA', description: null, verified: false, profile_url: 'https://thehockeydirectory.com/listings/2112-hockey-agency' } }))
    expect(screen.getByRole('link', { name: '2112 Hockey Agency' })).toHaveAttribute('href', '/listings/2112-hockey-agency')
    expect(screen.getByRole('link', { name: 'View 2112 Hockey Agency profile' })).toHaveAttribute('href', '/listings/2112-hockey-agency')
  })
  it('renders a real logo, not a numbered placeholder', () => {
    render(createElement(CompanyLogo, { company, className: 'logo' }))
    expect(screen.getByRole('img', { name: '2112 Hockey Agency logo' })).toHaveAttribute('src', '/company-logos/2112-hockey-agency.png')
    expect(screen.queryByText('2')).not.toBeInTheDocument()
  })
  it('explains when a logo has not been added', () => {
    render(createElement(CompanyLogo, { company: { ...company, slug: 'unreviewed-company' }, className: 'logo' }))
    expect(screen.getByText('Logo not added')).toBeInTheDocument()
    expect(screen.queryByText('2')).not.toBeInTheDocument()
  })
  it('handles broken images and retries when a new image is provided', () => {
    const { rerender } = render(createElement(CompanyLogo, { company, className: 'logo' }))
    fireEvent.error(screen.getByRole('img', { name: '2112 Hockey Agency logo' }))
    expect(screen.getByText('Logo unavailable')).toBeInTheDocument()
    rerender(createElement(CompanyLogo, { company: { ...company, logo_url: '/replacement.png' }, className: 'logo' }))
    expect(screen.getByRole('img', { name: '2112 Hockey Agency logo' })).toHaveAttribute('src', '/replacement.png')
  })
})
