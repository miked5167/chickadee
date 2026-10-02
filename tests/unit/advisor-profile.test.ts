import { createElement } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdvisorProfile, formatProfilePrice, type CompanyProfile, type ProfileCompany } from '@/components/listing/AdvisorProfile'

vi.mock('@/components/listing/ReviewsList', () => ({ ReviewsList: () => createElement('div', null, 'Reviews component') }))

const company: ProfileCompany = {
  id: 'company-test', name: 'Example Hockey Advisors', slug: 'example-hockey',
  description: null, logo_url: null, website_url: 'https://example.com', email: null,
  phone: null, address: null, city: null, state_province: null, country: null,
  instagram_url: null, facebook_url: null, twitter_url: null, verified: false, verified_owner_id: null,
}
const emptyProfile: CompanyProfile = {
  tagline: null, services: [], specialties: [], pathways: [], player_levels: [],
  age_groups: [], service_areas: [], languages: [], offers_remote: false,
  accepting_clients: null, pricing_models: [], price_min: null, price_max: null,
  price_currency: null, response_time: null, founded_year: null, business_hours: {},
  faq: [], last_reviewed_at: null, source_label: null, source_url: null,
}

function show(profile: CompanyProfile | null = null, companyChanges: Partial<ProfileCompany> = {}, extras = {}) {
  return render(createElement(AdvisorProfile, { company: { ...company, ...companyChanges }, profile, teamMembers: [], averageRating: null, reviewCount: 0, ...extras }))
}

beforeEach(() => localStorage.clear())

