import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hashIP } from '@/lib/utils/security'

/**
 * POST /api/advisors/[id]/track-click
 * Track clicks on external links (website, email, phone)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { click_type } = body

    // Validate click_type
    const validTypes = ['website', 'email', 'phone']
    if (!click_type || !validTypes.includes(click_type)) {
      return NextResponse.json(
        { error: 'Invalid click_type. Must be: website, email, or phone' },
        { status: 400 }
      )
    }

    // Get client IP
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown'
    const ipHash = hashIP(ip)

    // Get user agent and referrer
    const userAgent = request.headers.get('user-agent') || null
    const referrer = request.headers.get('referer') || null

    // Generate session ID (from cookies or create new)
    const sessionId = request.cookies.get('session_id')?.value ||
                      crypto.randomUUID()

    const supabase = await createClient()

    // Insert click tracking record
    const { error } = await supabase
      .from('click_tracking')
      .insert({
        advisor_id: id,
        click_type,
        ip_hash: ipHash,
        user_agent: userAgent,
        referrer,
        session_id: sessionId,
      })

    if (error) {
      console.error('Click tracking error:', error)
      // Don't return error to user - tracking failure shouldn't block user action
      return NextResponse.json({ success: true })
    }

    // Set session cookie if new
    const response = NextResponse.json({ success: true })
    if (!request.cookies.get('session_id')) {
      response.cookies.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
    }

    return response
  } catch (error) {
    console.error('Click tracking error:', error)
    // Don't return error to user - tracking failure shouldn't block user action
    return NextResponse.json({ success: true })
  }
}
