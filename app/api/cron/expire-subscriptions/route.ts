import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function retiredSubscriptionResponse() {
  return NextResponse.json(
    { error: 'The legacy subscription-expiration workflow has been retired.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function GET() {
  return retiredSubscriptionResponse()
}

export async function POST() {
  return retiredSubscriptionResponse()
}
