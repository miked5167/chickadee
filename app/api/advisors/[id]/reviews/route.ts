import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const advisorId = id

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sort = searchParams.get('sort') || 'newest'

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // Calculate offset
    const offset = (page - 1) * limit

    // Determine sort order
    let orderColumn: string
    let orderAscending: boolean

    switch (sort) {
      case 'highest':
        orderColumn = 'rating'
        orderAscending = false
        break
      case 'lowest':
        orderColumn = 'rating'
        orderAscending = true
        break
      case 'newest':
      default:
        orderColumn = 'created_at'
        orderAscending = false
    }

    // Fetch reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('advisor_id', advisorId)
      .eq('is_published', true)
      .order(orderColumn, { ascending: orderAscending })
      .order('created_at', { ascending: false }) // Secondary sort by date
      .range(offset, offset + limit - 1)

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError)
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    // Fetch reviewer display names separately (since reviews.user_id -> auth.users, not users_public)
    const userIds = reviews?.map((r: any) => r.user_id).filter(Boolean) || []
    const { data: usersData } = userIds.length > 0
      ? await supabase
          .from('users_public')
          .select('id, display_name')
          .in('id', userIds)
      : { data: [] }

    // Create a map of user_id to display_name
    const usersMap = new Map(usersData?.map((u: any) => [u.id, u.display_name]) || [])

    // Get total count
    const { count, error: countError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('advisor_id', advisorId)
      .eq('is_published', true)

    if (countError) {
      console.error('Error counting reviews:', countError)
      return NextResponse.json(
        { error: 'Failed to count reviews' },
        { status: 500 }
      )
    }

    // Map review_title to title and add reviewer info
    const mappedReviews = reviews?.map((review: any) => ({
      ...review,
      title: review.review_title,
      reviewer: {
        display_name: usersMap.get(review.user_id) || null
      }
    })) || []

    return NextResponse.json(
      {
        reviews: mappedReviews,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/advisors/[id]/reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
