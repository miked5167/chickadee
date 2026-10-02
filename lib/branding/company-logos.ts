import generatedCompanyLogos from './company-logo-catalog.json'

/** Original, unmodified logo assets visually checked against official website headers.
 * New entries require identity + image review, not an automatic og:image guess.
 */
const originalCompanyLogos = {
  '2112-hockey-agency': {
    src: '/company-logos/2112-hockey-agency.png',
    website: 'https://2112hockeyagency.com/',
    sourceImage: 'https://2112hockeyagency.com/wp-content/uploads/2025/11/Image_12-removebg-preview-1-3.png',
    reviewedAt: '2026-09-12', background: 'dark',
  },
  '3v-sports-management': {
    src: '/company-logos/3v-sports-management.png',
    website: 'https://www.3vsportsmgt.com/',
    sourceImage: 'https://primary.jwwb.nl/public/q/v/t/temp-pxxqhiebmhctjilbdkzl/logomain-high.png?enable-io=true&enable=upscale&height=70',
    reviewedAt: '2026-09-12', background: 'dark',
  },
  '4d-hockey-training': {
    src: '/company-logos/4d-hockey-training.png',
    website: 'https://4dhockey.com/',
    sourceImage: 'https://4dhockey.com/wp-content/uploads/2023/09/Screenshot-2023-10-03-at-11.15.47-AM-e1696346186541.png',
    reviewedAt: '2026-09-12', background: 'light',
  },
} as const

type LogoCompany = { slug: string; logo_url?: string | null; website_url?: string | null }
type CompanyLogoAsset = { src: string; background: 'light' | 'dark' }
type ReviewedCompanyLogo = CompanyLogoAsset & {
  website: string
  sourceImage: string
  reviewedAt: string
  sourcePage?: string
  sourceKind?: string
  sourceBrandName?: string | null
  sourceLogoAlt?: string | null
  sha256?: string
}

export const reviewedCompanyLogos: Record<string, ReviewedCompanyLogo> = {
  ...originalCompanyLogos,
  ...(generatedCompanyLogos as Record<string, ReviewedCompanyLogo>),
}

function websiteHost(value: string | null | undefined) {
  try {
    const url = new URL(value || '')
    return ['http:', 'https:'].includes(url.protocol) ? url.hostname.toLowerCase().replace(/^www\./, '') : null
  } catch { return null }
}

export function getCompanyLogo(company: LogoCompany): CompanyLogoAsset | null {
  const reviewed = Object.hasOwn(reviewedCompanyLogos, company.slug)
    ? reviewedCompanyLogos[company.slug] : undefined
  const saved = company.logo_url?.trim()
  // Keep explicitly saved logos. Only trusted HTTP(S) or same-site asset paths are images.
  if (saved && ((saved.startsWith('/') && !saved.startsWith('//') && !saved.includes('\\')) || websiteHost(saved))) {
    return { src: saved, background: saved === reviewed?.src ? reviewed.background : 'light' }
  }
  // A slug alone is not enough to attach a logo to a business: also match its official domain.
  if (reviewed && websiteHost(company.website_url) === websiteHost(reviewed.website)) {
    return { src: reviewed.src, background: reviewed.background }
  }
  return null
}
