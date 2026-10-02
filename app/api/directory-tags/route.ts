import { NextResponse } from 'next/server'
import { readTagCatalog } from '@/lib/tags/catalog'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await readTagCatalog(), { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'The tag catalog is unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
