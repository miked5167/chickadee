import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { calculateVerificationScore } from '@/lib/utils/verification'
import { sendClaimApprovalEmail } from '@/lib/utils/email'

export async function POST(request: NextRequest) {
  try {
    const { claimId, password } = await request.json()

    if (!claimId || !password) {
      return NextResponse.json(
        { error: 'Claim ID and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 12) {
      return NextResponse.json(
        { error: 'Password must be at least 12 characters long' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get the claim with advisor details
    const { data: claim, error: claimError } = await supabase
      .from('listing_claims')
      .select('*, advisors(id, name, slug, website_url, is_claimed)')
      .eq('id', claimId)
      .single()

    if (claimError || !claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }

    // Check if email was verified
    if (!claim.email_verified_at) {
      return NextResponse.json(
        { error: 'Email must be verified before setting up password' },
        { status: 400 }
      )
    }

    // Check if auth user already exists
    if (claim.auth_user_id) {
      return NextResponse.json(
        { error: 'Account already exists for this claim' },
        { status: 400 }
      )
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: claim.claimant_email,
      password: password,
      email_confirm: true, // Skip email confirmation since we already verified
      user_metadata: {
        name: claim.claimant_name,
        claimant: true,
        claim_id: claim.id
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)

      // Check if user already exists
      if (authError.message?.includes('already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please login instead.' },
          { status: 409 }
        )
      }

      throw authError
    }

    if (!authData.user) {
      throw new Error('User creation failed')
    }

    // Create public profile
    const { error: profileError } = await supabase
      .from('users_public')
      .insert({
        id: authData.user.id,
        display_name: claim.claimant_name,
        email: claim.claimant_email
      })

    if (profileError) {
      console.error('Error creating public profile:', profileError)
      // Don't fail the whole request if profile creation fails
    }

    // Link the auth user to the claim
    const { error: updateError } = await supabase
      .from('listing_claims')
      .update({
        auth_user_id: authData.user.id
      })
      .eq('id', claim.id)

    if (updateError) {
      console.error('Error linking auth user to claim:', updateError)
      throw updateError
    }

    // Calculate verification confidence score with new system
    const advisor = claim.advisors as any
    const verificationResult = calculateVerificationScore({
      email_verified_at: claim.email_verified_at,
      claimant_email: claim.claimant_email,
      claimant_phone: claim.claimant_phone,
      business_verification_info: claim.business_verification_info,
      website_url: advisor?.website_url || null,
    })

    // Update confidence score and metadata
    await supabase
      .from('listing_claims')
      .update({
        verification_confidence_score: verificationResult.score,
      })
      .eq('id', claim.id)

    let wasAutoApproved = false
    let finalStatus = claim.status

    // AUTO-APPROVAL LOGIC
    // If score >= 90, email verified, not disposable, and exact domain match
    if (
      verificationResult.autoApproveEligible &&
      claim.status === 'pending' &&
      !advisor?.is_claimed
    ) {
      // Approve the claim automatically
      const { error: approveClaimError } = await supabase
        .from('listing_claims')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          auto_approved: true,
          admin_notes: `Auto-approved: ${verificationResult.autoApproveReason}`,
        })
        .eq('id', claim.id)

      if (!approveClaimError) {
        // Update advisor record with claimed status
        const { error: approveAdvisorError } = await supabase
          .from('advisors')
          .update({
            is_claimed: true,
            claimed_by_user_id: authData.user.id,
          })
          .eq('id', claim.advisor_id)

        if (!approveAdvisorError) {
          wasAutoApproved = true
          finalStatus = 'approved'

          // Send approval email
          try {
            await sendClaimApprovalEmail(
              claim.claimant_email,
              claim.claimant_name,
              advisor.name,
              advisor.slug
            )
          } catch (emailError) {
            console.error('Error sending auto-approval email:', emailError)
          }
        }
      }
    }

    return NextResponse.json(
      {
        message: wasAutoApproved
          ? 'Account created and claim auto-approved!'
          : 'Account created successfully',
        userId: authData.user.id,
        email: claim.claimant_email,
        claimStatus: finalStatus,
        requiresApproval: finalStatus === 'pending',
        autoApproved: wasAutoApproved,
        confidenceScore: verificationResult.score,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error setting up password:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
