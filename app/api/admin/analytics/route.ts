import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { subDays, format, eachDayOfInterval } from 'date-fns'

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
    const days = parseInt(searchParams.get('days') || '30')

    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    // Calculate date range
    const endDate = new Date()
    const startDate = subDays(endDate, days)

    // Generate all dates in range for charts
    const allDates = eachDayOfInterval({ start: startDate, end: endDate })
    const dateMap = allDates.map(date => format(date, 'yyyy-MM-dd'))

    // 1. Click Tracking Metrics
    const { data: clickData, error: clickError } = await adminClient
      .from('click_tracking')
      .select('click_type, created_at')

    if (clickError) {
      console.error('Error fetching click data:', clickError)
    }

    const totalClicks = clickData?.length || 0
    const websiteClicks = clickData?.filter(c => c.click_type === 'website').length || 0
    const emailClicks = clickData?.filter(c => c.click_type === 'email').length || 0
    const phoneClicks = clickData?.filter(c => c.click_type === 'phone').length || 0

    const recentClicks = clickData?.filter(c =>
      new Date(c.created_at) >= startDate
    ) || []
    const clicksLast30Days = recentClicks.length

    // Group clicks by day
    const clicksByDayMap: { [key: string]: number } = {}
    recentClicks.forEach(click => {
      const day = format(new Date(click.created_at), 'yyyy-MM-dd')
      clicksByDayMap[day] = (clicksByDayMap[day] || 0) + 1
    })

    const clicksByDay = dateMap.map(date => ({
      date,
      count: clicksByDayMap[date] || 0
    }))

    // 2. View Tracking Metrics
    const { data: viewData, error: viewError } = await adminClient
      .from('listing_views')
      .select('advisor_id, created_at, advisors(name)')

    if (viewError) {
      console.error('Error fetching view data:', viewError)
    }

    const totalViews = viewData?.length || 0
    const recentViews = viewData?.filter(v =>
      new Date(v.created_at) >= startDate
    ) || []
    const viewsLast30Days = recentViews.length

    // Group views by day
    const viewsByDayMap: { [key: string]: number } = {}
    recentViews.forEach(view => {
      const day = format(new Date(view.created_at), 'yyyy-MM-dd')
      viewsByDayMap[day] = (viewsByDayMap[day] || 0) + 1
    })

    const viewsByDay = dateMap.map(date => ({
      date,
      count: viewsByDayMap[date] || 0
    }))

    // Top advisors by views
    const viewsByAdvisor: { [key: string]: { count: number; name: string } } = {}
    viewData?.forEach(view => {
      if (view.advisor_id) {
        if (!viewsByAdvisor[view.advisor_id]) {
          viewsByAdvisor[view.advisor_id] = {
            count: 0,
            name: (view.advisors as any)?.name || 'Unknown'
          }
        }
        viewsByAdvisor[view.advisor_id].count++
      }
    })

    const topAdvisorsByViews = Object.entries(viewsByAdvisor)
      .map(([id, data]) => ({
        id,
        name: data.name,
        views: data.count
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    // 3. Lead Metrics
    const { data: leadData, error: leadError } = await adminClient
      .from('leads')
      .select('id, status, created_at, advisor_id, advisors(name)')

    if (leadError) {
      console.error('Error fetching lead data:', leadError)
    }

    const totalLeads = leadData?.length || 0
    const recentLeads = leadData?.filter(l =>
      new Date(l.created_at) >= startDate
    ) || []
    const leadsLast30Days = recentLeads.length

    // Conversion rate (views to leads)
    const conversionRate = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0

    // Group leads by day
    const leadsByDayMap: { [key: string]: number } = {}
    recentLeads.forEach(lead => {
      const day = format(new Date(lead.created_at), 'yyyy-MM-dd')
      leadsByDayMap[day] = (leadsByDayMap[day] || 0) + 1
    })

    const leadsByDay = dateMap.map(date => ({
      date,
      count: leadsByDayMap[date] || 0
    }))

    // Leads by status
    const statusCounts: { [key: string]: number } = {
      'new': 0,
      'contacted': 0,
      'converted': 0,
      'closed': 0
    }

    leadData?.forEach(lead => {
      if (lead.status && statusCounts.hasOwnProperty(lead.status)) {
        statusCounts[lead.status]++
      }
    })

    const leadsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }))

    // Top advisors by leads
    const leadsByAdvisor: { [key: string]: { count: number; name: string } } = {}
    leadData?.forEach(lead => {
      if (lead.advisor_id) {
        if (!leadsByAdvisor[lead.advisor_id]) {
          leadsByAdvisor[lead.advisor_id] = {
            count: 0,
            name: (lead.advisors as any)?.name || 'Unknown'
          }
        }
        leadsByAdvisor[lead.advisor_id].count++
      }
    })

    const topAdvisorsByLeads = Object.entries(leadsByAdvisor)
      .map(([id, data]) => ({
        id,
        name: data.name,
        leads: data.count
      }))
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 10)

    // 4. Review Metrics
    const { data: reviewData, error: reviewError } = await adminClient
      .from('reviews')
      .select('id, rating, created_at, advisor_id, advisors(name, average_rating, review_count)')

    if (reviewError) {
      console.error('Error fetching review data:', reviewError)
    }

    const totalReviews = reviewData?.length || 0
    const recentReviews = reviewData?.filter(r =>
      new Date(r.created_at) >= startDate
    ) || []
    const reviewsLast30Days = recentReviews.length

    // Average rating
    const totalRating = reviewData?.reduce((sum, review) => sum + review.rating, 0) || 0
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0

    // Group reviews by day
    const reviewsByDayMap: { [key: string]: number } = {}
    recentReviews.forEach(review => {
      const day = format(new Date(review.created_at), 'yyyy-MM-dd')
      reviewsByDayMap[day] = (reviewsByDayMap[day] || 0) + 1
    })

    const reviewsByDay = dateMap.map(date => ({
      date,
      count: reviewsByDayMap[date] || 0
    }))

    // Rating distribution
    const ratingCounts: { [key: number]: number } = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    }

    reviewData?.forEach(review => {
      const rating = Math.round(review.rating)
      if (rating >= 1 && rating <= 5) {
        ratingCounts[rating]++
      }
    })

    const ratingDistribution = Object.entries(ratingCounts).map(([rating, count]) => ({
      rating: parseInt(rating),
      count
    }))

    // Top advisors by rating (must have at least 3 reviews)
    const { data: advisorRatings, error: advisorError } = await adminClient
      .from('advisors')
      .select('id, name, average_rating, review_count')
      .gte('review_count', 3)
      .not('average_rating', 'is', null)
      .order('average_rating', { ascending: false })
      .limit(10)

    if (advisorError) {
      console.error('Error fetching advisor ratings:', advisorError)
    }

    const topAdvisorsByRating = advisorRatings?.map(advisor => ({
      id: advisor.id,
      name: advisor.name,
      rating: advisor.average_rating || 0,
      reviewCount: advisor.review_count || 0
    })) || []

    // Return all analytics data
    return NextResponse.json({
      success: true,
      data: {
        // Click tracking
        totalClicks,
        websiteClicks,
        emailClicks,
        phoneClicks,
        clicksLast30Days,
        clicksByDay,

        // View tracking
        totalViews,
        viewsLast30Days,
        viewsByDay,
        topAdvisorsByViews,

        // Lead metrics
        totalLeads,
        leadsLast30Days,
        leadsByDay,
        leadsByStatus,
        topAdvisorsByLeads,
        conversionRate,

        // Review metrics
        totalReviews,
        reviewsLast30Days,
        reviewsByDay,
        averageRating,
        ratingDistribution,
        topAdvisorsByRating
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
