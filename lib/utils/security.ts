import crypto from 'crypto'

/**
 * Hash an IP address for privacy-preserving analytics
 * Uses HMAC-SHA256 with a secret salt
 */
export function hashIP(ip: string): string {
  const salt = process.env.IP_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || (process.env.NODE_ENV === 'production' ? null : 'local-development-only-salt')
  if (!salt) throw new Error('A server-side IP hashing secret is required in production')
  return crypto
    .createHmac('sha256', salt)
    .update(ip)
    .digest('hex')
}

// Alias for backward compatibility
export const hashIpAddress = hashIP

/**
 * Generate a secure random session ID
 */
export function generateSessionId(): string {
  return crypto.randomUUID()
}

/**
 * Sanitize user input to prevent XSS attacks
 * Basic sanitization - use DOMPurify on client for HTML content
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
}
