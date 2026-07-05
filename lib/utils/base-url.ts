import { headers } from 'next/headers'

/**
 * Resolve the current request's absolute origin (e.g. "https://thehockeydirectory.com").
 *
 * Used by server components that need to call our own API routes during SSR so
 * that the initial HTML is fully rendered (advisor names, blog titles, etc.)
 * rather than filled in client-side after hydration.
 */
export async function getBaseUrl(): Promise<string> {
  const h = await headers()
  const host = h.get('host') || 'localhost:3000'
  const isLocal = host.startsWith('localhost') || host.startsWith('127.')
  const proto = h.get('x-forwarded-proto') || (isLocal ? 'http' : 'https')
  return `${proto}://${host}`
}
