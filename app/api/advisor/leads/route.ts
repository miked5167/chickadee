import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const statuses = ['new', 'contacted', 'qualified', 'closed', 'spam'] as const

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

    const { data: company } = await supabase.from('companies').select('id').eq('verified_owner_id', user.id).maybeSingle()
    if (!company) return NextResponse.json({ error: 'No connected company listing was found.' }, { status: 404 })

    const requestedStatus = request.nextUrl.searchParams.get('status') || 'all'
    const status = statuses.includes(requestedStatus as typeof statuses[number]) ? requestedStatus : 'all'
    const page = Math.max(Number(request.nextUrl.searchParams.get('page') || 1), 1)
    const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit') || 20), 1), 100)
    const offset = (page - 1) * limit

    let query = supabase.from('company_leads').select('*', { count: 'exact' }).eq('company_id', company.id).order('created_at', { ascending: false })
    if (status !== 'all') query = query.eq('status', status)
    const [{ data: leads, error, count }, { data: statusRows }] = await Promise.all([
      query.range(offset, offset + limit - 1),
      supabase.from('company_leads').select('status').eq('company_id', company.id),
    ])

    if (error) {
      console.error('Owner lead query failed:', error.code)
      return NextResponse.json({ error: 'Inquiries could not be loaded.' }, { status: 500 })
    }

    const statusCounts: Record<string, number> = { all: statusRows?.length || 0, new: 0, contacted: 0, qualified: 0, closed: 0, spam: 0 }
    for (const row of statusRows || []) statusCounts[row.status] = (statusCounts[row.status] || 0) + 1

    return NextResponse.json({ leads: leads || [], total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit), statusCounts }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Error in GET /api/advisor/leads:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
