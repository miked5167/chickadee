import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/blog/tags
 * Fetch blog tags, optionally filtered by popularity
 *
 * Query Parameters:
 * - popular: boolean (if true, order by post_count desc)
 * - limit: number (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const popular = searchParams.get('popular') === 'true'
    const limit = Math.min(
      searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      100
    )

    const supabase = await createClient()

    let query = supabase
      .from('blog_tags')
      .select('*')
      .limit(limit)

    if (popular) {
      query = query.order('post_count', { ascending: false }).gte('post_count', 1)
    } else {
      query = query.order('name', { ascending: true })
    }

    const { data: tags, error } = await query

    if (error) {
      console.error('Tags query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tags' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      tags: tags || [],
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
