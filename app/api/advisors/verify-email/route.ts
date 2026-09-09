import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function retiredVerificationResponse() {
  return NextResponse.json(
    { error: 'This legacy verification link is no longer supported. Sign in and submit a new listing claim.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  )
}

export const GET = retiredVerificationResponse
export const POST = retiredVerificationResponse
