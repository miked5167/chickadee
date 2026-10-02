import catalog from './company-linkedin-catalog.json'
import { linkedInProfileUrl } from './company-research'

type ReviewedCompanyLinkedIn = {
  companySlug: string
  companyName: string
  url: string
  evidenceUrl: string
  evidenceText: string
  reviewedAt: string
}

export const reviewedCompanyLinkedIn = catalog.records as ReviewedCompanyLinkedIn[]
const byCompanySlug = new Map(reviewedCompanyLinkedIn.map((record) => [record.companySlug, record]))

export function reviewedCompanyLinkedInUrl(companySlug: string | null | undefined) {
  if (!companySlug) return null
  const record = byCompanySlug.get(companySlug)
  return record ? linkedInProfileUrl(record.url) : null
}
