import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'The legacy blog feed has been retired.', replacement: '/guides' },
    { status: 410, headers: { 'Cache-Control': 'public, max-age=3600' } },
  )
}
