/**
 * Utility functions for triggering on-demand cache revalidation
 */

interface RevalidateOptions {
  advisorSlug?: string
  paths?: string[]
}

/**
 * Triggers on-demand revalidation for specified paths
 *
 * @param options - Revalidation options
 * @param options.advisorSlug - Slug of the advisor whose page should be revalidated
 * @param options.paths - Additional paths to revalidate (beyond the defaults)
 * @returns Promise resolving to the API response
 *
 * @example
 * // After updating an advisor profile
 * await revalidateCache({ advisorSlug: 'john-doe-hockey' })
 *
 * @example
 * // After approving multiple advisors
 * await revalidateCache({ paths: ['/listings?status=featured'] })
 */
export async function revalidateCache(options: RevalidateOptions = {}) {
  try {
    const response = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_REVALIDATION_SECRET || ''}`,
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Revalidation failed')
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to revalidate cache:', error)
    // Don't throw - revalidation failure shouldn't break the user flow
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Server Action for triggering revalidation from Server Components
 * Use this when calling from Server Actions or API routes
 */
export async function revalidateCacheServer(options: RevalidateOptions = {}) {
  'use server'

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REVALIDATION_SECRET || ''}`,
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Revalidation failed')
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to revalidate cache:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
