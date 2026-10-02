import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getCompanyLocation, type CompanyLocationInput } from '@/lib/maps/company-location'
import { CompanyLocationMap } from '@/components/listing/CompanyLocationMap'

const company: CompanyLocationInput = {
  name: 'Example Hockey & Sports', address: '123 Main Street', city: 'Toronto', state_province: 'ON', country: 'CA',
}

afterEach(() => vi.unstubAllEnvs())

describe('company map locations', () => {
  it('uses listed address for the map and company name plus address for business search', () => {
    const result = getCompanyLocation(company)!
    expect(result.kind).toBe('address')
    expect(result.label).toBe('123 Main Street, Toronto, ON, Canada')
    const companyUrl = new URL(result.companySearchUrl)
    expect(companyUrl.origin).toBe('https://www.google.com')
    expect(companyUrl.pathname).toBe('/maps/search/')
    expect(companyUrl.searchParams.get('api')).toBe('1')
    expect(companyUrl.searchParams.get('query')).toBe('Example Hockey & Sports, 123 Main Street, Toronto, ON, Canada')
    expect(new URL(result.locationUrl).searchParams.get('query')).toBe(result.label)
    expect(companyUrl.searchParams.has('query_place_id')).toBe(false)
  })

  it('labels city-only data as a general area rather than an office pin', () => {
    const result = getCompanyLocation({ ...company, address: null })!
    expect(result.kind).toBe('area')
    expect(result.mapQuery).toBe('Toronto, ON, Canada')
  })

  it.each([
    { address: null, city: null },
    { address: ' ', city: 'Unknown' },
    { address: 'Remote', city: 'N/A' },
    { address: '123 Main Street', city: null, country: null, state_province: null },
    { address: null, city: 'Springfield', country: null, state_province: null },
  ])('omits maps for missing, broad or ambiguous locations: %j', (changes) => {
    expect(getCompanyLocation({ ...company, ...changes })).toBeNull()
  })

  it('does not mistake a city duplicated in the address field for an office', () => {
    expect(getCompanyLocation({ ...company, address: ' toronto ' })?.kind).toBe('area')
  })

  it('encodes punctuation without adding unintended URL parameters', () => {
    const result = getCompanyLocation({ ...company, name: 'A&B #1? Hockey', address: '123 Main St & Suite #2' })!
    expect(new URL(result.companySearchUrl).searchParams.size).toBe(2)
    expect(new URL(result.companySearchUrl).searchParams.get('query')).toContain('A&B #1? Hockey, 123 Main St & Suite #2')
  })
})

describe('profile location map', () => {
  it('offers useful Google Maps links without an API key or a broken embed', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY', '')
    const location = getCompanyLocation(company)!
    const { container } = render(createElement(CompanyLocationMap, { location, companyName: company.name }))
    expect(container.querySelector('iframe')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Load Google map' })).not.toBeInTheDocument()
    expect(screen.getByText('Listed address')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Find company on Google Maps' })
    expect(link).toHaveAttribute('href', location.companySearchUrl)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText(/not a verified Google Business match/)).toBeInTheDocument()
  })

  it('loads Google only after an explicit click when an embed key exists', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY', 'test-embed-key')
    const location = getCompanyLocation(company)!
    const { container } = render(createElement(CompanyLocationMap, { location, companyName: company.name }))
    expect(container.querySelector('iframe')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Load Google map' }))
    const frame = screen.getByTitle(`Map of the listed address for ${company.name}`)
    const url = new URL(frame.getAttribute('src')!)
    expect(url.pathname).toBe('/maps/embed/v1/place')
    expect(url.searchParams.get('q')).toBe(location.label)
    expect(url.searchParams.get('key')).toBe('test-embed-key')
    expect(url.searchParams.get('zoom')).toBe('15')
    expect(frame).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
    expect(screen.getByRole('link', { name: 'View listed address' })).toBeInTheDocument()
  })

  it('keeps a city map clearly separate from a business location', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY', 'test-embed-key')
    const location = getCompanyLocation({ ...company, address: null })!
    render(createElement(CompanyLocationMap, { location, companyName: company.name }))
    expect(screen.getByText('General area')).toBeInTheDocument()
    expect(screen.getByText(/not an office location or a confirmed service area/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Load Google map' }))
    const frame = screen.getByTitle(`General area map for ${company.name}, not an office location`)
    expect(new URL(frame.getAttribute('src')!).searchParams.get('zoom')).toBe('10')
    expect(screen.queryByRole('link', { name: 'View listed address' })).not.toBeInTheDocument()
  })
})
