import { createElement } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it } from 'vitest'
import { AdvisorCard } from '@/components/listing/AdvisorCard'
import type { DirectoryTag } from '@/lib/tags/types'
import type { EliteProspectsMeasurement } from '@/lib/research/elite-prospects'

const advisor = { id: 'example-card', slug: 'example-agency', name: 'Example Agency', city: 'Toronto', state: 'ON', country: 'CA', description: 'Known company description.', verified: false, logo_url: null }
const measurement: EliteProspectsMeasurement = { match_status: 'exact', agency_name: 'Example Agency', source_url: 'https://www.eliteprospects.com/agent-portal/12/example-agency', client_count: 42, source_observed_at: '2025-11-11', imported_at: '2026-09-01' }
const tag = (group: DirectoryTag['group_key'], label: string): DirectoryTag => ({ id: `${group}:${label}`, group_key: group, slug: label, label, parent_id: null, display_order: 0, is_active: true })

beforeEach(() => localStorage.clear())

describe('balanced listing cards', () => {
  it('shows a sourced count, summary, approved chips and player fit with verification once', () => {
    render(createElement(AdvisorCard, { advisor: { ...advisor, verified: true, tagline: 'Published tagline.', card_tags: [tag('services', 'Advising'), tag('pathways', 'NCAA'), tag('player_level', 'AAA'), tag('age_group', '15–17')], elite_prospects: measurement } }))
    expect(screen.getAllByText('Business connection verified')).toHaveLength(1)
    expect(screen.getByText('Published tagline.')).toBeInTheDocument()
    expect(screen.queryByText('Known company description.')).not.toBeInTheDocument()
    const chips = screen.getByRole('list', { name: 'Services and pathways' })
    expect(within(chips).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('AAA · Ages 15–17')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Source: November 2025')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /client source on Elite Prospects/ })).toHaveAttribute('href', measurement.source_url)
    expect(screen.getByRole('link', { name: 'View Example Agency profile' })).toHaveAttribute('href', '/listings/example-agency')
  })

  it('keeps sparse cards honest and does not turn free-text services into approved chips', () => {
    render(createElement(AdvisorCard, { advisor: { ...advisor, description: null, services: ['Unapproved service'], specialties: ['Self-reported specialty'] } }))
    expect(screen.getByRole('heading', { name: advisor.name })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Example Agency initials' })).toHaveTextContent('EA')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByText('Players served')).not.toBeInTheDocument()
    expect(screen.queryByText(/Clients listed/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Unclaimed|Business connection verified|Accepting clients/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Example Agency' })).toBeInTheDocument()
  })

  it('shows a real zero and omits an unavailable capture date', () => {
    render(createElement(AdvisorCard, { advisor: { ...advisor, elite_prospects: { ...measurement, client_count: 0, source_observed_at: null } } }))
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.queryByText(/Source:/)).not.toBeInTheDocument()
  })

  it.each([
    { ...measurement, match_status: 'none' as const },
    { ...measurement, match_status: 'ambiguous' as const },
    { ...measurement, client_count: null },
    { ...measurement, client_count: -1 },
    { ...measurement, source_url: 'javascript:alert(1)' },
  ])('omits an unusable Elite Prospects measurement %#', (elite_prospects) => {
    render(createElement(AdvisorCard, { advisor: { ...advisor, elite_prospects } }))
    expect(screen.queryByText(/Clients listed/)).not.toBeInTheDocument()
  })

  it('qualifies a possible agency match', () => {
    render(createElement(AdvisorCard, { advisor: { ...advisor, elite_prospects: { ...measurement, match_status: 'likely' } } }))
    expect(screen.getByText('Possible agency match')).toBeInTheDocument()
  })

  it('falls back from an empty tagline to the known description', () => {
    render(createElement(AdvisorCard, { advisor: { ...advisor, tagline: '   ' } }))
    expect(screen.getByText('Known company description.')).toBeInTheDocument()
  })

  it('replaces a broken logo with initials and retries a changed asset', () => {
    const { rerender } = render(createElement(AdvisorCard, { advisor: { ...advisor, logo_url: '/old.png' } }))
    fireEvent.error(screen.getByRole('img', { name: 'Example Agency logo' }))
    expect(screen.getByRole('img', { name: 'Example Agency initials' })).toHaveTextContent('EA')
    rerender(createElement(AdvisorCard, { advisor: { ...advisor, logo_url: '/new.png' } }))
    expect(screen.getByRole('img', { name: 'Example Agency logo' })).toHaveAttribute('src', '/new.png')
  })

  it('saves and removes the right company and announces the result', () => {
    render(createElement(AdvisorCard, { advisor: advisor }))
    fireEvent.click(screen.getByRole('button', { name: 'Save Example Agency' }))
    expect(screen.getByRole('button', { name: 'Remove Example Agency from saved listings' })).toHaveAttribute('aria-pressed', 'true')
    expect(JSON.parse(localStorage.getItem('hockey-directory-saved-listings')!)).toEqual([advisor.id])
    expect(screen.getByText('Example Agency saved on this device.')).toHaveAttribute('aria-live', 'polite')
    fireEvent.click(screen.getByRole('button', { name: 'Remove Example Agency from saved listings' }))
    expect(JSON.parse(localStorage.getItem('hockey-directory-saved-listings')!)).toEqual([])
  })

  it('includes the count and profile link in server markup before JavaScript runs', () => {
    const markup = renderToStaticMarkup(createElement(AdvisorCard, { advisor: { ...advisor, elite_prospects: measurement } }))
    expect(markup).toContain('>42</strong>')
    expect(markup).toContain('Clients listed on')
    expect(markup).toContain('Source: November 2025')
    expect(markup).toContain('href="/listings/example-agency"')
  })
})