describe('advisor profile presentation', () => {
  it('places a company LinkedIn link with socials and a named personal link with the team', () => {
    show(null, {}, { research: {
      company_id: company.id, slug: company.slug, name: company.name, website_url: company.website_url,
      status: 'draft', overview: [], services: [], pricing: [],
      company_linkedin: { url: 'https://www.linkedin.com/company/example/admin/', source_url: 'https://example.com', quote: 'LinkedIn company' },
      team: [{ name: 'Jane Advisor', title: null, bio: null, linkedin_url: 'https://www.linkedin.com/in/jane-advisor/', source_url: 'https://example.com', quote: 'Jane Advisor' }],
      sources: [{ url: 'https://example.com', captured_at: '2026-09-13T00:00:00Z' }],
    } })
    const socials = screen.getByRole('navigation', { name: 'Company social profiles' })
    expect(within(socials).getByRole('link', { name: /LinkedIn/ })).toHaveAttribute('href', 'https://www.linkedin.com/company/example/')
    const person = screen.getByRole('link', { name: /Jane Advisor on LinkedIn/ })
    expect(person).toHaveAttribute('href', 'https://www.linkedin.com/in/jane-advisor/')
    expect(person.closest('section')).toHaveAttribute('id', 'team')
    expect(person).toHaveAttribute('rel', 'noopener noreferrer')
  })
  it('adds a reviewed personal LinkedIn link to an existing directory team member', () => {
    show(null, { slug: '83-llc' }, { teamMembers: [{ id: 'ryan', name: 'Ryan Minkoff', title: 'Owner', bio: null, profile_image_url: null }] })
    expect(screen.getByRole('link', { name: /Ryan Minkoff on LinkedIn/ })).toHaveAttribute('href', 'https://www.linkedin.com/in/ryanminkoff/')
  })
  const ep = { match_status: 'exact', agency_name: 'Example Hockey', source_url: 'https://www.eliteprospects.com/agent-portal/123/example-hockey', client_count: 57, source_observed_at: null, imported_at: '2026-09-13T01:00:00Z' }
  it('shows the database client count with a source and no invented capture date', () => {
    show(null, {}, { eliteProspects: ep })
    expect(screen.getByText('57')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View Example Hockey on Elite Prospects/ })).toHaveAttribute('href', ep.source_url)
    expect(screen.getByText(/Source capture date not provided/)).toBeInTheDocument()
  })
  it('displays a real zero and labels likely matches', () => {
    show(null, {}, { eliteProspects: { ...ep, match_status: 'likely', client_count: 0 } })
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText(/Possible agency match: Example Hockey/)).toBeInTheDocument()
  })
  it.each(['none', 'ambiguous'])('does not turn %s counts into zero', match_status => {
    show(null, {}, { eliteProspects: { ...ep, match_status, client_count: null, source_url: null, agency_name: null } })
    expect(screen.queryByText('0')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /on Elite Prospects/ })).not.toBeInTheDocument()
  })
  it('does not show counts without a safe matching source', () => {
    show(null, {}, { eliteProspects: { ...ep, source_url: 'https://unrelated.com/agent-portal/123/example' } })
    expect(screen.queryByText('57')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /on Elite Prospects/ })).not.toBeInTheDocument()
  })
  it('keeps sparse listings useful without invented locations, fees, ratings, or badges', () => {
    show()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(company.name)
    expect(screen.getByText('Location not listed')).toBeInTheDocument()
    expect(screen.getByText('Not listed in this profile')).toBeInTheDocument()
    expect(screen.getByText('Contact the company to confirm')).toBeInTheDocument()
    expect(screen.getByText('Service details not yet listed')).toBeInTheDocument()
    expect(screen.queryByText('Business details verified')).not.toBeInTheDocument()
    expect(screen.queryByText('Accepting new clients')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'The team' })).not.toBeInTheDocument()
    expect(screen.getByText(/No email is listed/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'No directory reviews yet' })).toHaveAttribute('href', '#reviews')
  })

  it.each(['player_levels', 'age_groups', 'service_areas', 'specialties', 'pathways', 'services'] as const)('shows a populated %s even when other service fields are empty', (field) => {
    show({ ...emptyProfile, [field]: ['Published information'] })
    expect(screen.getByText('Published information')).toBeInTheDocument()
    expect(screen.queryByText('Service details not yet listed')).not.toBeInTheDocument()
  })

  it('preserves explicit unavailable status and known contact details', () => {
    show({ ...emptyProfile, accepting_clients: false }, { phone: '+1 555 555 0100', email: 'office@example.com', city: 'Toronto', country: 'CA' })
    expect(screen.getByText('Not currently accepting new clients')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '+1 555 555 0100' })).toHaveAttribute('href', 'tel:+1 555 555 0100')
    expect(screen.getByRole('link', { name: 'office@example.com' })).toHaveAttribute('href', 'mailto:office@example.com')
    expect(screen.queryByText(/No email is listed/)).not.toBeInTheDocument()
  })

  it('renders enriched details, FAQ, provenance and hours from supplied data', () => {
    show({ ...emptyProfile, tagline: 'Published tagline', offers_remote: true, languages: ['French', 'English'], founded_year: 2012,
      accepting_clients: true, response_time: 'Within two business days', pricing_models: ['Annual'], price_min: 2500, price_currency: 'CAD',
      faq: [{ question: 'How do we begin?', answer: 'Schedule a conversation.' }, { question: 'Unanswered question', answer: ' ' }],
      source_label: 'Company website', source_url: 'https://example.com/about', last_reviewed_at: '2026-09-12T00:00:00Z', business_hours: { Monday: '9–5', Tuesday: '' },
    }, { verified: true, verified_owner_id: 'owner' }, { averageRating: 4.5, reviewCount: 2 })
    for (const text of ['Published tagline', 'Remote consultations available', 'French, English', '2012', 'Accepting new clients', 'Within two business days', 'Annual', 'From CAD 2,500.00', 'Monday']) {
      expect(screen.getByText(text)).toBeInTheDocument()
    }
    expect(screen.queryByText('Unanswered question')).not.toBeInTheDocument()
    expect(screen.queryByText('Tuesday')).not.toBeInTheDocument()
    expect(screen.getByText('How do we begin?').closest('details')).not.toHaveAttribute('open')
    fireEvent.click(screen.getByText('How do we begin?'))
    expect(screen.getByText('How do we begin?').closest('details')).toHaveAttribute('open')
    expect(screen.getByRole('link', { name: 'Company website' })).toHaveAttribute('href', 'https://example.com/about')
    expect(screen.getByRole('link', { name: /4.5 \/ 5/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Claim and update this listing' })).not.toBeInTheDocument()
  })

  it('makes a full team biography expandable rather than truncating it', () => {
    const biography = 'A long, published biography. '.repeat(30)
    show(null, {}, { teamMembers: [{ id: 'person', name: 'Example Advisor', title: 'Founder', bio: biography, profile_image_url: null }] })
    expect(screen.getByRole('link', { name: 'The team' })).toHaveAttribute('href', '#team')
    const toggle = screen.getByText('Read biography')
    expect(toggle.closest('details')).not.toHaveAttribute('open')
    fireEvent.click(toggle)
    expect(toggle.closest('details')).toHaveAttribute('open')
    expect(toggle.closest('details')?.textContent).toContain(biography)
  })

  it('wires inquiry, reviews anchor, claim, save and comparison to the existing flows', () => {
    show()
    for (const link of screen.getAllByRole('link', { name: 'Send an inquiry' })) expect(link).toHaveAttribute('href', '/listings/example-hockey/contact')
    expect(screen.getByRole('link', { name: 'Claim and update this listing' })).toHaveAttribute('href', '/claim/example-hockey')
    expect(screen.queryByRole('link', { name: /View comparison/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }))
    expect(screen.getByRole('button', { name: 'Saved', exact: true })).toHaveAttribute('aria-pressed', 'true')
    expect(JSON.parse(localStorage.getItem('hockey-directory-saved-listings')!)).toEqual([company.id])
    fireEvent.click(screen.getByRole('button', { name: 'Compare', exact: true }))
    expect(screen.getByRole('button', { name: 'Comparing', exact: true })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('link', { name: 'Find another advisor' })).toHaveAttribute('href', '/listings')
  })

  it('includes the selected company IDs in the comparison link', () => {
    localStorage.setItem('hockey-directory-compare-listings', JSON.stringify(['other-company']))
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Compare', exact: true }))
    expect(screen.getByRole('link', { name: 'View comparison (2)' })).toHaveAttribute('href', '/compare?ids=other-company%2Ccompany-test')
    fireEvent.click(screen.getByRole('button', { name: 'Comparing', exact: true }))
    expect(screen.queryByRole('link', { name: /View comparison/ })).not.toBeInTheDocument()
  })

  it('does not link unsafe web sources or display invalid review dates', () => {
    show({ ...emptyProfile, source_url: 'javascript:alert(1)', source_label: 'Provided source', last_reviewed_at: 'not-a-date' }, { website_url: 'javascript:alert(1)', instagram_url: 'data:text/html,bad' })
    expect(screen.queryByRole('link', { name: /Visit website/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Provided source' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Invalid Date/)).not.toBeInTheDocument()
  })

  it('has a real target for every section navigation link', () => {
    const { container } = show(null, { city: 'Toronto', country: 'CA' })
    expect(screen.getByRole('link', { name: 'View location & Google Maps' })).toHaveAttribute('href', '#location')
    expect(screen.getByRole('heading', { name: 'Location', exact: true })).toBeInTheDocument()
    for (const link of container.querySelectorAll('a[href^="#"]')) {
      expect(container.querySelector(link.getAttribute('href')!)).not.toBeNull()
    }
  })

  it('does not show a map section or shortcut without a usable location', () => {
    show()
    expect(screen.queryByRole('heading', { name: 'Location', exact: true })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'View location & Google Maps' })).not.toBeInTheDocument()
  })

  it('shows branded social icons with labels and preserves their destinations', () => {
    show(null, { instagram_url: 'https://instagram.com/example', facebook_url: 'https://facebook.com/example', twitter_url: 'https://twitter.com/example' })
    const navigation = screen.getByRole('navigation', { name: 'Company social profiles' })
    for (const [name, url] of [['Instagram', 'https://instagram.com/example'], ['Facebook', 'https://facebook.com/example'], ['X (Twitter)', 'https://twitter.com/example']]) {
      const link = within(navigation).getByRole('link', { name: `${name} — opens in a new tab` })
      expect(link).toHaveAttribute('href', url)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    }
    expect(within(navigation).getByText('X')).toBeInTheDocument()
  })

  it('omits missing or unsafe social destinations and an entirely empty social row', () => {
    const { unmount } = show(null, { instagram_url: 'https://instagram.com/example', facebook_url: 'javascript:alert(1)' })
    expect(within(screen.getByRole('navigation', { name: 'Company social profiles' })).getAllByRole('link')).toHaveLength(1)
    unmount()
    show()
    expect(screen.queryByRole('navigation', { name: 'Company social profiles' })).not.toBeInTheDocument()
  })
})

describe('unambiguous profile pricing', () => {
  it('does not invent a fee or default currency', () => {
    expect(formatProfilePrice(null)).toBeNull()
    expect(formatProfilePrice(emptyProfile)).toBeNull()
    expect(formatProfilePrice({ ...emptyProfile, price_min: 100 })).toBe('From 100 (currency not listed)')
  })
  it('handles zero, equal fees, upper limits and ranges', () => {
    expect(formatProfilePrice({ ...emptyProfile, price_min: 0, price_max: 0, price_currency: 'CAD' })).toBe('CAD\u00a00.00')
    expect(formatProfilePrice({ ...emptyProfile, price_max: 99.50, price_currency: 'USD' })).toBe('Up to USD\u00a099.50')
    expect(formatProfilePrice({ ...emptyProfile, price_min: 100, price_max: 200, price_currency: 'CAD' })).toBe('CAD\u00a0100.00–CAD\u00a0200.00')
    expect(formatProfilePrice({ ...emptyProfile, price_min: 100, price_currency: 'invalid currency' })).toBe('From 100 (currency not listed)')
  })
})
