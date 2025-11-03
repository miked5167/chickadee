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
    // For now, we'll find the advisor by checking if they have a claimed listing
    // In production, you'd link user_id to advisor via claimed_by_user_id
    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('id, name, slug, is_claimed, average_rating, review_count')
      .eq('is_claimed', true)
      .single()

    if (advisorError || !advisor) {
      return NextResponse.json(
        { error: 'No claimed listing found for this user' },
        { status: 404 }
      )
    }

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

    // Fetch profile views (last 30 days)
    const { count: profileViews } = await supabase
      .from('listing_views')
      .select('*', { count: 'exact', head: true })
      .eq('advisor_id', advisor.id)
      .gte('created_at', thirtyDaysAgoISO)

    // Fetch total clicks
    const { count: totalClicks } = await supabase
      .from('click_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('advisor_id', advisor.id)

    // Fetch leads (last 30 days)
    const { count: leadsLast30Days } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('advisor_id', advisor.id)
      .gte('created_at', thirtyDaysAgoISO)

    // Fetch total leads
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('advisor_id', advisor.id)

    // Fetch recent activity (last 10 items)
    const { data: recentLeads } = await supabase
      .from('leads')
      .select('id, parent_name, created_at, status')
      .eq('advisor_id', advisor.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentReviews } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        title,
        created_at,
        reviewer:users_public!reviews_reviewer_id_fkey (
          display_name
        )
      `)
      .eq('advisor_id', advisor.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(5)

    // Combine and sort recent activity
    const recentActivity = [
      ...(recentLeads || []).map(lead => ({
        type: 'lead' as const,
        id: lead.id,
        description: `New lead from ${lead.parent_name}`,
        date: lead.created_at,
        status: lead.status,
      })),
      ...(recentReviews || []).map((review: any) => ({
        type: 'review' as const,
        id: review.id,
        description: `New ${review.rating}-star review${review.title ? `: ${review.title}` : ''}`,
        date: review.created_at,
        reviewer: review.reviewer?.display_name || 'Anonymous',
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)

    return NextResponse.json(
      {
        advisor: {
          id: advisor.id,
          name: advisor.name,
          slug: advisor.slug,
          average_rating: advisor.average_rating || 0,
          review_count: advisor.review_count || 0,
        },
        stats: {
          profileViews: profileViews || 0,
          totalClicks: totalClicks || 0,
          leadsLast30Days: leadsLast30Days || 0,
          totalLeads: totalLeads || 0,
          averageRating: advisor.average_rating || 0,
          reviewCount: advisor.review_count || 0,
        },
        recentActivity,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/advisor/dashboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
