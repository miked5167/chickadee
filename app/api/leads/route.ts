import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { hashIpAddress } from '@/lib/utils/security'
import { sendLeadNotificationEmail, sendLeadConfirmationEmail } from '@/lib/utils/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Get request body
    const body = await request.json()
    const { advisor_id, parent_name, email, phone, child_age, message } = body

    // Validation
    if (!advisor_id || !parent_name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (message.length < 50) {
      return NextResponse.json(
        { error: 'Message must be at least 50 characters' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Verify advisor exists
    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('id, name, email, is_published')
      .eq('id', advisor_id)
      .single()

    if (advisorError || !advisor || !advisor.is_published) {
      return NextResponse.json(
        { error: 'Advisor not found' },
        { status: 404 }
      )
    }

    // Get IP address for rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown'
    const ipHash = hashIpAddress(ip)

    // Check rate limiting (5 submissions per hour per IP)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipHash)
      .gte('created_at', oneHourAgo)

    if (count && count >= 5) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      )
    }

    // Get user agent and referrer
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referrer = request.headers.get('referer') || null

    // Create lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert([
        {
          advisor_id,
          parent_name,
          parent_email: email,
          parent_phone: phone,
          child_age,
          message,
          status: 'new',
          ip_address: ipHash,
          user_agent: userAgent,
          referrer,
        },
      ])
      .select()
      .single()

    if (leadError) {
      console.error('Error creating lead:', leadError)
      return NextResponse.json(
        { error: 'Failed to submit form' },
        { status: 500 }
      )
    }

    // Send email notification to advisor
    try {
      await sendLeadNotificationEmail({
        advisorName: advisor.name,
        advisorEmail: advisor.email,
        parentName: parent_name,
        parentEmail: email,
        parentPhone: phone,
        childAge: child_age,
        message,
        leadId: lead.id,
      })

      // Send confirmation email to parent
      await sendLeadConfirmationEmail(email, parent_name, advisor.name)
    } catch (emailError) {
      // Log email errors but don't fail the request
      console.error('Error sending emails:', emailError)
    }

    return NextResponse.json(
      { success: true, leadId: lead.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/leads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
