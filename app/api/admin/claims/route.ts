import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Mark as dynamic to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // TODO: Check admin authentication
    // For now, we'll allow any authenticated user (development mode)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'pending'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Calculate offset
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('listing_claims')
      .select(`
        id,
        advisor_id,
        claimant_name,
        claimant_email,
        claimant_phone,
        business_verification_info,
        status,
        created_at,
        reviewed_at,
        reviewed_by,
        admin_notes,
        advisors!listing_claims_advisor_id_fkey (
          id,
          name,
          slug,
          city,
          state,
          logo_url,
          is_claimed
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply pagination
    const { data: claims, error: claimsError, count } = await query.range(offset, offset + limit - 1)

    if (claimsError) {
      console.error('Error fetching claims:', claimsError)
      return NextResponse.json(
        { error: 'Failed to fetch claims' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        claims: claims || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/admin/claims:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
