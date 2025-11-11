import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendClaimApprovalEmail, sendClaimRejectionEmail } from '@/lib/utils/email'

// Mark as dynamic to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const claimId = id

    // Check admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()
    const { action, admin_notes } = body

    // Validate action
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Fetch claim details
    const { data: claim, error: claimError } = await supabase
      .from('listing_claims')
      .select(`
        id,
        advisor_id,
        claimant_name,
        claimant_email,
        status,
        auth_user_id,
        email_verified_at,
        advisors!listing_claims_advisor_id_fkey (
          id,
          name,
          slug,
          is_claimed
        )
      `)
      .eq('id', claimId)
      .single()

    if (claimError || !claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }

    // Check if claim is still pending
    if (claim.status !== 'pending') {
      return NextResponse.json(
        { error: 'This claim has already been reviewed' },
        { status: 409 }
      )
    }

    const advisor = claim.advisors as any

    if (action === 'approve') {
      // Check if advisor is already claimed
      if (advisor.is_claimed) {
        return NextResponse.json(
          { error: 'This listing has already been claimed by another user' },
          { status: 409 }
        )
      }

      // Check if email was verified and account was created
      if (!claim.email_verified_at) {
        return NextResponse.json(
          { error: 'Cannot approve claim: Claimant has not verified their email address yet' },
          { status: 400 }
        )
      }

      if (!claim.auth_user_id) {
        return NextResponse.json(
          { error: 'Cannot approve claim: Claimant has not completed account setup yet' },
          { status: 400 }
        )
      }

      // Update claim status
      const { error: updateClaimError } = await supabase
        .from('listing_claims')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          admin_notes: admin_notes || null,
        })
        .eq('id', claimId)

      if (updateClaimError) {
        console.error('Error updating claim:', updateClaimError)
        return NextResponse.json(
          { error: 'Failed to approve claim' },
          { status: 500 }
        )
      }

      // Update advisor record with claimed status AND link to auth user
      const { error: updateAdvisorError } = await supabase
        .from('advisors')
        .update({
          is_claimed: true,
          claimed_by_user_id: claim.auth_user_id, // FIX: Link the user account!
        })
        .eq('id', claim.advisor_id)

      if (updateAdvisorError) {
        console.error('Error updating advisor:', updateAdvisorError)
        return NextResponse.json(
          { error: 'Failed to update advisor record' },
          { status: 500 }
        )
      }

      // Send approval email
      try {
        await sendClaimApprovalEmail(
          claim.claimant_email,
          claim.claimant_name,
          advisor.name,
          advisor.slug
        )
      } catch (emailError) {
        console.error('Error sending approval email:', emailError)
      }

      return NextResponse.json(
        { success: true, message: 'Claim approved successfully' },
        { status: 200 }
      )
    } else if (action === 'reject') {
      // Update claim status
      const { error: updateClaimError } = await supabase
        .from('listing_claims')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          admin_notes: admin_notes || null,
        })
        .eq('id', claimId)

      if (updateClaimError) {
        console.error('Error updating claim:', updateClaimError)
        return NextResponse.json(
          { error: 'Failed to reject claim' },
          { status: 500 }
        )
      }

      // Send rejection email
      try {
        await sendClaimRejectionEmail(
          claim.claimant_email,
          claim.claimant_name,
          advisor.name,
          admin_notes || 'We were unable to verify your connection to this business.'
        )
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError)
      }

      return NextResponse.json(
        { success: true, message: 'Claim rejected successfully' },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('Error in PATCH /api/admin/claims/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
