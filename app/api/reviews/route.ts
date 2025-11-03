import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to leave a review' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()
    const { advisor_id, rating, title, review_text, is_verified } = body

    // Validation
    if (!advisor_id || !rating || !review_text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (review_text.length < 50) {
      return NextResponse.json(
        { error: 'Review must be at least 50 characters' },
        { status: 400 }
      )
    }

    if (!is_verified) {
      return NextResponse.json(
        { error: 'You must confirm this is a genuine review' },
        { status: 400 }
      )
    }

    // Verify advisor exists and is published
    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('id, name, is_published')
      .eq('id', advisor_id)
      .single()

    if (advisorError || !advisor || !advisor.is_published) {
      return NextResponse.json(
        { error: 'Advisor not found' },
        { status: 404 }
      )
    }

    // Check for duplicate review (same user, same advisor)
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('advisor_id', advisor_id)
      .eq('reviewer_id', user.id)
      .single()

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this advisor' },
        { status: 409 }
      )
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert([
        {
          advisor_id,
          reviewer_id: user.id,
          rating,
          title: title || null,
          review_text,
          is_verified,
          is_published: true, // Auto-publish for now, can add moderation later
        },
      ])
      .select()
      .single()

    if (reviewError) {
      console.error('Error creating review:', reviewError)
      return NextResponse.json(
        { error: 'Failed to submit review' },
        { status: 500 }
      )
    }

    // The update_advisor_rating trigger will automatically update the advisor's rating

    return NextResponse.json(
      { success: true, reviewId: review.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
