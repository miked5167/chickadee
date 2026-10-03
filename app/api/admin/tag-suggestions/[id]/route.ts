import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { authorizeAdminRequest } from '@/lib/supabase/admin-api'
import { tagReviewSchema } from '@/lib/tags/validation'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await authorizeAdminRequest()
  if (!admin.ok) return admin.response
  const { id } = await context.params
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'Invalid suggestion ID.' }, { status: 400, headers })
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400, headers }) }
  const parsed = tagReviewSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid review.' }, { status: 400, headers })

  const review = parsed.data
  const { data, error } = await admin.authorization.supabase.rpc('review_directory_tag_suggestion', {
    p_suggestion_id: id, p_action: review.action,
    p_slug: review.action === 'approve' ? review.slug : null,
    p_label: review.action === 'approve' ? review.label : null,
    p_note: review.note || null,
  })
  if (error?.code === '42501') return NextResponse.json({ error: 'Access denied.' }, { status: 403, headers })
  if (error?.code === '22023') return NextResponse.json({ error: 'The suggestion was already reviewed or conflicts with an existing tag.' }, { status: 409, headers })
  if (error) return NextResponse.json({ error: 'The review could not be saved.' }, { status: 503, headers })
  revalidatePath('/listings')
  return NextResponse.json({ status: review.action === 'approve' ? 'approved' : 'rejected', tag_id: data }, { headers })
}
