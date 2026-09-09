import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function retiredUploadResponse() {
  return NextResponse.json(
    { error: 'The legacy media upload workflow has been retired.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function POST() {
  return retiredUploadResponse()
}

export async function DELETE() {
  return retiredUploadResponse()
}
