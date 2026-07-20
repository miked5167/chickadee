import { NextResponse } from 'next/server'

/**
 * Retired M4 compatibility surface.
 *
 * A value in this legacy path was historically a company identifier despite the
 * advisor name. Treating it as either entity would preserve the ambiguity that
 * M4 removes. Consumers must use /api/companies/[id]/reviews.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'This review endpoint has been retired.',
      replacement: '/api/companies/[id]/reviews',
    },
    {
      status: 410,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}
