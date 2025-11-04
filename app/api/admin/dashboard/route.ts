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
    // In production, check if user has admin role in users_public table

    // Get total advisors count
    const { count: totalAdvisors } = await supabase
      .from('advisors')
      .select('*', { count: 'exact', head: true })

    // Get total claimed advisors
    const { count: claimedAdvisors } = await supabase
      .from('advisors')
      .select('*', { count: 'exact', head: true })
      .eq('is_claimed', true)

    // Get total published advisors
    const { count: publishedAdvisors } = await supabase
      .from('advisors')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)

    // Get total reviews
    const { count: totalReviews } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })

    // Get total leads
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })

    // Get leads from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: leadsLast30Days } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Get reviews from last 30 days
    const { count: reviewsLast30Days } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Get total profile views (last 30 days)
    const { data: viewsData } = await supabase
      .from('listing_views')
      .select('view_count')
      .gte('created_at', thirtyDaysAgo.toISOString())

    const profileViewsLast30Days = viewsData?.reduce((sum, row) => sum + (row.view_count || 0), 0) || 0

    // Get total clicks
    const { count: totalClicks } = await supabase
      .from('click_tracking')
      .select('*', { count: 'exact', head: true })

    // Get pending claims
    const { count: pendingClaims } = await supabase
      .from('listing_claims')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get expiring subscriptions (next 30 days)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const { data: expiringSubscriptions } = await supabase
      .from('advisors')
      .select('id, name, subscription_end_date, subscription_tier')
      .not('subscription_end_date', 'is', null)
      .lte('subscription_end_date', thirtyDaysFromNow.toISOString())
      .gte('subscription_end_date', new Date().toISOString())
      .eq('is_published', true)
      .order('subscription_end_date', { ascending: true })

    // Get expired subscriptions (not yet unpublished)
    const { data: expiredSubscriptions } = await supabase
      .from('advisors')
      .select('id, name, subscription_end_date, subscription_tier')
      .not('subscription_end_date', 'is', null)
      .lt('subscription_end_date', new Date().toISOString())
      .eq('is_published', true)
      .order('subscription_end_date', { ascending: false })
      .limit(10)

    // Get recent activity (last 20 items)
    // Fetch recent leads
    const { data: recentLeadsData } = await supabase
      .from('leads')
      .select(`
        id,
        parent_name,
        created_at,
        status,
        advisor_id,
        advisors!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    // Transform leads data (Supabase returns advisors as array)
    const recentLeads = recentLeadsData?.map((lead: any) => ({
      ...lead,
      advisors: Array.isArray(lead.advisors) && lead.advisors.length > 0
        ? lead.advisors[0]
        : lead.advisors
    }))

    // Fetch recent reviews
    const { data: recentReviewsData } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        created_at,
        advisor_id,
        reviewer_id,
        advisors!inner(name),
        users_public(display_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    // Transform reviews data (Supabase returns advisors and users_public as arrays)
    const recentReviews = recentReviewsData?.map((review: any) => ({
      ...review,
      advisors: Array.isArray(review.advisors) && review.advisors.length > 0
        ? review.advisors[0]
        : review.advisors,
      users_public: Array.isArray(review.users_public) && review.users_public.length > 0
        ? review.users_public[0]
        : review.users_public
    }))

    // Combine and sort activity
    const activity = [
      ...(recentLeads || []).map(lead => ({
        type: 'lead' as const,
        id: lead.id,
        description: `New lead from ${lead.parent_name} for ${lead.advisors?.name}`,
        date: lead.created_at,
        status: lead.status,
        advisorName: lead.advisors?.name
      })),
      ...(recentReviews || []).map(review => ({
        type: 'review' as const,
        id: review.id,
        description: `${review.rating}-star review for ${review.advisors?.name}`,
        date: review.created_at,
        rating: review.rating,
        reviewer: review.users_public?.display_name || 'Anonymous',
        advisorName: review.advisors?.name
      }))
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20)

    const stats = {
      totalAdvisors: totalAdvisors || 0,
      claimedAdvisors: claimedAdvisors || 0,
      publishedAdvisors: publishedAdvisors || 0,
      totalReviews: totalReviews || 0,
      totalLeads: totalLeads || 0,
      leadsLast30Days: leadsLast30Days || 0,
      reviewsLast30Days: reviewsLast30Days || 0,
      profileViewsLast30Days,
      totalClicks: totalClicks || 0,
      pendingClaims: pendingClaims || 0,
      averageRating: 0, // Will calculate below
    }

    // Calculate average rating across all advisors
    const { data: ratingData } = await supabase
      .from('advisors')
      .select('average_rating')
      .gt('review_count', 0)

    if (ratingData && ratingData.length > 0) {
      const totalRating = ratingData.reduce((sum, row) => sum + (row.average_rating || 0), 0)
      stats.averageRating = totalRating / ratingData.length
    }

    return NextResponse.json(
      {
        stats,
        recentActivity: activity,
        expiringSubscriptions: expiringSubscriptions || [],
        expiredSubscriptions: expiredSubscriptions || [],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/admin/dashboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
