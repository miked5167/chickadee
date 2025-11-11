import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmailVerificationEmail } from '@/lib/utils/email'
import crypto from 'crypto'

// Mark as dynamic to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('[CLAIM] Starting claim request...')
    const supabase = createAdminClient()

    // Get request body
    const body = await request.json()
    console.log('[CLAIM] Request body:', { ...body, verification_info: body.verification_info?.substring(0, 50) + '...' })
    const { advisor_id, claimant_name, claimant_email, claimant_phone, verification_info } = body

    // Validation
    if (!advisor_id || !claimant_name || !claimant_email || !verification_info) {
      console.error('[CLAIM] Missing required fields:', { advisor_id: !!advisor_id, claimant_name: !!claimant_name, claimant_email: !!claimant_email, verification_info: !!verification_info })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (verification_info.length < 50) {
      return NextResponse.json(
        { error: 'Verification information must be at least 50 characters' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(claimant_email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Verify advisor exists and is published
    console.log('[CLAIM] Looking up advisor:', advisor_id)
    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('id, name, is_claimed, is_published')
      .eq('id', advisor_id)
      .single()

    if (advisorError) {
      console.error('[CLAIM] Advisor lookup error:', advisorError)
    }
    console.log('[CLAIM] Advisor found:', advisor)

    if (advisorError || !advisor || !advisor.is_published) {
      console.error('[CLAIM] Advisor validation failed:', { advisorError: !!advisorError, advisor: !!advisor, is_published: advisor?.is_published })
      return NextResponse.json(
        { error: 'Advisor not found' },
        { status: 404 }
      )
    }

    // Check if advisor is already claimed
    if (advisor.is_claimed) {
      return NextResponse.json(
        { error: 'This listing has already been claimed' },
        { status: 409 }
      )
    }

    // Check for existing pending claim
    const { data: existingClaim } = await supabase
      .from('listing_claims')
      .select('id')
      .eq('advisor_id', advisor_id)
      .eq('status', 'pending')
      .single()

    if (existingClaim) {
      return NextResponse.json(
        { error: 'A claim for this listing is already pending review' },
        { status: 409 }
      )
    }

    // Generate secure verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Token expires in 24 hours

    // Create claim request with verification token
    console.log('[CLAIM] Creating claim in database...')
    const { data: claim, error: claimError } = await supabase
      .from('listing_claims')
      .insert([
        {
          advisor_id,
          claimant_name,
          claimant_email,
          claimant_phone,
          business_verification_info: verification_info,
          status: 'pending',
          verification_token: verificationToken,
          verification_token_expires_at: expiresAt.toISOString(),
        },
      ])
      .select()
      .single()

    if (claimError) {
      console.error('[CLAIM] Error creating claim:', claimError)
      console.error('[CLAIM] Claim error details:', JSON.stringify(claimError, null, 2))
      return NextResponse.json(
        { error: `Failed to submit claim request: ${claimError.message || claimError.code}` },
        { status: 500 }
      )
    }

    console.log('[CLAIM] Claim created successfully:', claim?.id)

    // Send email verification email to claimant
    try {
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`
      await sendEmailVerificationEmail(claimant_email, claimant_name, advisor.name, verificationUrl)
    } catch (emailError) {
      // Log email errors but don't fail the request
      console.error('Error sending verification email:', emailError)
      // Note: In production, you might want to fail the request if email fails
      // since the user needs the email to verify their account
    }

    console.log('[CLAIM] Request completed successfully')
    return NextResponse.json(
      { success: true, claimId: claim.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('[CLAIM] Unexpected error in POST /api/advisors/claim:', error)
    console.error('[CLAIM] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
