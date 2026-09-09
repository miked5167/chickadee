import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Retired legacy claim-account endpoint.
 *
 * Listing claims now require an existing authenticated account. This route
 * never creates a user or changes listing ownership.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'This account-setup link is no longer supported. Sign in and submit a new listing claim.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  )
}
