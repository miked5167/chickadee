import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { reviewListQuerySchema } from '@/lib/reviews/validation'

const companyIdSchema = z.string().uuid()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!companyIdSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Company identifier is invalid.' }, { status: 400 })
  }

  const parsedQuery = reviewListQuerySchema.safeParse({
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    limit: request.nextUrl.searchParams.get('limit') ?? undefined,
    sort: request.nextUrl.searchParams.get('sort') ?? undefined,
  })
  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Review query is invalid.' }, { status: 400 })
  }

  const { page, limit, sort } = parsedQuery.data
  const offset = (page - 1) * limit
  const orderColumn = sort === 'newest' ? 'created_at' : 'rating'
  const ascending = sort === 'lowest'
  const supabase = await createClient()

  let query = supabase
    .from('reviews')
    .select('id, company_id, rating, title, review_text, experience_confirmed_at, created_at, updated_at', { count: 'exact' })
    .eq('company_id', id)
    .order(orderColumn, { ascending })

  if (orderColumn !== 'created_at') {
    query = query.order('created_at', { ascending: false })
  }

  const { data: reviews, count, error } = await query.range(offset, offset + limit - 1)
  if (error) {
    console.error('Failed to read company reviews:', error)
    return NextResponse.json({ error: 'Reviews could not be loaded.' }, { status: 500 })
  }

  return NextResponse.json(
    {
      reviews: reviews ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' },
    },
  )
}
