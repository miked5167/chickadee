import { describe, expect, it } from 'vitest'
import { linkedInProfileUrl, professionalLinkedInUrl } from '@/lib/research/company-research'
import { reviewedPersonLinkedIn, reviewedPersonLinkedInUrl } from '@/lib/research/person-linkedin'

describe('website LinkedIn destinations', () => {
  it('converts owner-only company links into public links and removes tracking', () => {
    expect(linkedInProfileUrl('http://ca.linkedin.com/company/95073163/admin/feed/posts/?trk=footer')).toBe('https://www.linkedin.com/company/95073163/')
  })
  it('supports personal profile overlays and legacy public profiles', () => {
    expect(professionalLinkedInUrl('https://www.linkedin.com/in/claire-test/overlay/about-this-profile/')).toBe('https://www.linkedin.com/in/claire-test/')
    expect(professionalLinkedInUrl('https://www.linkedin.com/pub/bryan-pearse/29/489/bb7')).toBe('https://www.linkedin.com/pub/bryan-pearse/29/489/bb7/')
    expect(professionalLinkedInUrl('https://www.linkedin.com/company/example')).toBeNull()
  })
  it.each([
    'javascript:alert(1)', 'https://linkedin.com.evil.test/in/person',
    'https://www.linkedin.com@evil.test/in/person', 'https://user@www.linkedin.com/in/person',
    'https://www.linkedin.com:8443/in/person', 'https://www.linkedin.com/sharing/share-offsite/?url=example',
    'https://www.linkedin.com/pulse/article', 'https://www.linkedin.com/login',
  ])('rejects unsafe or non-profile destinations: %s', value => {
    expect(linkedInProfileUrl(value)).toBeNull()
  })
})

describe('reviewed personal LinkedIn destinations', () => {
  it('matches a reviewed person only within the correct company', () => {
    expect(reviewedPersonLinkedInUrl({ companySlug: '83-llc', personName: 'Ryan Minkoff' })).toBe('https://www.linkedin.com/in/ryanminkoff/')
    expect(reviewedPersonLinkedInUrl({ companySlug: 'another-company', personName: 'Ryan Minkoff' })).toBeNull()
    expect(reviewedPersonLinkedInUrl({ companySlug: '83-llc', personName: 'Different Person' })).toBeNull()
  })
  it('keeps every deployable catalog URL safe and evidence-backed', () => {
    expect(reviewedPersonLinkedIn).toHaveLength(48)
    expect(reviewedPersonLinkedIn.filter(record => record.evidenceKind === 'official_website')).toHaveLength(17)
    expect(reviewedPersonLinkedIn.filter(record => record.evidenceKind === 'public_search')).toHaveLength(31)
    for (const record of reviewedPersonLinkedIn) {
      expect(professionalLinkedInUrl(record.url)).toBe(record.url)
      expect(record.evidenceText).toContain(record.personName)
      expect(record.reviewedAt).toBe('2026-10-02')
    }
  })
})
