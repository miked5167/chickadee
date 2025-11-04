import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { subDays, format } from 'date-fns'

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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')

    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    // Calculate date range
    const endDate = new Date()
    const startDate = subDays(endDate, days)

    // Fetch all necessary data
    const [clickData, viewData, leadData, reviewData] = await Promise.all([
      adminClient.from('click_tracking').select('*').gte('created_at', startDate.toISOString()),
      adminClient.from('listing_views').select('*, advisors(name)').gte('created_at', startDate.toISOString()),
      adminClient.from('leads').select('*, advisors(name)').gte('created_at', startDate.toISOString()),
      adminClient.from('reviews').select('*, advisors(name)').gte('created_at', startDate.toISOString())
    ])

    // Build CSV content
    let csv = ''

    // Clicks section
    csv += 'CLICK TRACKING\n'
    csv += 'Date,Type,Advisor ID\n'
    clickData.data?.forEach(click => {
      csv += `${format(new Date(click.created_at), 'yyyy-MM-dd HH:mm')},${click.click_type},${click.advisor_id || 'N/A'}\n`
    })
    csv += '\n\n'

    // Views section
    csv += 'PROFILE VIEWS\n'
    csv += 'Date,Advisor Name,Advisor ID\n'
    viewData.data?.forEach(view => {
      const advisorName = (view.advisors as any)?.name || 'Unknown'
      csv += `${format(new Date(view.created_at), 'yyyy-MM-dd HH:mm')},${advisorName},${view.advisor_id}\n`
    })
    csv += '\n\n'

    // Leads section
    csv += 'LEADS\n'
    csv += 'Date,Advisor Name,Parent Name,Email,Phone,Status\n'
    leadData.data?.forEach(lead => {
      const advisorName = (lead.advisors as any)?.name || 'Unknown'
      csv += `${format(new Date(lead.created_at), 'yyyy-MM-dd HH:mm')},${advisorName},"${lead.parent_name}",${lead.email},${lead.phone || 'N/A'},${lead.status}\n`
    })
    csv += '\n\n'

    // Reviews section
    csv += 'REVIEWS\n'
    csv += 'Date,Advisor Name,Rating,Title,Verified\n'
    reviewData.data?.forEach(review => {
      const advisorName = (review.advisors as any)?.name || 'Unknown'
      const title = review.title ? `"${review.title.replace(/"/g, '""')}"` : 'N/A'
      csv += `${format(new Date(review.created_at), 'yyyy-MM-dd HH:mm')},${advisorName},${review.rating},${title},${review.is_verified}\n`
    })

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/analytics/export:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
