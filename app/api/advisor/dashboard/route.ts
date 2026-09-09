import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RecentLead = {
  id: string
  contact_name: string
  created_at: string
  status: string
}

type RecentReview = {
  id: string
  rating: number
  title: string | null
  created_at: string
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, slug, verified')
      .eq('verified_owner_id', user.id)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'No verified-owner listing found for this account.' }, { status: 404 })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const since = thirtyDaysAgo.toISOString()

    const [profileViewsResult, totalClicksResult, recentLeadCountResult, totalLeadCountResult, recentLeadsResult, reviewsResult] = await Promise.all([
      supabase.from('directory_events').select('id', { count: 'exact', head: true })
        .eq('company_id', company.id).eq('event_type', 'profile_view').gte('created_at', since),
      supabase.from('directory_events').select('id', { count: 'exact', head: true })
        .eq('company_id', company.id).in('event_type', ['website_click', 'email_click', 'phone_click']),
      supabase.from('company_leads').select('id', { count: 'exact', head: true })
        .eq('company_id', company.id).gte('created_at', since),
      supabase.from('company_leads').select('id', { count: 'exact', head: true })
        .eq('company_id', company.id),
      supabase.from('company_leads').select('id, contact_name, created_at, status')
        .eq('company_id', company.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('reviews').select('id, rating, title, created_at')
        .eq('company_id', company.id).order('created_at', { ascending: false }).limit(100),
    ])

    const reviews = (reviewsResult.data ?? []) as RecentReview[]
    const ratingTotal = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = reviews.length > 0 ? ratingTotal / reviews.length : 0

    const recentActivity = [
      ...((recentLeadsResult.data ?? []) as RecentLead[]).map((lead) => ({
        type: 'lead' as const,
        id: lead.id,
        description: `New inquiry from ${lead.contact_name}`,
        date: lead.created_at,
        status: lead.status,
      })),
      ...reviews.slice(0, 5).map((review) => ({
        type: 'review' as const,
        id: review.id,
        description: `New ${review.rating}-star review${review.title ? `: ${review.title}` : ''}`,
        date: review.created_at,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

    return NextResponse.json({
      advisor: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        average_rating: averageRating,
        review_count: reviews.length,
        verified: company.verified,
      },
      stats: {
        profileViews: profileViewsResult.count ?? 0,
        totalClicks: totalClicksResult.count ?? 0,
        leadsLast30Days: recentLeadCountResult.count ?? 0,
        totalLeads: totalLeadCountResult.count ?? 0,
        averageRating,
        reviewCount: reviews.length,
      },
      recentActivity,
    })
  } catch (error) {
    console.error('Error in GET /api/advisor/dashboard:', error)
    return NextResponse.json({ error: 'Dashboard data could not be loaded.' }, { status: 500 })
  }
}
