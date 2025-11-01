import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for use in client components
 * This should only be used in Client Components (components with 'use client')
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
