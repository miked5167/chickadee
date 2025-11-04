import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmailVerificationEmail } from '@/lib/utils/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get request body
    const body = await request.json()
    const { advisor_id, claimant_name, claimant_email, claimant_phone, verification_info } = body

    // Validation
    if (!advisor_id || !claimant_name || !claimant_email || !verification_info) {
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
    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('id, name, is_claimed, is_published')
      .eq('id', advisor_id)
      .single()

    if (advisorError || !advisor || !advisor.is_published) {
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
      console.error('Error creating claim:', claimError)
      return NextResponse.json(
        { error: 'Failed to submit claim request' },
        { status: 500 }
      )
    }

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

    return NextResponse.json(
      { success: true, claimId: claim.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/advisors/claim:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
