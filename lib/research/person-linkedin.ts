import catalog from './person-linkedin-catalog.json'
import { professionalLinkedInUrl } from './company-research'

type PersonIdentity = { companySlug: string; personName: string | null | undefined }
type ReviewedPersonLinkedIn = {
  companySlug: string
  companyName: string
  personName: string
  url: string
  evidenceKind: 'official_website' | 'public_search'
  evidenceUrl: string
  evidenceText: string
  reviewedAt: string
}

const nameKey = (value: string | null | undefined) => (value || '')
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

export const reviewedPersonLinkedIn = catalog.records as ReviewedPersonLinkedIn[]
const byIdentity = new Map(reviewedPersonLinkedIn.map((record) => [`${record.companySlug}|${nameKey(record.personName)}`, record]))

export function reviewedPersonLinkedInUrl({ companySlug, personName }: PersonIdentity) {
  if (!companySlug || !personName) return null
  const record = byIdentity.get(`${companySlug}|${nameKey(personName)}`)
  return record ? professionalLinkedInUrl(record.url) : null
}
