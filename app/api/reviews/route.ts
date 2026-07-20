import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reviewSubmissionSchema } from '@/lib/reviews/validation'

const noStoreHeaders = { 'Cache-Control': 'no-store' }

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authenticationError } = await supabase.auth.getUser()

  if (authenticationError || !user) {
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401, headers: noStoreHeaders },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.' },
      { status: 400, headers: noStoreHeaders },
    )
  }

  const parsed = reviewSubmissionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Review is invalid.' },
      { status: 400, headers: noStoreHeaders },
    )
  }

  const { company_id: companyId, rating, title, review_text: reviewText } = parsed.data
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .maybeSingle()

  if (companyError || !company) {
    return NextResponse.json(
      { error: 'Company not found.' },
      { status: 404, headers: noStoreHeaders },
    )
  }

  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .insert({
      company_id: companyId,
      reviewer_user_id: user.id,
      rating,
      title: title ?? null,
      review_text: reviewText,
      experience_confirmed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (reviewError?.code === '23505') {
    return NextResponse.json(
      { error: 'You have already reviewed this company.' },
      { status: 409, headers: noStoreHeaders },
    )
  }

  if (reviewError || !review) {
    console.error('Failed to create company review:', reviewError)
    return NextResponse.json(
      { error: 'Review could not be submitted.' },
      { status: 500, headers: noStoreHeaders },
    )
  }

  return NextResponse.json(
    { reviewId: review.id, published: true },
    { status: 201, headers: noStoreHeaders },
  )
}
