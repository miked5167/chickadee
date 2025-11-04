import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Add or update a reply to a review
 * PATCH /api/advisor/reviews/[id]/reply
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const reviewId = id

    // Get claimed advisor for this user
    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('id')
      .eq('claimed_by_user_id', user.id)
      .single()

    if (advisorError || !advisor) {
      return NextResponse.json(
        { error: 'No claimed advisor found for this user' },
        { status: 404 }
      )
    }

    // Check that review belongs to this advisor
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, advisor_id')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    if (review.advisor_id !== advisor.id) {
      return NextResponse.json(
        { error: 'Unauthorized to reply to this review' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { reply } = body

    if (!reply || reply.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reply text is required' },
        { status: 400 }
      )
    }

    // Validate reply length (max 1000 characters)
    if (reply.trim().length > 1000) {
      return NextResponse.json(
        { error: 'Reply must be 1000 characters or less' },
        { status: 400 }
      )
    }

    // Update review with reply
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        advisor_reply: reply.trim(),
        advisor_reply_at: new Date().toISOString(),
        advisor_reply_by: user.id,
      })
      .eq('id', reviewId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating review reply:', updateError)
      return NextResponse.json(
        { error: 'Failed to save reply' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        review: updatedReview,
        message: 'Reply saved successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PATCH /api/advisor/reviews/[id]/reply:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Delete a reply from a review
 * DELETE /api/advisor/reviews/[id]/reply
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const reviewId = id

    // Get claimed advisor for this user
    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('id')
      .eq('claimed_by_user_id', user.id)
      .single()

    if (advisorError || !advisor) {
      return NextResponse.json(
        { error: 'No claimed advisor found for this user' },
        { status: 404 }
      )
    }

    // Check that review belongs to this advisor
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, advisor_id')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    if (review.advisor_id !== advisor.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this reply' },
        { status: 403 }
      )
    }

    // Remove reply from review
    const { error: updateError } = await supabase
      .from('reviews')
      .update({
        advisor_reply: null,
        advisor_reply_at: null,
        advisor_reply_by: null,
      })
      .eq('id', reviewId)

    if (updateError) {
      console.error('Error deleting review reply:', updateError)
      return NextResponse.json(
        { error: 'Failed to delete reply' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Reply deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/advisor/reviews/[id]/reply:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
