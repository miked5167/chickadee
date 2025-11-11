import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get advisor record for this user
    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('id')
      .eq('is_claimed', true)
      .single()

    if (advisorError || !advisor) {
      return NextResponse.json(
        { error: 'No claimed listing found for this user' },
        { status: 404 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Calculate offset
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('advisor_id', advisor.id)
      .order('created_at', { ascending: false })

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply pagination
    const { data: leads, error: leadsError, count } = await query.range(offset, offset + limit - 1)

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    // Get counts for all statuses
    const { count: allCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('advisor_id', advisor.id)

    const { count: newCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('advisor_id', advisor.id)
      .eq('status', 'new')

    const { count: contactedCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('advisor_id', advisor.id)
      .eq('status', 'contacted')

    const { count: convertedCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('advisor_id', advisor.id)
      .eq('status', 'converted')

    const { count: closedCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('advisor_id', advisor.id)
      .eq('status', 'closed')

    return NextResponse.json(
      {
        leads: leads || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        statusCounts: {
          all: allCount || 0,
          new: newCount || 0,
          contacted: contactedCount || 0,
          converted: convertedCount || 0,
          closed: closedCount || 0,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/advisor/leads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
