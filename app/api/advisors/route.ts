import { NextRequest, NextResponse } from 'next/server'
import { searchDirectory } from '@/lib/tags/directory-search'

export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await searchDirectory(request.nextUrl.searchParams), { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Directory search failed:', error)
    return NextResponse.json({ error: 'Directory results could not be loaded.' }, { status: 503 })
  }
}
