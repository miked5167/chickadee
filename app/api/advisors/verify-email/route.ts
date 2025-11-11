import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Find the claim with this verification token
    const { data: claim, error: claimError } = await supabase
      .from('listing_claims')
      .select('*, advisors(name, email, website_url)')
      .eq('verification_token', token)
      .single()

    if (claimError || !claim) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Check if token is expired (24 hours)
    if (claim.verification_token_expires_at) {
      const expiresAt = new Date(claim.verification_token_expires_at)
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Verification token has expired. Please submit a new claim.' },
          { status: 400 }
        )
      }
    }

    // Check if already verified
    if (claim.email_verified_at) {
      return NextResponse.json(
        {
          message: 'Email already verified',
          claimId: claim.id,
          requiresPassword: !claim.auth_user_id
        },
        { status: 200 }
      )
    }

    // Mark email as verified
    const { error: updateError } = await supabase
      .from('listing_claims')
      .update({
        email_verified_at: new Date().toISOString(),
        verification_token: null, // Clear token after use
        verification_token_expires_at: null
      })
      .eq('id', claim.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(
      {
        message: 'Email verified successfully',
        claimId: claim.id,
        claimantEmail: claim.claimant_email,
        advisorName: claim.advisors?.name
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error verifying email:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Check if token is valid and not expired
    const { data: claim, error } = await supabase
      .from('listing_claims')
      .select('id, email_verified_at, verification_token_expires_at, claimant_email')
      .eq('verification_token', token)
      .single()

    if (error || !claim) {
      return NextResponse.json(
        { valid: false, error: 'Invalid token' },
        { status: 400 }
      )
    }

    // Check expiration
    if (claim.verification_token_expires_at) {
      const expiresAt = new Date(claim.verification_token_expires_at)
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { valid: false, error: 'Token expired' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      {
        valid: true,
        claimId: claim.id,
        alreadyVerified: !!claim.email_verified_at,
        email: claim.claimant_email
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error checking token:', error)
    return NextResponse.json(
      { valid: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
