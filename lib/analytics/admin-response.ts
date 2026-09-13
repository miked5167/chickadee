import { NextResponse } from 'next/server'
import { authorizeAdminRequest } from '@/lib/supabase/admin-api'
import { loadAnalyticsReport } from './report-server'
import { reportCsv } from './report'

export async function analyticsResponse(request: Request, csv = false) {
  const authorization = await authorizeAdminRequest()
  if (!authorization.ok) return authorization.response
  const days = Number(new URL(request.url).searchParams.get('days') || '30')
  const headers = { 'Cache-Control': 'no-store' }
  if (![7, 30, 90].includes(days)) return NextResponse.json({ error: 'Choose 7, 30, or 90 days.' }, { status: 400, headers })
  try {
    const data = await loadAnalyticsReport(days)
    if (csv) return new NextResponse(reportCsv(data), { headers: {
      ...headers, 'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="directory-analytics-${days}-days.csv"`,
    } })
    return NextResponse.json({ data }, { headers })
  } catch {
    console.error('Administrator analytics report query failed.')
    return NextResponse.json({ error: 'Analytics are temporarily unavailable. Please try again.' }, { status: 503, headers })
  }
}
