import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Auto-expiration cron job
 * This endpoint should be called daily by a cron service (e.g., Vercel Cron, GitHub Actions, or external cron job)
 * It unpublishes listings whose subscriptions have expired
 *
 * For security, you should add a CRON_SECRET environment variable and verify it here
 * Example with Vercel Cron in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/expire-subscriptions",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Find all published listings with expired subscriptions
    const { data: expiredListings, error: fetchError } = await supabase
      .from('advisors')
      .select('id, name, subscription_end_date')
      .eq('is_published', true)
      .not('subscription_end_date', 'is', null)
      .lt('subscription_end_date', new Date().toISOString())

    if (fetchError) {
      console.error('Error fetching expired listings:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch expired listings' },
        { status: 500 }
      )
    }

    if (!expiredListings || expiredListings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired subscriptions found',
        unpublished: 0,
      })
    }

    // Unpublish all expired listings
    const { data: updatedListings, error: updateError } = await supabase
      .from('advisors')
      .update({
        is_published: false,
        updated_at: new Date().toISOString()
      })
      .in('id', expiredListings.map(l => l.id))
      .select('id, name')

    if (updateError) {
      console.error('Error unpublishing expired listings:', updateError)
      return NextResponse.json(
        { error: 'Failed to unpublish expired listings' },
        { status: 500 }
      )
    }

    // Log the action
    console.log(`Auto-expiration: Unpublished ${updatedListings?.length || 0} expired listings`, {
      listings: updatedListings?.map(l => ({ id: l.id, name: l.name }))
    })

    return NextResponse.json({
      success: true,
      message: `Successfully unpublished ${updatedListings?.length || 0} expired listing(s)`,
      unpublished: updatedListings?.length || 0,
      listings: updatedListings?.map(l => ({ id: l.id, name: l.name }))
    })

  } catch (error) {
    console.error('Error in expire-subscriptions cron:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}
