export type WebsiteFact = { text: string; source_url: string; quote: string }
export type WebsiteTeamMember = {
  name: string
  title: string | null
  bio: string | null
  linkedin_url: string | null
  source_url: string
  quote: string
}
export type WebsitePrice = { name: string; price: string; details: string; source_url: string; quote: string }
export type CompanyResearch = {
  company_id: string
  slug: string
  name: string
  website_url: string
  status: 'draft' | 'reviewed'
  overview: WebsiteFact[]
  services: WebsiteFact[]
  team: WebsiteTeamMember[]
  pricing: WebsitePrice[]
  company_linkedin?: { url: string; source_url: string; quote: string }
  sources: Array<{ url: string; captured_at: string }>
}

export function professionalLinkedInUrl(value: string | null | undefined) {
  const url = linkedInProfileUrl(value)
  return url && /^\/(in|pub)\//.test(new URL(url).pathname) ? url : null
}

// Strip tracking and owner-only views while retaining the website's exact profile ID.
export function linkedInProfileUrl(value: string | null | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port
      || !/^(?:[a-z]{2,3}\.)?linkedin\.com$/.test(url.hostname)) return null
    const profile = url.pathname.match(/^\/(company|in)\/([a-z0-9%_-]+)(?:\/(?:admin(?:\/.*)?|overlay\/about-this-profile\/?)?)?\/?$/i)
    const legacy = url.pathname.match(/^\/pub\/[a-z0-9%_-]+\/[a-z0-9]+\/[a-z0-9]+\/[a-z0-9]+\/?$/i)
    if (profile) return `https://www.linkedin.com/${profile[1].toLowerCase()}/${profile[2]}/`
    if (legacy) return `https://www.linkedin.com${url.pathname.replace(/\/$/, '')}/`
    return null
  } catch { return null }
}

export function researchSourceDate(research: CompanyResearch, url: string) {
  const source = research.sources.find(source => source.url.replace(/\/$/, '') === url.replace(/\/$/, ''))
  const date = source ? new Date(source.captured_at) : null
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : null
}
