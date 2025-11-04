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

    // TODO: Add proper admin role check
    // For now, allowing any authenticated user (development mode)

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const verified = searchParams.get('verified') || 'all'
    const rating = searchParams.get('rating') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Calculate offset
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('reviews')
      .select(`
        *,
        advisors!inner(name, slug),
        users_public(display_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply verified filter
    if (verified !== 'all') {
      query = query.eq('is_verified', verified === 'true')
    }

    // Apply rating filter
    if (rating !== 'all') {
      query = query.eq('rating', parseInt(rating))
    }

    // Apply pagination
    const { data: reviews, error: reviewsError, count } = await query.range(offset, offset + limit - 1)

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError)
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        reviews: reviews || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/admin/reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
