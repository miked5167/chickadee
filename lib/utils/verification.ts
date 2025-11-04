/**
 * Verification Intelligence Utilities
 * Handles automated verification scoring, disposable email detection, and auto-approval logic
 */

// Common disposable email domains (add more as needed)
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'throwaway.email',
  'temp-mail.org',
  'fakeinbox.com',
  'trashmail.com',
  'getnada.com',
  'maildrop.cc',
  'yopmail.com',
  'jetable.org',
  'burnermail.io',
  'sharklasers.com',
  'guerrillamail.info',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamail.de',
  'spam4.me',
  'tmails.net',
  'mohmal.com',
  'emailondeck.com',
  'bumpymail.com',
  'dispostable.com',
  'throwawaymail.com',
]

/**
 * Check if an email address is from a disposable email provider
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }

  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) {
    return false
  }

  return DISPOSABLE_EMAIL_DOMAINS.includes(domain)
}

/**
 * Extract domain from email or URL
 */
export function extractDomain(input: string): string | null {
  try {
    // If it's an email
    if (input.includes('@')) {
      return input.split('@')[1]?.toLowerCase() || null
    }

    // If it's a URL
    if (input.startsWith('http://') || input.startsWith('https://')) {
      const url = new URL(input)
      return url.hostname.replace('www.', '').toLowerCase()
    }

    // If it's just a domain
    return input.replace('www.', '').toLowerCase()
  } catch (error) {
    return null
  }
}

/**
 * Check if email domain matches website domain
 */
export function doDomainsMatch(email: string, websiteUrl: string): {
  exactMatch: boolean
  partialMatch: boolean
  score: number
} {
  const emailDomain = extractDomain(email)
  const websiteDomain = extractDomain(websiteUrl)

  if (!emailDomain || !websiteDomain) {
    return { exactMatch: false, partialMatch: false, score: 0 }
  }

  // Exact match
  if (emailDomain === websiteDomain) {
    return { exactMatch: true, partialMatch: false, score: 40 }
  }

  // Partial match (subdomain or similar)
  if (emailDomain.includes(websiteDomain) || websiteDomain.includes(emailDomain)) {
    return { exactMatch: false, partialMatch: true, score: 20 }
  }

  return { exactMatch: false, partialMatch: false, score: 0 }
}

/**
 * Calculate comprehensive verification confidence score
 */
export interface VerificationScoreInput {
  email_verified_at: string | null
  claimant_email: string
  claimant_phone: string | null
  business_verification_info: string | null
  website_url: string | null
}

export interface VerificationScoreResult {
  score: number
  breakdown: {
    emailVerified: number
    domainMatch: number
    phoneProvided: number
    detailedInfo: number
    disposableEmailPenalty: number
  }
  flags: {
    isDisposableEmail: boolean
    hasExactDomainMatch: boolean
    hasPartialDomainMatch: boolean
  }
  autoApproveEligible: boolean
  autoApproveReason: string | null
}

export function calculateVerificationScore(
  input: VerificationScoreInput
): VerificationScoreResult {
  const breakdown = {
    emailVerified: 0,
    domainMatch: 0,
    phoneProvided: 0,
    detailedInfo: 0,
    disposableEmailPenalty: 0,
  }

  const flags = {
    isDisposableEmail: false,
    hasExactDomainMatch: false,
    hasPartialDomainMatch: false,
  }

  // Email verified: 30 points
  if (input.email_verified_at) {
    breakdown.emailVerified = 30
  }

  // Domain matching: up to 40 points
  if (input.website_url && input.claimant_email) {
    const domainMatch = doDomainsMatch(input.claimant_email, input.website_url)
    breakdown.domainMatch = domainMatch.score
    flags.hasExactDomainMatch = domainMatch.exactMatch
    flags.hasPartialDomainMatch = domainMatch.partialMatch
  }

  // Phone provided: 10 points
  if (input.claimant_phone && input.claimant_phone.trim().length > 0) {
    breakdown.phoneProvided = 10
  }

  // Detailed verification info: up to 20 points
  if (input.business_verification_info) {
    const infoLength = input.business_verification_info.length
    if (infoLength >= 200) {
      breakdown.detailedInfo = 20
    } else if (infoLength >= 100) {
      breakdown.detailedInfo = 10
    } else if (infoLength >= 50) {
      breakdown.detailedInfo = 5
    }
  }

  // Disposable email check: -50 points (severe penalty)
  if (isDisposableEmail(input.claimant_email)) {
    breakdown.disposableEmailPenalty = -50
    flags.isDisposableEmail = true
  }

  // Calculate total score
  const totalScore = Math.max(
    0,
    Math.min(
      100,
      breakdown.emailVerified +
        breakdown.domainMatch +
        breakdown.phoneProvided +
        breakdown.detailedInfo +
        breakdown.disposableEmailPenalty
    )
  )

  // Determine auto-approve eligibility
  let autoApproveEligible = false
  let autoApproveReason: string | null = null

  // Auto-approve criteria:
  // 1. Score >= 90
  // 2. Email verified
  // 3. NOT a disposable email
  // 4. Has exact domain match (most important!)
  if (
    totalScore >= 90 &&
    input.email_verified_at &&
    !flags.isDisposableEmail &&
    flags.hasExactDomainMatch
  ) {
    autoApproveEligible = true
    autoApproveReason =
      'High confidence: Email verified, exact domain match, and detailed verification information provided'
  }

  return {
    score: totalScore,
    breakdown,
    flags,
    autoApproveEligible,
    autoApproveReason,
  }
}

/**
 * Get human-readable confidence level
 */
export function getConfidenceLevel(score: number): {
  level: 'very-high' | 'high' | 'medium' | 'low' | 'very-low'
  label: string
  color: string
} {
  if (score >= 90) {
    return { level: 'very-high', label: 'Very High', color: 'green' }
  } else if (score >= 70) {
    return { level: 'high', label: 'High', color: 'blue' }
  } else if (score >= 50) {
    return { level: 'medium', label: 'Medium', color: 'yellow' }
  } else if (score >= 30) {
    return { level: 'low', label: 'Low', color: 'orange' }
  } else {
    return { level: 'very-low', label: 'Very Low', color: 'red' }
  }
}
